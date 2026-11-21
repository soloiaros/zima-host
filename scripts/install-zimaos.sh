#!/usr/bin/env bash
set -e

# ==============================================================================
# Zima Host - Native ZimaOS / CasaOS Installer
# ==============================================================================

BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check for root / sudo privileges
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}Notice: Root privileges are required to configure AppData and Docker.${NC}"
    echo -e "Escalating with sudo...\n"
    exec sudo -E bash "$0" "$@"
fi

echo -e "${BLUE}${BOLD}"
echo "  ______ _                    _    _           _   "
echo " |___  /(_)                  | |  | |         | |  "
echo "    / /  _ _ __ ___   __ _   | |__| | ___  ___| |_ "
echo "   / /  | | '_ \` _ \ / _\` |  |  __  |/ _ \/ __| __|"
echo "  / /__ | | | | | | | (_| |  | |  | | (_) \__ \ |_ "
echo " /_____||_|_| |_| |_|\__,_|  |_|  |_|\___/|___/\__|"
echo -e "${NC}"
echo -e "${BOLD}Installing Zima Host as a native ZimaOS application...${NC}\n"

# 1. Determine paths
DATA_ROOT="${ZIMA_DATA_ROOT:-/DATA/AppData/zima-host}"
APP_DATA_DIR="${DATA_ROOT}/data"
CADDY_DATA_DIR="${DATA_ROOT}/caddy_data"
CADDY_CONFIG_DIR="${DATA_ROOT}/caddy_config"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ZimaOS uses an immutable/read-only root filesystem (/root is read-only).
# Route Docker CLI config, cache, and temporary files to writable /DATA partition.
export DOCKER_CONFIG="${DATA_ROOT}/.docker"
export XDG_CONFIG_HOME="${DATA_ROOT}/.config"
export XDG_CACHE_HOME="${DATA_ROOT}/.cache"
export TMPDIR="/tmp"

echo -e "📂 Target Data Directory: ${BLUE}${DATA_ROOT}${NC}"
mkdir -p "${APP_DATA_DIR}/projects" "${APP_DATA_DIR}/templates" "${CADDY_DATA_DIR}" "${CADDY_CONFIG_DIR}" "${DOCKER_CONFIG}" "${XDG_CONFIG_HOME}" "${XDG_CACHE_HOME}"

# 2. Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed or not in PATH.${NC}"
    exit 1
fi

# 3. Create initial Caddyfile if not already present
if [ ! -f "${APP_DATA_DIR}/Caddyfile" ]; then
    echo -e "📝 Initializing Caddy configuration..."
    cat <<'EOF' > "${APP_DATA_DIR}/Caddyfile"
# Zima Host - Managed Caddyfile
{
  admin localhost:2019
}

:3000 {
  reverse_proxy zima-host:3000
}
EOF
fi

# 4. Copy templates if running from source repository
if [ -d "${PROJECT_DIR}/docker/templates" ]; then
    echo -e "📦 Copying Docker build templates to app storage..."
    cp -r "${PROJECT_DIR}/docker/templates"/* "${APP_DATA_DIR}/templates/" 2>/dev/null || true
fi

# 5. Build or load Docker image
echo -e "🔨 Building Zima Host image locally on ZimaBoard..."
cd "${PROJECT_DIR}"
docker build -t zima-host:latest .

# 6. Ensure Docker network exists
if ! docker network ls | grep -q "zima-network"; then
    echo -e "🌐 Creating Docker network: zima-network..."
    docker network create zima-network
fi

# 7. Register and launch in CasaOS / ZimaOS
echo -e "🚀 Starting Zima Host stack..."
export ZIMA_DATA_DIR="${APP_DATA_DIR}"
docker compose -f "${PROJECT_DIR}/docker-compose.yml" up -d

# 8. Check if CasaOS CLI is present for UI registration
if command -v casaos-cli &> /dev/null; then
    echo -e "📱 Registering Zima Host in ZimaOS Dashboard..."
    casaos-cli app-management install -f "${PROJECT_DIR}/Apps/zima-host/docker-compose.yml" 2>/dev/null || casaos-cli app-management apply zima-host -f "${PROJECT_DIR}/Apps/zima-host/docker-compose.yml" 2>/dev/null || true
fi

# 9. Get Host IP
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

echo -e "\n${GREEN}${BOLD}🎉 Zima Host successfully installed and running!${NC}\n"
echo -e "• Dashboard:       ${BOLD}http://${LOCAL_IP}:3000${NC}"
echo -e "• ZimaOS UI:       ${BOLD}http://${LOCAL_IP}:8080${NC} (Find Zima Host on your desktop)"
echo -e "• App Storage:     ${BLUE}${DATA_ROOT}${NC}"
echo -e "• Caddyfile:       ${BLUE}${APP_DATA_DIR}/Caddyfile${NC}"
echo ""
echo -e "${YELLOW}Next Steps with Cloudflare:${NC}"
echo -e "1. Open http://${LOCAL_IP}:3000 to add your first website."
echo -e "2. In Cloudflare DNS, point your domain (or wildcard subdomain) to your home IP."
echo -e "3. Add your domain inside the Zima Host UI — Caddy will automatically provision HTTPS!"
