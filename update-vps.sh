#!/bin/bash

# AI Image Generator v2.0 - Quick Update Script
# Use this to update the existing installation with new features

set -e

APP_DIR="/var/www/ai-generator"
BACKUP_DIR="/var/backups/ai-generator-backup-$(date +%Y%m%d-%H%M%S)"

echo "🔄 AI Image Generator Updater"
echo "=============================="

# Backup
echo "📦 Creating backup..."
mkdir -p "$BACKUP_DIR"
if [ -d "$APP_DIR" ]; then
    tar -czf "$BACKUP_DIR/ai-generator.tar.gz" -C "$(dirname $APP_DIR)" "$(basename $APP_DIR)"
    echo "✅ Backup created: $BACKUP_DIR"
fi

# Navigate to app directory
cd "$APP_DIR"

# Stop services
echo "🛑 Stopping services..."
pm2 stop ai-generator-api 2>/dev/null || true
npm2 stop ai-generator-client 2>/dev/null || true

# Update server files
echo "📂 Updating server files..."
# Note: This assumes new files are uploaded to /tmp/ai-generator-update
if [ -d "/tmp/ai-generator-update" ]; then
    # Preserve .env file
    cp "$APP_DIR/.env" /tmp/.env.backup
    
    # Remove old server files
    rm -rf "$APP_DIR/server"
    
    # Copy new files
    cp -r /tmp/ai-generator-update/server "$APP_DIR/"
    cp /tmp/ai-generator-update/package.json "$APP_DIR/"
    cp /tmp/ai-generator-update/ecosystem.config.js "$APP_DIR/" 2>/dev/null || true
    
    # Restore .env
    mv /tmp/.env.backup "$APP_DIR/.env"
    
    echo "✅ Server files updated"
fi

# Update client files
if [ -d "/tmp/ai-generator-update/client" ]; then
    echo "📂 Updating client files..."
    rm -rf "$APP_DIR/client/src"
    cp -r /tmp/ai-generator-update/client/src "$APP_DIR/client/"
    cp /tmp/ai-generator-update/client/package.json "$APP_DIR/client/"
    cp /tmp/ai-generator-update/client/public/index.html "$APP_DIR/client/public/" 2>/dev/null || true
    echo "✅ Client files updated"
fi

# Install dependencies
echo "📥 Installing dependencies..."
cd "$APP_DIR"
npm install --production

cd "$APP_DIR/client"
npm install

# Build client
echo "🔨 Building client..."
npm run build

# Create required directories
mkdir -p "$APP_DIR/server/uploads"
mkdir -p "$APP_DIR/server/temp"
mkdir -p "$APP_DIR/server/workspaces"
mkdir -p "$APP_DIR/logs"

# Set permissions
chmod -R 755 "$APP_DIR/server/uploads"
chmod -R 755 "$APP_DIR/server/temp"
chmod -R 755 "$APP_DIR/server/workspaces"

# Start services
echo "🚀 Starting services..."
cd "$APP_DIR"
pm2 start ecosystem.config.js 2>/dev/null || pm2 restart ecosystem.config.js

# Save PM2 config
pm2 save

echo ""
echo "=============================="
echo "✅ Update Complete!"
echo "=============================="
echo ""
echo "🌐 Access your app at:"
echo "   http://76.13.242.128:3000"
echo ""
echo "🔧 Check status: pm2 status"
echo "📋 View logs: pm2 logs"
echo ""
