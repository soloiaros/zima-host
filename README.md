# Zima Host

> Self-hosted website management panel for ZimaBoard 2

A zero-cost, self-hosted platform to manage all your websites from a single, beautiful dashboard. Deploy static sites and Node.js applications with one click, manage domains, and monitor resources — no terminal required.

## Features

- 📊 **Dashboard** — Real-time overview of all projects and system resources
- ➕ **One-Click Deploy** — Set up static or Node.js projects from Git or file upload
- 🌐 **Domain Management** — Attach your domains with automatic Caddy reverse proxy
- 🔒 **Auto-SSL** — Free HTTPS via Let's Encrypt, managed by Caddy
- 🐳 **Docker Isolation** — Each project runs in its own container
- 📈 **Monitoring** — CPU, RAM, and disk usage per project
- 📋 **Live Logs** — Stream container logs in real time via WebSocket

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend  | React 18, TypeScript, Vite, Tailwind CSS |
| Backend   | Node.js, Express, TypeScript |
| Database  | SQLite (via better-sqlite3) |
| Containers| Docker (via Dockerode) |
| Proxy     | Caddy (auto-HTTPS) |

## Getting Started

### Prerequisites

- Node.js >= 20
- Docker
- npm

### Development

```bash
# Install dependencies
npm install

# Build shared types
npm run build -w packages/shared

# Start development servers
npm run dev
```

The client runs on `http://localhost:5173` and proxies API requests to the server on port `3000`.

### Production

```bash
# Build everything
npm run build

# Start the server (serves both API and built client)
npm start
```

### Docker Deployment

```bash
docker compose up -d
```

## Project Structure

```
zima-host/
├── packages/
│   ├── shared/      # Shared TypeScript types
│   ├── server/      # Express API backend
│   └── client/      # React frontend
├── docker/          # Docker templates & Caddy config
├── docker-compose.yml
└── README.md
```

## License

MIT
