#!/bin/bash

# Complete Hostinger VPS Deployment Script
# One-command setup for production

set -e

DOMAIN="${1:-example.com}"
EMAIL="${2:-admin@example.com}"
APP_PATH="/var/www/ai-image-generator"

echo "=========================================="
echo "Complete Production Deployment"
echo "Domain: $DOMAIN"
echo "=========================================="
echo ""

# Step 1: Basic setup
echo "Step 1: Basic system setup..."
bash deploy/hostinger-setup.sh

# Step 2: Navigate to app directory
cd $APP_PATH

# Step 3: Install dependencies
echo "Step 2: Installing dependencies..."
npm install --legacy-peer-deps

# Step 4: Build frontend
echo "Step 3: Building frontend..."
cd client && npm run build && cd ..

# Step 5: Setup PM2
echo "Step 4: Setting up PM2..."
bash deploy/setup-pm2.sh

# Step 6: Setup Nginx
echo "Step 5: Configuring Nginx..."
bash deploy/setup-nginx.sh $DOMAIN

# Step 7: SSL Certificate
echo "Step 6: Installing SSL Certificate..."
certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --agree-tos --email $EMAIL --non-interactive

# Step 7: Restart services
echo "Step 7: Restarting services..."
systemctl restart nginx
pm2 restart all

echo ""
echo "=========================================="
echo "✓ Deployment Complete!"
echo "=========================================="
echo ""
echo "Your application is live at:"
echo "  https://$DOMAIN"
echo ""
echo "Monitor your app:"
echo "  pm2 status"
echo "  pm2 logs"
echo ""
echo "Manage Nginx:"
echo "  systemctl status nginx"
echo "  nginx -t  (test config)"
echo ""
