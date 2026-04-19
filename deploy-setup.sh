#!/bin/bash

# AI Image Generator - Complete VPS Deployment Script
# For Hostinger VPS (76.13.242.128)

set -e  # Exit on error

echo "🚀 Starting complete deployment..."

# Configuration
VPS_IP="76.13.242.128"
VPS_USER="root"
APP_DIR="/var/www/ai-image-generator"

echo "📁 Setting up application directory..."
mkdir -p $APP_DIR
mkdir -p $APP_DIR/logs
mkdir -p $APP_DIR/uploads

echo "🛑 Stopping existing PM2 processes..."
pm2 stop ai-image-generator 2>/dev/null || true
pm2 delete ai-image-generator 2>/dev/null || true

echo "🧹 Cleaning old files..."
cd $APP_DIR
rm -f server.js package.json package-lock.json
rm -rf node_modules client

echo "✅ Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Upload server.js, package.json, ecosystem.config.js"
echo "2. Upload client/dist folder"
echo "3. Create .env file"
echo "4. Run: npm install"
echo "5. Run: pm2 start ecosystem.config.js"
echo "6. Run: pm2 save"
