import path from 'node:path';
import os from 'node:os';

const DATA_DIR = path.join(os.homedir(), '.zima-host');

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',

  dataDir: DATA_DIR,
  projectsDir: path.join(DATA_DIR, 'projects'),
  caddyfilePath: path.join(DATA_DIR, 'Caddyfile'),
  dbPath: path.join(DATA_DIR, 'zima-host.db'),

  docker: {
    network: process.env.DOCKER_NETWORK || 'zima-network',
    socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
  },

  caddy: {
    adminApi: process.env.CADDY_ADMIN_API || 'http://localhost:2019',
  },

  defaults: {
    branch: 'main',
    logTail: 100,
  },
} as const;
