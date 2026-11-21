# Zima Host

> Self-hosted zero-cost website management platform for ZimaBoard 2

A lightweight, beautiful, and self-hosted platform to manage and host all your websites on your ZimaBoard with zero recurring subscription fees. Deploy static sites and Node.js applications with one click, manage custom domains, and monitor resources — no terminal required.

---

## Features

- 📊 **Dashboard** — Real-time overview of all projects, container states, and hardware metrics (CPU, RAM, Disk).
- ➕ **One-Click Deployments** — Deploy static sites or Node.js apps from Git repositories or direct uploads.
- 🌐 **Custom Domains & Auto-SSL** — Automated Caddy reverse proxy provisioning free HTTPS via Let's Encrypt / ZeroSSL.
- ☁️ **Cloudflare Integration** — Works seamlessly with Cloudflare DNS proxying and Cloudflare Tunnels (no open router ports needed!).
- 🐳 **Docker Isolation** — Every website runs isolated in its own container on an internal bridge network.
- 📋 **Live Logs & Controls** — Real-time container log streaming and start/stop/restart/redeploy controls.
- 🖥️ **ZimaOS / CasaOS Native** — Formatted with `x-casaos` metadata to run directly as a native desktop application in ZimaOS.

---

## Native Installation on ZimaOS

### Method 1: Remote One-Line Deploy from Mac (Fastest)

Run the deployment script from your Mac terminal pointing to your ZimaBoard IP:

```bash
./scripts/deploy.sh <zimaboard-ip> [ssh-user]
# Example:
./scripts/deploy.sh 192.168.1.100 root
```

This will automatically synchronize the repository, build the container image on the ZimaBoard, and register Zima Host in ZimaOS.

---

### Method 2: ZimaOS Web UI "Custom Install"

1. Open your **ZimaOS Dashboard** (`http://<zimaboard-ip>`).
2. Go to **App Store** and click the **Install a customized app** button in the top-right corner.
3. Click the import button (or open `Apps/zima-host/docker-compose.yml`) and paste the contents of `Apps/zima-host/docker-compose.yml`.
4. Click **Install**.
5. Zima Host will appear directly on your ZimaOS home desktop!

---

### Method 3: Direct Shell on ZimaBoard

SSH into your ZimaBoard and run:

```bash
git clone https://github.com/your-username/zima-host.git /DATA/AppData/zima-host/source
cd /DATA/AppData/zima-host/source
bash scripts/install-zimaos.sh
```

---

## Cloudflare DNS & Zero-Cost Hosting Setup

Since your domains are already configured in Cloudflare, you have two zero-billing ways to route public traffic to your ZimaBoard:

### Option A: Cloudflare DNS (Direct A Record)
1. In your home router, port forward ports `80` and `443` to your ZimaBoard IP.
2. In Cloudflare DNS, add an **A Record** (e.g., `mysite.com` or `*.mysite.com`) pointing to your home public IP address, with the Cloudflare Proxy (`Orange Cloud`) enabled.
3. In **Zima Host UI** (`http://<zimaboard-ip>:3000`), open your project, go to the **Domains** tab, and enter `mysite.com`.
4. Caddy will automatically configure SSL and route traffic to your project container!

### Option B: Cloudflare Tunnel (Zero Port-Forwarding / Behind CGNAT)
If your ISP uses CGNAT or you prefer not opening ports on your home router:
1. In Cloudflare Zero Trust dashboard, create a free **Cloudflare Tunnel**.
2. Run `cloudflared` on ZimaOS via Docker.
3. Route your domain hostname (`mysite.com`) in the tunnel settings to `http://localhost:3000` or Caddy on `http://localhost:80`.
4. Cloudflare terminates SSL and securely tunnels traffic into your ZimaBoard with zero router configuration!

---

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons |
| Backend | Node.js, Express, TypeScript, WebSocket |
| Database | SQLite with WAL mode (`better-sqlite3`) |
| Container Engine | Docker (`dockerode`) |
| Reverse Proxy | Caddy 2 (automated HTTPS) |
| OS Platform | ZimaOS / CasaOS |

---

## Local Development

```bash
# Install dependencies
npm install

# Build shared types
npm run build -w packages/shared

# Start development servers (frontend on :5173, backend on :3000)
npm run dev
```

---

## License

MIT
