import Docker from 'dockerode';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import tar from 'tar-fs';
import { config } from '../config.js';
import { AppError } from '../middleware/error.js';
import { slugify, type ContainerStats } from '@zima-host/shared';

export { slugify };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docker = new Docker({ socketPath: config.docker.socketPath });

/**
 * Ensure the shared Docker network exists.
 */
export async function ensureNetwork(): Promise<void> {
  try {
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
  } catch (err: any) {
    console.warn(`[docker] network "${config.docker.network}" check/creation warning:`, err.message);
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
    path.join(config.dataDir, 'templates', projectType),
    path.resolve('/app/docker/templates', projectType),
    path.resolve(process.cwd(), 'docker/templates', projectType),
    path.resolve('docker/templates', projectType),
    path.resolve(__dirname, '../../../docker/templates', projectType),
    path.resolve(__dirname, '../../../../docker/templates', projectType),
    path.resolve(__dirname, '../../docker/templates', projectType),
  ];
  const templateDir = possibleDirs.find((d) => fs.existsSync(path.join(d, 'Dockerfile')));

  if (!templateDir) {
    throw new AppError(
      500,
      `No Dockerfile template found for project type "${projectType}". Searched locations: ${possibleDirs.join(', ')}`,
    );
  }

  // Copy template files into project directory (e.g. Dockerfile, nginx.conf)
  const templateFiles = fs.readdirSync(templateDir);
  for (const file of templateFiles) {
    fs.copyFileSync(path.join(templateDir, file), path.join(projectDir, file));
  }

  const slug = slugify(projectName);
  const imageName = `zima-${slug}:latest`;
  const tarStream = tar.pack(projectDir, {
    ignore: (name) => {
      const base = path.basename(name);
      return base === '.git' || base === 'node_modules';
    },
  });

  const stream = await docker.buildImage(tarStream as unknown as NodeJS.ReadableStream, {
    t: imageName,
  });

  // Wait for build to complete
  await new Promise<void>((resolve, reject) => {
    docker.modem.followProgress(
      stream,
      (err: Error | null, output: any[]) => {
        if (err) {
          return reject(err);
        }
        const errorItem = output?.find((item) => item?.error || item?.errorDetail);
        if (errorItem) {
          const detail = errorItem.errorDetail?.message || errorItem.error || 'Docker image build failed';
          return reject(new Error(detail));
        }
        resolve();
      },
      (progress: any) => {
        if (progress?.stream) {
          process.stdout.write(`[docker build:${slug}] ${progress.stream}`);
        }
      },
    );
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
  await ensureNetwork();

  const slug = slugify(projectName);
  const containerName = `zima-${slug}`;

  // Remove existing container with the same name if present
  try {
    const existing = docker.getContainer(containerName);
    await existing.stop().catch(() => {});
    await existing.remove({ force: true }).catch(() => {});
  } catch {
    // Container doesn't exist, that's fine
  }

  const env = Object.entries(envVars).map(([k, v]) => `${k}=${v}`);
  env.push(`PORT=${port}`);

  try {
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
  } catch (err: any) {
    throw new AppError(500, `Failed to create/start container "${containerName}": ${err.message}`);
  }
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
