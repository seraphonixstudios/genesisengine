#!/bin/bash

# Quick Start Script for VPS

echo "🚀 AI Image Generator - VPS Setup"
echo "=================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root or with sudo"
    exit 1
fi

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Create app directory
APP_DIR="/var/www/ai-image-generator"
mkdir -p $APP_DIR

# Check if .env exists
if [ ! -f "$APP_DIR/.env" ]; then
    echo "⚠️  Creating .env file template..."
    cat > $APP_DIR/.env << EOL
HUGGINGFACE_API_KEY=your_api_key_here
PORT=3000
HOST=0.0.0.0
FRONTEND_URL=http://your-domain.com
NODE_ENV=production
EOL
    echo "📝 Please edit $APP_DIR/.env and add your API key"
    echo "   nano $APP_DIR/.env"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the server:"
echo "  cd $APP_DIR"
echo "  pm2 start server-production.js --name ai-generator"
echo "  pm2 save"
echo "  pm2 startup"
echo ""
echo "To check status:"
echo "  pm2 status"
echo "  pm2 logs ai-generator"