#!/bin/bash

# Hostinger VPS Deployment Setup Script
# Automated setup for AI Image Generator on Hostinger VPS

set -e

echo "=========================================="
echo "AI Image Generator - Hostinger VPS Setup"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root${NC}"
   echo "Run: sudo bash deploy/hostinger-setup.sh"
   exit 1
fi

echo -e "${YELLOW}Step 1: Update System${NC}"
apt update && apt upgrade -y

echo -e "${YELLOW}Step 2: Install Node.js${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo -e "${YELLOW}Step 3: Install PM2 (Process Manager)${NC}"
npm install -g pm2

echo -e "${YELLOW}Step 4: Install Nginx (Reverse Proxy)${NC}"
apt install -y nginx

echo -e "${YELLOW}Step 5: Install Git${NC}"
apt install -y git

echo -e "${YELLOW}Step 6: Install SQLite${NC}"
apt install -y sqlite3

echo -e "${YELLOW}Step 7: Install Build Tools${NC}"
apt install -y build-essential python3

echo -e "${YELLOW}Step 8: Install SSL Certbot${NC}"
apt install -y certbot python3-certbot-nginx

echo -e "${YELLOW}Step 9: Create App Directory${NC}"
mkdir -p /var/www/ai-image-generator
cd /var/www/ai-image-generator

echo -e "${YELLOW}Step 10: Clone Repository (or upload files)${NC}"
# Note: Replace with your actual repository
# git clone https://github.com/yourusername/ai-image-generator.git .
# Or upload files via FTP/SFTP

echo ""
echo -e "${GREEN}✓ System dependencies installed${NC}"
echo ""
echo "Next steps:"
echo "1. Upload your application files to /var/www/ai-image-generator"
echo "2. Run: npm install --legacy-peer-deps"
echo "3. Create .env file with configuration"
echo "4. Run: bash deploy/setup-pm2.sh"
echo "5. Run: bash deploy/setup-nginx.sh"
echo ""
