import fs from 'node:fs';
import path from 'node:path';
import simpleGit from 'simple-git';
import { nanoid } from 'nanoid';
import { config } from '../config.js';
import { getDb } from '../database.js';
import { AppError } from '../middleware/error.js';
import * as dockerService from './docker.service.js';
import * as caddyService from './caddy.service.js';
import type { Project, CreateProjectRequest, UpdateProjectRequest } from '@zima-host/shared';

interface ProjectRow {
  id: string;
  name: string;
  type: string;
  source_type: string;
  source_url: string | null;
  branch: string | null;
  port: number | null;
  container_id: string | null;
  status: string;
  env_vars: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    type: row.type as Project['type'],
    sourceType: row.source_type as Project['sourceType'],
    sourceUrl: row.source_url || undefined,
    branch: row.branch || undefined,
    port: row.port || undefined,
    containerId: row.container_id || undefined,
    status: row.status as Project['status'],
    envVars: JSON.parse(row.env_vars || '{}'),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Assign a unique port for a new project (starting from 4001).
 */
function assignPort(): number {
  const db = getDb();
  const row = db
    .prepare('SELECT MAX(port) as maxPort FROM projects')
    .get() as { maxPort: number | null };
  return (row.maxPort || 4000) + 1;
}

export function getAllProjects(): Project[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM projects ORDER BY created_at DESC')
    .all() as ProjectRow[];
  return rows.map(mapRow);
}

export function getProjectById(id: string): Project | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as ProjectRow | undefined;
  return row ? mapRow(row) : undefined;
}

/**
 * Create a new project: clone repo (if git), insert DB record.
 */
export async function createProject(req: CreateProjectRequest): Promise<Project> {
  const db = getDb();
  const id = nanoid();
  const port = assignPort();
  const projectDir = path.join(config.projectsDir, id);

  fs.mkdirSync(projectDir, { recursive: true });

  // Clone git repo if source_type is 'git'
  if (req.sourceType === 'git') {
    if (!req.sourceUrl) {
      throw new AppError(400, 'sourceUrl is required for git projects');
    }
    const git = simpleGit();
    const branch = req.branch || config.defaults.branch;
    await git.clone(req.sourceUrl, projectDir, ['--branch', branch, '--single-branch']);
  }

  db.prepare(
    `INSERT INTO projects (id, name, type, source_type, source_url, branch, port, status, env_vars)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'stopped', ?)`,
  ).run(
    id,
    req.name,
    req.type,
    req.sourceType,
    req.sourceUrl || null,
    req.branch || config.defaults.branch,
    port,
    JSON.stringify(req.envVars || {}),
  );

  return getProjectById(id)!;
}

/**
 * Update a project.
 */
export function updateProject(id: string, req: UpdateProjectRequest): Project {
  const db = getDb();
  const existing = getProjectById(id);
  if (!existing) {
    throw new AppError(404, 'Project not found');
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  if (req.name !== undefined) {
    fields.push('name = ?');
    values.push(req.name);
  }
  if (req.envVars !== undefined) {
    fields.push('env_vars = ?');
    values.push(JSON.stringify(req.envVars));
  }
  if (req.branch !== undefined) {
    fields.push('branch = ?');
    values.push(req.branch);
  }

  if (fields.length === 0) {
    return existing;
  }

  fields.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getProjectById(id)!;
}

/**
 * Delete a project: stop container, remove image, clean files and DB record.
 */
export async function deleteProject(id: string): Promise<void> {
  const project = getProjectById(id);
  if (!project) {
    throw new AppError(404, 'Project not found');
  }

  // Stop and remove container
  if (project.containerId) {
    await dockerService.removeContainer(project.containerId).catch(() => {});
  }

  // Remove Docker image
  await dockerService.removeImage(`zima-${project.name}:latest`).catch(() => {});

  // Remove project files
  const projectDir = path.join(config.projectsDir, id);
  if (fs.existsSync(projectDir)) {
    fs.rmSync(projectDir, { recursive: true, force: true });
  }

  // Delete from database (cascades to domains)
  const db = getDb();
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);

  // Update Caddy
  await caddyService.updateCaddy().catch(() => {});
}

/**
 * Build and deploy a project: build Docker image, create container, update Caddy.
 */
export async function deployProject(id: string): Promise<Project> {
  const db = getDb();
  const project = getProjectById(id);
  if (!project) {
    throw new AppError(404, 'Project not found');
  }

  // Set status to building
  db.prepare("UPDATE projects SET status = 'building', updated_at = datetime('now') WHERE id = ?").run(id);

  try {
    // If git, do a pull to get latest
    if (project.sourceType === 'git' && project.sourceUrl) {
      const projectDir = path.join(config.projectsDir, id);
      const git = simpleGit(projectDir);
      await git.pull();
    }

    // Remove old container if exists
    if (project.containerId) {
      await dockerService.removeContainer(project.containerId).catch(() => {});
    }

    // Build image
    const imageName = await dockerService.buildImage(id, project.name, project.type);

    // Create and start container
    const containerId = await dockerService.createContainer(
      project.name,
      imageName,
      project.port!,
      project.envVars || {},
    );

    // Update DB
    db.prepare(
      "UPDATE projects SET container_id = ?, status = 'running', updated_at = datetime('now') WHERE id = ?",
    ).run(containerId, id);

    // Update Caddy config
    await caddyService.updateCaddy().catch(() => {});

    return getProjectById(id)!;
  } catch (err) {
    db.prepare("UPDATE projects SET status = 'error', updated_at = datetime('now') WHERE id = ?").run(id);
    throw err;
  }
}

/**
 * Start a project's container.
 */
export async function startProject(id: string): Promise<Project> {
  const db = getDb();
  const project = getProjectById(id);
  if (!project) throw new AppError(404, 'Project not found');
  if (!project.containerId) throw new AppError(400, 'Project has no container. Deploy it first.');

  await dockerService.startContainer(project.containerId);
  db.prepare("UPDATE projects SET status = 'running', updated_at = datetime('now') WHERE id = ?").run(id);
  await caddyService.updateCaddy().catch(() => {});
  return getProjectById(id)!;
}

/**
 * Stop a project's container.
 */
export async function stopProject(id: string): Promise<Project> {
  const db = getDb();
  const project = getProjectById(id);
  if (!project) throw new AppError(404, 'Project not found');
  if (!project.containerId) throw new AppError(400, 'Project has no container.');

  await dockerService.stopContainer(project.containerId);
  db.prepare("UPDATE projects SET status = 'stopped', updated_at = datetime('now') WHERE id = ?").run(id);
  await caddyService.updateCaddy().catch(() => {});
  return getProjectById(id)!;
}

/**
 * Restart a project's container.
 */
export async function restartProject(id: string): Promise<Project> {
  const db = getDb();
  const project = getProjectById(id);
  if (!project) throw new AppError(404, 'Project not found');
  if (!project.containerId) throw new AppError(400, 'Project has no container.');

  await dockerService.restartContainer(project.containerId);
  db.prepare("UPDATE projects SET status = 'running', updated_at = datetime('now') WHERE id = ?").run(id);
  return getProjectById(id)!;
}

/**
 * Get container logs for a project.
 */
export async function getProjectLogs(id: string, tail?: number): Promise<string> {
  const project = getProjectById(id);
  if (!project) throw new AppError(404, 'Project not found');
  if (!project.containerId) throw new AppError(400, 'Project has no container.');

  return dockerService.getContainerLogs(project.containerId, tail || config.defaults.logTail);
}
