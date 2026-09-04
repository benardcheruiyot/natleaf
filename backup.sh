#!/bin/bash

BACKUP_DIR='/root/backups'
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/cana_backup_$DATE.tar.gz"

echo "[$(date)] Starting backup..."

# Backup critical application files
tar -czf "$BACKUP_FILE" \
  /root/cana/backend \
  /root/cana/frontend/dist \
  /root/cana/frontend/package.json \
  /etc/letsencrypt/live/greenlinewellnes.shop-0001 \
  /etc/nginx/conf.d/cana.conf \
  2>/dev/null

# Keep only last 7 backups
ls -t $BACKUP_DIR/cana_backup_*.tar.gz 2>/dev/null | tail -n +8 | xargs -r rm

# Log backup completion
echo "[$(date)] Backup completed: $BACKUP_FILE"
