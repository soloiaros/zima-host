import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function initDatabase(): Database.Database {
  // Ensure data directory exists
  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });

  db = new Database(config.dbPath);

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL UNIQUE,
      type          TEXT NOT NULL CHECK(type IN ('static', 'node')),
      source_type   TEXT NOT NULL CHECK(source_type IN ('git', 'upload')),
      source_url    TEXT,
      branch        TEXT,
      port          INTEGER,
      container_id  TEXT,
      status        TEXT NOT NULL DEFAULT 'stopped' CHECK(status IN ('running', 'stopped', 'building', 'error')),
      env_vars      TEXT DEFAULT '{}',
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS domains (
      id            TEXT PRIMARY KEY,
      project_id    TEXT NOT NULL,
      domain        TEXT NOT NULL UNIQUE,
      ssl_enabled   INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
  }
}
