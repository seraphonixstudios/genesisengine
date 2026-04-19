#!/bin/bash

# AI Image Generator v3.0 - Cyberpunk Edition Deployment Script
# Run this on your VPS to deploy the new cyberpunk interface

echo "🎨 AI Image Generator v3.0 - CYBERPUNK EDITION"
echo "=============================================="
echo ""

APP_DIR="/var/www/ai-generator"

cd "$APP_DIR"

# Stop current frontend
echo "🛑 Stopping current frontend..."
pkill -f 'serve.*3000' || true
sleep 2

# Backup current client
echo "📦 Backing up current client..."
if [ -d "client" ]; then
  mv client "client-backup-$(date +%Y%m%d-%H%M%S)"
fi

# Create new client structure
echo "📁 Creating new client structure..."
mkdir -p client/src client/public

# Install create-react-app
echo "📥 Initializing React app..."
cd client
npx create-react-app . --template cra-template-pwa 2>&1 || echo "Already initialized"

# Install required dependencies
echo "📥 Installing dependencies..."
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled react-dropzone axios

echo ""
echo "=============================================="
echo "✅ Setup Complete!"
echo "=============================================="
echo ""
echo "⚠️  NEXT STEPS:"
echo ""
echo "1. Copy the new App.js file to:"
echo "   $APP_DIR/client/src/App.js"
echo ""
echo "2. Copy the CSS file to:"
echo "   $APP_DIR/client/src/cyberpunk-atlantean.css"
echo ""
echo "3. Update index.js to import the CSS"
echo ""
echo "4. Build the app:"
echo "   cd $APP_DIR/client"
echo "   npm run build"
echo ""
echo "5. Deploy to dist:"
echo "   cp -r build/* dist/"
echo ""
echo "6. Start frontend:"
echo "   cd dist && serve -s . -l tcp://0.0.0.0:3000"
echo ""
echo "🌐 Your cyberpunk UI will be at:"
echo "   http://76.13.242.128:3000"
