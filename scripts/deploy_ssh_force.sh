#!/usr/bin/env bash
# Force-deploy frontend to a remote server via rsync+SSH and optionally purge Cloudflare.
# Usage (example):
#   export SSH_USER=ubuntu
#   export SSH_HOST=example.com
#   export TARGET_DIR=/var/www/greenstone-storefront
#   export SSH_KEY_PATH=~/.ssh/id_rsa
#   export SSH_PRIVATE_KEY_PATH=~/.ssh/id_rsa
#   export CLOUDFLARE_ZONE_ID=...
#   export CLOUDFLARE_API_TOKEN=...
#   ./scripts/deploy_ssh_force.sh

set -euo pipefail
BUILD_DIR=frontend/dist
if [ ! -d "$BUILD_DIR" ]; then
  echo "Build directory not found: $BUILD_DIR. Running build..."
  (cd frontend && npm run build --silent)
fi
if [ -z "${SSH_USER:-}" ] || [ -z "${SSH_HOST:-}" ] || [ -z "${TARGET_DIR:-}" ]; then
  echo "Please set SSH_USER, SSH_HOST, and TARGET_DIR environment variables."
  echo "Example: SSH_USER=ubuntu SSH_HOST=example.com TARGET_DIR=/var/www/greenstone-storefront ./scripts/deploy_ssh_force.sh"
  exit 1
fi
if [ "$(basename "$TARGET_DIR")" != "greenstone-storefront" ]; then
  echo "TARGET_DIR must be a dedicated greenstone-storefront directory, for example /var/www/greenstone-storefront." >&2
  exit 1
fi
SSH_KEY_FILE="${SSH_KEY_PATH:-${SSH_PRIVATE_KEY_PATH:-}}"
if [ -n "${SSH_PRIVATE_KEY_PATH:-}" ] && [ -z "${SSH_KEY_PATH:-}" ]; then
  SSH_KEY_FILE="$SSH_PRIVATE_KEY_PATH"
fi
if [ -n "${SSH_KEY_FILE:-}" ]; then
  echo "Using SSH key file: $SSH_KEY_FILE"
fi

echo "Uploading build to ${SSH_USER}@${SSH_HOST}:${TARGET_DIR} (this will delete remote files not present locally)..."
RSYNC_SSH_OPTS="-o StrictHostKeyChecking=no"
if [ -n "${SSH_KEY_FILE:-}" ]; then
  RSYNC_SSH_OPTS="$RSYNC_SSH_OPTS -i \"${SSH_KEY_FILE}\""
fi
rsync -avz --delete --exclude 'node_modules' --chmod=Du=rwx,Fu=rw -e "ssh $RSYNC_SSH_OPTS" "$BUILD_DIR/" "${SSH_USER}@${SSH_HOST}:${TARGET_DIR}/"

if ssh "${SSH_USER}@${SSH_HOST}" 'command -v systemctl >/dev/null 2>&1'; then
  echo "Reloading nginx on remote host (if available)..."
  ssh "${SSH_USER}@${SSH_HOST}" "sudo systemctl reload nginx || true"
fi

# Optionally purge Cloudflare cache
if [ -n "${CLOUDFLARE_ZONE_ID:-}" ] && [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "Purging Cloudflare cache for zone ${CLOUDFLARE_ZONE_ID}..."
  curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data '{"purge_everything":true}' | jq '.'
  echo "Cloudflare purge requested."
else
  echo "CLOUDFLARE_ZONE_ID or CLOUDFLARE_API_TOKEN not set; skipped Cloudflare purge."
fi

echo "Force deploy complete. Verify production: https://<your-site>"
