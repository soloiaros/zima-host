#!/usr/bin/env bash
set -e

# ==============================================================================
# Zima Host - Remote Deploy to ZimaBoard Script
# ==============================================================================

BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

TARGET_HOST="$1"
TARGET_USER="${2:-root}"

if [ -z "$TARGET_HOST" ]; then
    echo -e "${RED}Usage: $0 <zimaboard-ip-or-hostname> [ssh-user]${NC}"
    echo -e "Example: $0 192.168.1.50"
    echo -e "Example: $0 zimaos.local root"
    exit 1
fi

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}${BOLD}==> Deploying Zima Host to ${TARGET_USER}@${TARGET_HOST}...${NC}\n"

# 1. Test SSH Connection
echo -e "📡 Testing SSH connection to ${TARGET_HOST}..."
if ! ssh -o ConnectTimeout=5 -o BatchMode=no "${TARGET_USER}@${TARGET_HOST}" "echo 'Connected successfully'" 2>/dev/null; then
    echo -e "${RED}❌ Unable to connect to ${TARGET_USER}@${TARGET_HOST} via SSH.${NC}"
    echo -e "Please verify the IP, check that SSH is enabled on your ZimaBoard, and try again."
    exit 1
fi

REMOTE_DIR="/DATA/AppData/zima-host/source"

# 2. Sync project files to remote ZimaBoard
echo -e "📤 Syncing project files to ${TARGET_HOST}:${REMOTE_DIR}..."
ssh "${TARGET_USER}@${TARGET_HOST}" "mkdir -p ${REMOTE_DIR} /DATA/AppData/zima-host/data"

rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'dist' \
    --exclude '*.log' \
    --exclude '*.db' \
    "${PROJECT_ROOT}/" "${TARGET_USER}@${TARGET_HOST}:${REMOTE_DIR}/"

# 3. Make installer executable and run on remote
echo -e "⚙️  Executing installer on ZimaBoard..."
ssh -t "${TARGET_USER}@${TARGET_HOST}" "bash ${REMOTE_DIR}/scripts/install-zimaos.sh"

echo -e "\n${GREEN}${BOLD} Deployment complete!${NC}"
