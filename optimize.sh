#!/bin/bash
echo "=== OPTIMIZING PRODUCTION ==="
echo "Step 1: Stopping PM2 processes..."
pm2 stop all
pm2 delete all
sleep 1

echo "Step 2: Starting single optimized instance..."
cd /root/cana/backend
pm2 start index.js --name 'cana-api' --max-memory-restart 200M
pm2 save
sleep 2

echo "Step 3: Reloading Nginx with optimized config..."
nginx -t
systemctl reload nginx

echo "Step 4: Testing health..."
sleep 2
curl -s http://127.0.0.1/api/health

echo ""
echo "=== OPTIMIZATION COMPLETE ==="
echo "Services:"
pm2 list
