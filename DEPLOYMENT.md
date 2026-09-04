# Natuleaf Deployment Guide

## Current Status

- ✅ **Frontend builds**: Working (Vite production builds)
- ✅ **Backend ready**: Express.js app with PM2 management
- ✅ **Deploy script**: `scripts/deploy-server.sh` fully functional with SSH key handling
- ✅ **GitHub Actions deployment**: Uses a self-hosted runner with server network access

## Deployment Methods

### Option 1: Manual Deployment (RECOMMENDED)

Deploy directly from your local machine:

```bash
# From project root:
SSH_USER=root \
INTERSERVER_HOST=153.75.247.188 \
./scripts/deploy-server.sh 153.75.247.188
```

**Requirements:**
- SSH access to InterServer (port 22)
- SSH key at `~/.ssh/id_ed25519` or environment variable `SSH_PRIVATE_KEY`
- Network connectivity to 153.75.247.188:22

**What it does:**
1. Builds frontend with Vite
2. Compresses source code (excluding node_modules)
3. Sends to InterServer via SSH/tar
4. Installs dependencies (npm ci)
5. Starts PM2 services with ecosystem config
6. Reloads nginx configuration

### Option 2: GitHub Actions Workflows

#### CI Workflow (`ci.yml`)
- **Trigger**: Push to main/develop branches or manual trigger
- **Purpose**: Build verification and testing
- **Steps**: Install deps, build frontend, run security checks

Manually trigger or push code to run builds automatically.

#### Manual Deploy Workflow (`manual-deploy.yml`)
- **Trigger**: Manual workflow dispatch only
- **Purpose**: Build artifacts for local deployment
- **Steps**: Builds frontend, creates deployment bundle

Use this to prepare builds that you can then deploy manually.

### Option 3: Self-hosted GitHub Actions Deployment

To deploy automatically with GitHub Actions:

1. Install a GitHub Actions self-hosted runner on a trusted machine
2. Confirm that machine can connect to the InterServer SSH port
3. Add the repository secrets listed above
4. Push to `main` or manually run `self-hosted-deploy.yml`

Do not use a GitHub-hosted runner for production SSH deployment. Its network
path to InterServer is blocked and produces connection timeouts.

## Quick Start

```bash
# 1. Make code changes and commit
git add .
git commit -m "Update feature"
git push origin main

# 2. Verify builds pass (check GitHub Actions CI workflow)

# 3. Deploy from your machine
SSH_USER=root INTERSERVER_HOST=153.75.247.188 ./scripts/deploy-server.sh

# 4. Check live site
curl https://natuleaf.site/api/health || echo "Checking site..."
```

## Server Details

- **Host**: 153.75.247.188 (InterServer shared hosting)
- **SSH User**: root
- **App Port**: 4101
- **PM2 App Name**: natuleaf-storefront
- **Domains**: natuleaf.site, yr27.co.ke
- **Certificates**: Let's Encrypt at `/etc/letsencrypt/live/`
- **App Directory**: `/opt/natuleaf-storefront`

## Environment Variables Required

Set these in `backend/.env` or via GitHub Actions secrets:

```
INTERSERVER_HOST=153.75.247.188
INTERSERVER_USER=root
INTERSERVER_PRIVATE_KEY=your-ssh-private-key
APP_DOMAIN=natuleaf.site
CORS_ORIGIN=https://natuleaf.site,https://www.natuleaf.site
REMOTE_APP_DIR=/opt/natuleaf-storefront
TELEGRAM_BOT_TOKEN=your-token
TELEGRAM_CHAT_ID=your-chat-id
```

## Troubleshooting

### SSH Connection Timeout
- **Cause**: GitHub Actions runners blocked by InterServer firewall
- **Solution**: Deploy from your local machine instead

### Key Permission Denied
- **Cause**: SSH key has wrong permissions
- **Solution**: Run `chmod 600 ~/.ssh/id_ed25519`

### Frontend Not Updated
- **Cause**: Old browser cache
- **Solution**: Hard refresh (Ctrl+Shift+R) or clear cache

### PM2 App Won't Start
- **Cause**: Dependencies not installed
- **Solution**: SSH to server and run `npm ci` in `/opt/natuleaf-storefront`

## Monitoring

After deployment, verify:

```bash
# Check SSL certificate
curl -vI https://natuleaf.site

# Check backend health
curl https://natuleaf.site/api/health

# Check PM2 status (on server)
pm2 status

# View PM2 logs
pm2 logs natuleaf-storefront
```

## Files Modified

- `.github/workflows/auto-deploy.yml` - Now disabled with documentation
- `.github/workflows/ci.yml` - New CI/build verification workflow
- `.github/workflows/manual-deploy.yml` - New manual deployment helper
- `scripts/deploy-server.sh` - SSH key handling with base64 decoding
