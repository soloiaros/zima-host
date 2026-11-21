import os from 'node:os';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { SystemStats, ContainerStats } from '@zima-host/shared';
import { getContainerStats } from './docker.service.js';
import { getDb } from '../database.js';

const execAsync = promisify(exec);

interface ProjectRow {
  container_id: string;
  name: string;
}

/**
 * Get CPU usage by sampling /proc/stat style measurements.
 */
async function getCpuUsage(): Promise<number> {
  const cpus = os.cpus();
  const start = cpus.map((c) => ({
    idle: c.times.idle,
    total: Object.values(c.times).reduce((a, b) => a + b, 0),
  }));

  await new Promise((resolve) => setTimeout(resolve, 200));

  const cpus2 = os.cpus();
  const end = cpus2.map((c) => ({
    idle: c.times.idle,
    total: Object.values(c.times).reduce((a, b) => a + b, 0),
  }));

  let idleDiff = 0;
  let totalDiff = 0;
  for (let i = 0; i < start.length; i++) {
    idleDiff += end[i].idle - start[i].idle;
    totalDiff += end[i].total - start[i].total;
  }

  const usage = totalDiff > 0 ? ((totalDiff - idleDiff) / totalDiff) * 100 : 0;
  return Math.round(usage * 100) / 100;
}

/**
 * Get disk usage for the root filesystem via `df`.
 */
async function getDiskUsage(): Promise<{ used: number; total: number }> {
  try {
    const { stdout } = await execAsync("df -k / | tail -1 | awk '{print $3, $2}'");
    const [usedKb, totalKb] = stdout.trim().split(/\s+/).map(Number);
    return {
      used: usedKb * 1024,
      total: totalKb * 1024,
    };
  } catch {
    return { used: 0, total: 0 };
  }
}

/**
 * Get system-level resource stats.
 */
export async function getSystemStats(): Promise<SystemStats> {
  const [cpuUsage, disk] = await Promise.all([getCpuUsage(), getDiskUsage()]);

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  return {
    cpu: {
      usage: cpuUsage,
      cores: os.cpus().length,
    },
    memory: {
      used: usedMem,
      total: totalMem,
      percentage: Math.round((usedMem / totalMem) * 10000) / 100,
    },
    disk: {
      used: disk.used,
      total: disk.total,
      percentage:
        disk.total > 0
          ? Math.round((disk.used / disk.total) * 10000) / 100
          : 0,
    },
    uptime: os.uptime(),
  };
}

/**
 * Get basic system information.
 */
export function getSystemInfo(): Record<string, string | number> {
  return {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    release: os.release(),
    nodeVersion: process.version,
    uptime: os.uptime(),
    totalMemory: os.totalmem(),
    cpuModel: os.cpus()[0]?.model || 'unknown',
    cpuCores: os.cpus().length,
  };
}

/**
 * Get stats for all running containers.
 */
export async function getAllContainerStats(): Promise<ContainerStats[]> {
  const db = getDb();
  const projects = db
    .prepare("SELECT container_id, name FROM projects WHERE status = 'running' AND container_id IS NOT NULL")
    .all() as ProjectRow[];

  const stats = await Promise.allSettled(
    projects.map((p) => getContainerStats(p.container_id, p.name)),
  );

  return stats
    .filter((r): r is PromiseFulfilledResult<ContainerStats> => r.status === 'fulfilled')
    .map((r) => r.value);
}
