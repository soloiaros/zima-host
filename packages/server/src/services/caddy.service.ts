import fs from 'node:fs';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { config } from '../config.js';
import { getDb } from '../database.js';
import type { Domain } from '@zima-host/shared';

const execAsync = promisify(exec);

interface DomainRow {
  id: string;
  project_id: string;
  domain: string;
  ssl_enabled: number;
  created_at: string;
}

interface ProjectPortRow {
  port: number;
  name: string;
}

/**
 * Generate a Caddyfile from active domains and their project ports.
 */
export async function generateCaddyfile(): Promise<string> {
  const db = getDb();

  const rows = db
    .prepare(
      `SELECT d.domain, d.ssl_enabled, p.port, p.name
       FROM domains d
       JOIN projects p ON d.project_id = p.id
       WHERE p.status = 'running' AND p.port IS NOT NULL`,
    )
    .all() as (DomainRow & ProjectPortRow)[];

  if (rows.length === 0) {
    return '# No active domains configured\n';
  }

  const blocks = rows.map((row) => {
    const containerHost = `zima-${row.name}`;
    const upstream = `${containerHost}:${row.port}`;
    const scheme = row.ssl_enabled ? 'https' : 'http';
    const domainDirective = row.ssl_enabled
      ? row.domain
      : `http://${row.domain}`;

    return `${domainDirective} {
  reverse_proxy ${upstream}
  ${scheme === 'https' ? '' : '# '}encode gzip
}`;
  });

  return blocks.join('\n\n') + '\n';
}

/**
 * Write Caddyfile and reload Caddy.
 */
export async function updateCaddy(): Promise<void> {
  const content = await generateCaddyfile();
  fs.mkdirSync(config.dataDir, { recursive: true });
  fs.writeFileSync(config.caddyfilePath, content, 'utf-8');
  console.log(`[caddy] wrote Caddyfile to ${config.caddyfilePath}`);

  await reloadCaddy();
}

/**
 * Reload Caddy configuration. Tries the admin API first, falls back to CLI.
 */
async function reloadCaddy(): Promise<void> {
  try {
    const response = await fetch(`${config.caddy.adminApi}/load`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/caddyfile' },
      body: fs.readFileSync(config.caddyfilePath, 'utf-8'),
    });
    if (response.ok) {
      console.log('[caddy] reloaded via admin API');
      return;
    }
  } catch {
    // Admin API not available, try CLI
  }

  try {
    await execAsync(`caddy reload --config ${config.caddyfilePath}`);
    console.log('[caddy] reloaded via CLI');
  } catch (err) {
    console.warn('[caddy] reload failed (Caddy may not be running):', err);
  }
}

/**
 * Get all domains from the database, returning shared Domain type.
 */
export function getAllDomains(): Domain[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM domains ORDER BY created_at DESC').all() as DomainRow[];
  return rows.map(mapDomainRow);
}

/**
 * Add a domain mapping for a project.
 */
export function addDomain(id: string, projectId: string, domain: string, sslEnabled: boolean): Domain {
  const db = getDb();
  db.prepare(
    'INSERT INTO domains (id, project_id, domain, ssl_enabled) VALUES (?, ?, ?, ?)',
  ).run(id, projectId, domain, sslEnabled ? 1 : 0);

  const row = db.prepare('SELECT * FROM domains WHERE id = ?').get(id) as DomainRow;
  return mapDomainRow(row);
}

/**
 * Remove a domain by ID.
 */
export function removeDomain(id: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM domains WHERE id = ?').run(id);
  return result.changes > 0;
}

/**
 * Get a domain by ID.
 */
export function getDomainById(id: string): Domain | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM domains WHERE id = ?').get(id) as DomainRow | undefined;
  return row ? mapDomainRow(row) : undefined;
}

function mapDomainRow(row: DomainRow): Domain {
  return {
    id: row.id,
    projectId: row.project_id,
    domain: row.domain,
    sslEnabled: !!row.ssl_enabled,
    createdAt: row.created_at,
  };
}
