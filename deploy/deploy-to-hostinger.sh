#!/bin/bash

# Automated Deployment Script for Hostinger VPS
# Run this from your local machine to deploy

set -e

DOMAIN="${1:-example.com}"
VPS_IP="${2:-your.vps.ip}"
VPS_USER="${3:-root}"

echo "=========================================="
echo "Deploying to Hostinger VPS"
echo "Domain: $DOMAIN"
echo "VPS IP: $VPS_IP"
echo "=========================================="
echo ""

# Step 1: Upload files to VPS
echo "Step 1: Uploading files to VPS..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'uploads' \
    --exclude 'data' \
    --exclude 'dist' \
    --exclude '.env' \
    --exclude 'logs' \
    ./ $VPS_USER@$VPS_IP:/var/www/ai-image-generator/

echo "✓ Files uploaded"
echo ""

# Step 2: Run setup on VPS
echo "Step 2: Running setup on VPS..."
ssh $VPS_USER@$VPS_IP << 'EOF'
cd /var/www/ai-image-generator

# Install dependencies
npm install --legacy-peer-deps

# Build frontend
cd client && npm run build && cd ..

# Setup PM2
cp deploy/ecosystem.config.js .
pm2 start ecosystem.config.js
pm2 save

echo "✓ Application setup complete"
EOF

echo ""

# Step 3: Configure Nginx
echo "Step 3: Configuring Nginx..."
ssh $VPS_USER@$VPS_IP << EOF
cd /var/www/ai-image-generator

# Update Nginx config with domain
sudo sed -i 's/your-domain.com/$DOMAIN/g' deploy/nginx.conf

# Deploy Nginx config
sudo cp deploy/nginx.conf /etc/nginx/nginx.conf

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

echo "✓ Nginx configured"
EOF

echo ""

# Step 4: Setup SSL
echo "Step 4: Setting up SSL certificate..."
ssh $VPS_USER@$VPS_IP << EOF
sudo certbot certonly --nginx -d $DOMAIN -d www.$DOMAIN --agree-tos --non-interactive

echo "✓ SSL certificate installed"
EOF

echo ""

# Step 5: Final checks
echo "Step 5: Running health checks..."
ssh $VPS_USER@$VPS_IP << 'EOF'
bash /var/www/ai-image-generator/deploy/health-check.sh
EOF

echo ""
echo "=========================================="
echo "✓ Deployment Complete!"
echo "=========================================="
echo ""
echo "Your application is live at:"
echo "  https://$DOMAIN"
echo ""
echo "Next steps:"
echo "1. Update .env on VPS with API keys"
echo "2. Restart application: pm2 restart all"
echo "3. Check logs: pm2 logs"
echo ""
