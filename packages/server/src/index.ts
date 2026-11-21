import express from 'express';
import expressWs from 'express-ws';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { config } from './config.js';
import { initDatabase } from './database.js';
import { ensureNetwork } from './services/docker.service.js';
import * as monitorService from './services/monitor.service.js';
import { projectsRouter } from './routes/projects.js';
import { domainsRouter } from './routes/domains.js';
import { systemRouter } from './routes/system.js';
import { errorHandler } from './middleware/error.js';
import type { WsMessage, SystemStats, ContainerStats } from '@zima-host/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database
initDatabase();

// Ensure docker network exists (non-blocking)
ensureNetwork().catch((err) => {
  console.warn('[docker] Could not connect to Docker daemon or create network:', err.message);
});

// Setup Express app with WebSocket support
const wsApp = expressWs(express());
const app = wsApp.app;
const wss = wsApp.getWss();

// Middleware
app.use(cors());
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible websocket & UI loading
  }),
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/projects', projectsRouter);
app.use('/api/domains', domainsRouter);
app.use('/api/system', systemRouter);

// WebSocket endpoint at /ws
app.ws('/ws', (ws) => {
  console.log('[ws] client connected');

  // Send immediate initial stats
  monitorService
    .getSystemStats()
    .then((stats) => {
      const msg: WsMessage<SystemStats> = {
        event: 'system:stats',
        data: stats,
        timestamp: new Date().toISOString(),
      };
      if (ws.readyState === 1) {
        ws.send(JSON.stringify(msg));
      }
    })
    .catch(() => {});

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.event === 'ping') {
        ws.send(JSON.stringify({ event: 'pong', timestamp: new Date().toISOString() }));
      }
    } catch {
      // Ignore non-json messages
    }
  });

  ws.on('close', () => {
    console.log('[ws] client disconnected');
  });
});

// Broadcast periodic system & container stats to all connected WebSocket clients
const statsInterval = setInterval(async () => {
  if (wss.clients.size === 0) return;

  try {
    const [sysStats, contStats] = await Promise.all([
      monitorService.getSystemStats(),
      monitorService.getAllContainerStats(),
    ]);

    const sysMsg: WsMessage<SystemStats> = {
      event: 'system:stats',
      data: sysStats,
      timestamp: new Date().toISOString(),
    };

    const contMsg: WsMessage<ContainerStats[]> = {
      event: 'container:stats',
      data: contStats,
      timestamp: new Date().toISOString(),
    };

    const sysPayload = JSON.stringify(sysMsg);
    const contPayload = JSON.stringify(contMsg);

    for (const client of wss.clients) {
      if (client.readyState === 1) {
        client.send(sysPayload);
        client.send(contPayload);
      }
    }
  } catch {
    // Ignore periodic monitoring fetch errors
  }
}, 3000);

// Cleanup on process shutdown
process.on('SIGTERM', () => clearInterval(statsInterval));
process.on('SIGINT', () => clearInterval(statsInterval));

// Serve static client build in production
const possibleDistPaths = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(process.cwd(), 'packages/client/dist'),
  path.resolve('/app/packages/client/dist'),
];

const clientDist = possibleDistPaths.find((p) => fs.existsSync(p));

if (clientDist) {
  console.log(`[server] serving client static files from ${clientDist}`);
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Error handling middleware (must be registered last)
app.use(errorHandler);

// Start listening
app.listen(config.port, config.host, () => {
  console.log(`[server] Zima Host backend running on http://${config.host}:${config.port}`);
});

export { app };
