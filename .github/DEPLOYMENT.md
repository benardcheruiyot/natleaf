# Deployment setup

Add these GitHub repository secrets:

- INTERSERVER_HOST: your server IP or hostname
- INTERSERVER_USER: SSH username
- INTERSERVER_PRIVATE_KEY: private SSH key for the server (recommended; use key-based auth instead of a password)
- The self-hosted GitHub Actions runner must have network access to the server.

Optional values:
- INTERSERVER_PORT: SSH port, defaults to `22`
- APP_DOMAIN: defaults to natuleaf.site
- CORS_ORIGIN: defaults to https://natuleaf.site,https://www.natuleaf.site
- REMOTE_APP_DIR: defaults to /opt/natuleaf-storefront

The self-hosted deployment workflow will:
1. install dependencies
2. build the frontend
3. deploy the repository to your InterServer host using SSH key auth
4. restart the app with PM2

GitHub-hosted runners are not suitable for this deployment because InterServer
blocks or cannot route their connections to port 22. Configure a self-hosted
runner on a machine that can connect to the server, then run
`.github/workflows/self-hosted-deploy.yml`.

Generate a key pair locally with:

```bash
ssh-keygen -t ed25519 -C "git-actions@natuleaf" -f ~/.ssh/natuleaf_interserver
```

Then add the public key to your server's ~/.ssh/authorized_keys and paste the private key contents into the GitHub secret.

If your hosting uses a different app directory or SSH port, set `REMOTE_APP_DIR`
or `INTERSERVER_PORT` as repository secrets. Keep the deployment workflow on a
self-hosted runner with access to the server network.
