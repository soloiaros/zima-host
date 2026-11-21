import Docker from 'dockerode';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import tar from 'tar-fs';
import { config } from '../config.js';
import type { ContainerStats } from '@zima-host/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docker = new Docker({ socketPath: config.docker.socketPath });

/**
 * Ensure the shared Docker network exists.
 */
export async function ensureNetwork(): Promise<void> {
  const networks = await docker.listNetworks({
    filters: { name: [config.docker.network] },
  });
  const exists = networks.some((n) => n.Name === config.docker.network);
  if (!exists) {
    await docker.createNetwork({
      Name: config.docker.network,
      Driver: 'bridge',
    });
    console.log(`[docker] created network "${config.docker.network}"`);
  }
}

/**
 * Build a Docker image for a project by copying the appropriate
 * Dockerfile template into the project directory and streaming
 * the build context to the Docker daemon.
 */
export async function buildImage(
  projectId: string,
  projectName: string,
  projectType: string,
): Promise<string> {
  const projectDir = path.join(config.projectsDir, projectId);

  const possibleDirs = [
    path.resolve('docker/templates', projectType),
    path.resolve(process.cwd(), 'docker/templates', projectType),
    path.resolve(__dirname, '../../../docker/templates', projectType),
    path.resolve(__dirname, '../../../../docker/templates', projectType),
  ];
  const templateDir = possibleDirs.find((d) => fs.existsSync(path.join(d, 'Dockerfile')));

  if (!templateDir) {
    throw new Error(`No Dockerfile template found for project type "${projectType}"`);
  }

  // Copy template files into project directory (e.g. Dockerfile, nginx.conf)
  const templateFiles = fs.readdirSync(templateDir);
  for (const file of templateFiles) {
    fs.copyFileSync(path.join(templateDir, file), path.join(projectDir, file));
  }

  const imageName = `zima-${projectName}:latest`;
  const tarStream = tar.pack(projectDir);

  const stream = await docker.buildImage(tarStream as unknown as NodeJS.ReadableStream, {
    t: imageName,
  });

  // Wait for build to complete
  await new Promise<void>((resolve, reject) => {
    docker.modem.followProgress(stream, (err: Error | null) => {
      if (err) reject(err);
      else resolve();
    });
  });

  return imageName;
}

/**
 * Create and start a container for a project.
 */
export async function createContainer(
  projectName: string,
  imageName: string,
  port: number,
  envVars: Record<string, string> = {},
): Promise<string> {
  const containerName = `zima-${projectName}`;

  // Remove existing container with the same name if present
  try {
    const existing = docker.getContainer(containerName);
    await existing.stop().catch(() => {});
    await existing.remove({ force: true });
  } catch {
    // Container doesn't exist, that's fine
  }

  const env = Object.entries(envVars).map(([k, v]) => `${k}=${v}`);
  env.push(`PORT=${port}`);

  const container = await docker.createContainer({
    Image: imageName,
    name: containerName,
    Env: env,
    ExposedPorts: { [`${port}/tcp`]: {} },
    HostConfig: {
      PortBindings: {
        [`${port}/tcp`]: [{ HostPort: String(port) }],
      },
      NetworkMode: config.docker.network,
      RestartPolicy: { Name: 'unless-stopped' },
    },
  });

  await container.start();
  return container.id;
}

export async function startContainer(containerId: string): Promise<void> {
  const container = docker.getContainer(containerId);
  await container.start();
}

export async function stopContainer(containerId: string): Promise<void> {
  const container = docker.getContainer(containerId);
  await container.stop();
}

export async function restartContainer(containerId: string): Promise<void> {
  const container = docker.getContainer(containerId);
  await container.restart();
}

export async function removeContainer(containerId: string): Promise<void> {
  const container = docker.getContainer(containerId);
  await container.stop().catch(() => {});
  await container.remove({ force: true });
}

export async function removeImage(imageName: string): Promise<void> {
  try {
    const image = docker.getImage(imageName);
    await image.remove({ force: true });
  } catch {
    // Image may not exist
  }
}

/**
 * Get container logs.
 */
export async function getContainerLogs(
  containerId: string,
  tail: number = 100,
): Promise<string> {
  const container = docker.getContainer(containerId);
  const logs = await container.logs({
    stdout: true,
    stderr: true,
    tail,
    timestamps: true,
  });
  return logs.toString();
}

/**
 * Get stats for a single container.
 */
export async function getContainerStats(
  containerId: string,
  containerName: string,
): Promise<ContainerStats> {
  const container = docker.getContainer(containerId);
  const stats = (await container.stats({ stream: false })) as Record<string, any>;

  const cpuDelta =
    stats.cpu_stats.cpu_usage.total_usage -
    stats.precpu_stats.cpu_usage.total_usage;
  const systemDelta =
    stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
  const numCpus = stats.cpu_stats.online_cpus || 1;
  const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * numCpus * 100 : 0;

  const memUsed = stats.memory_stats.usage || 0;
  const memLimit = stats.memory_stats.limit || 0;

  const networks = stats.networks || {};
  let rx = 0;
  let tx = 0;
  for (const iface of Object.values(networks) as any[]) {
    rx += iface.rx_bytes || 0;
    tx += iface.tx_bytes || 0;
  }

  return {
    containerId,
    name: containerName,
    cpu: Math.round(cpuPercent * 100) / 100,
    memory: { used: memUsed, limit: memLimit },
    network: { rx, tx },
  };
}
