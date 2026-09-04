#!/usr/bin/env bash
# Usage: export VERCEL_TOKEN=...; ./scripts/deploy_vercel.sh
set -euo pipefail
BUILD_DIR=frontend/dist
if [ ! -d "$BUILD_DIR" ]; then
  echo "Build directory not found: $BUILD_DIR"
  exit 1
fi
if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "Set VERCEL_TOKEN"
  exit 1
fi
# Ensure Vercel CLI is installed: npm i -g vercel
VERCEL_TOKEN="$VERCEL_TOKEN" npx vercel --prod --confirm --prebuilt "$BUILD_DIR"

echo "Deployed to Vercel (token provided)"