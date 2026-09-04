#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

REQUIRED=(PROD_HOST)
MISSING=()
for VAR in "${REQUIRED[@]}"; do
  if [ -z "${!VAR:-}" ]; then
    MISSING+=("$VAR")
  fi
done

if [ "${#MISSING[@]}" -ne 0 ]; then
  echo "Missing required environment variables: ${MISSING[*]}"
  echo "Set PROD_HOST and rerun this script."
  exit 1
fi

if [ ! -d "frontend/dist" ]; then
  echo "Frontend build not found. Building..."
  cd frontend
  npm ci
  npm run build --silent
  cd ..
fi

LOCAL_JS_FILE="$(ls frontend/dist/assets/index-*.js | head -n1)"
if [ ! -f "$LOCAL_JS_FILE" ]; then
  echo "Local JS bundle not found: $LOCAL_JS_FILE"
  exit 1
fi

LOCAL_SHA="$(sha256sum "$LOCAL_JS_FILE" | awk '{print $1}')"
REMOTE_URL="https://${PROD_HOST}/assets/$(basename "$LOCAL_JS_FILE")"

echo "Local JS: $LOCAL_JS_FILE"
echo "Local SHA: $LOCAL_SHA"
echo "Downloading production asset from $REMOTE_URL"

TMP_FILE="$(mktemp)"
trap 'rm -f "$TMP_FILE"' EXIT

if ! curl -sfL "$REMOTE_URL" -o "$TMP_FILE"; then
  echo "Failed to download production asset from $REMOTE_URL"
  exit 1
fi

PROD_SHA="$(sha256sum "$TMP_FILE" | awk '{print $1}')"
echo "Prod SHA:  $PROD_SHA"

echo "$LOCAL_SHA" > local_sha.txt
echo "$PROD_SHA" > prod_sha.txt

if [ "$LOCAL_SHA" = "$PROD_SHA" ]; then
  echo "Production asset matches local build."
  exit 0
fi

echo "Production asset differs from local build."
exit 2
