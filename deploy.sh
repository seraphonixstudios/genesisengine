#!/bin/bash

# AI Image Generator Deployment Script for Hostinger VPS

set -e

echo "🚀 Starting deployment..."

# Configuration
VPS_USER="root"
VPS_HOST="your-vps-ip"
VPS_PATH="/var/www/ai-image-generator"
LOCAL_PATH="."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Building client...${NC}"
cd client
npm install
npm run build
cd ..

echo -e "${YELLOW}Step 2: Creating deployment package...${NC}"
mkdir -p deploy
cp -r server-production.js deploy/
cp -r package.json deploy/
cp -r package-lock.json deploy/
cp -r uploads deploy/ 2>/dev/null || mkdir -p deploy/uploads
cp -r client/dist deploy/client/
cp .env.example deploy/.env
tar -czf deploy.tar.gz -C deploy .

echo -e "${YELLOW}Step 3: Uploading to VPS...${NC}"
scp deploy.tar.gz $VPS_USER@$VPS_HOST:/tmp/

echo -e "${YELLOW}Step 4: Deploying on VPS...${NC}"
ssh $VPS_USER@$VPS_HOST << 'EOF'
    # Extract files
    mkdir -p /var/www/ai-image-generator
    tar -xzf /tmp/deploy.tar.gz -C /var/www/ai-image-generator
    cd /var/www/ai-image-generator
    
    # Install dependencies
    npm install --production
    
    # Setup environment (if not exists)
    if [ ! -f .env ]; then
        echo "⚠️  Please configure .env file manually!"
        echo "nano /var/www/ai-image-generator/.env"
    fi
    
    # Restart PM2
    pm2 delete ai-generator 2>/dev/null || true
    pm2 start server-production.js --name ai-generator
    pm2 save
    
    echo "✅ Deployment complete!"
EOF

echo -e "${GREEN}🎉 Deployment successful!${NC}"
echo ""
echo "Next steps:"
echo "1. SSH to your VPS: ssh $VPS_USER@$VPS_HOST"
echo "2. Edit environment: nano $VPS_PATH/.env"
echo "3. Add your HUGGINGFACE_API_KEY"
echo "4. Restart: pm2 restart ai-generator"
echo ""
echo "Check status: pm2 logs ai-generator"

# Cleanup
rm -rf deploy deploy.tar.gz