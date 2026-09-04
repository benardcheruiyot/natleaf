#!/usr/bin/env bash
# Usage: export NETLIFY_AUTH_TOKEN=...; export NETLIFY_SITE_ID=...; ./scripts/deploy_netlify.sh
set -euo pipefail
BUILD_DIR=frontend/dist
if [ ! -d "$BUILD_DIR" ]; then
  echo "Build directory not found: $BUILD_DIR"
  exit 1
fi
if [ -z "${NETLIFY_AUTH_TOKEN:-}" ]; then
  echo "Set NETLIFY_AUTH_TOKEN"
  exit 1
fi
if [ -z "${NETLIFY_SITE_ID:-}" ]; then
  echo "Set NETLIFY_SITE_ID"
  exit 1
fi
npx netlify deploy --auth $NETLIFY_AUTH_TOKEN --site $NETLIFY_SITE_ID --prod --dir "$BUILD_DIR"

echo "Deployed to Netlify site: $NETLIFY_SITE_ID"