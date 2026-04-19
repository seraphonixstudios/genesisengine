#!/bin/bash

# AI Image Generator - VPS Deployment Script
# For Hostinger VPS - Run this on your VPS

set -e  # Exit on error

echo "🚀 AI Image Generator - VPS Deployment Script"
echo "=============================================="
echo ""

# Configuration
APP_DIR="/var/www/ai-image-generator"
APP_NAME="ai-image-generator"
NODE_VERSION="18"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root"
   exit 1
fi

# Step 1: Update system
echo ""
echo "📦 Step 1: Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq
print_status "System updated"

# Step 2: Install Node.js
echo ""
echo "📦 Step 2: Installing Node.js ${NODE_VERSION}..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs -qq
    print_status "Node.js installed: $(node --version)"
else
    print_status "Node.js already installed: $(node --version)"
fi

# Step 3: Install PM2
echo ""
echo "📦 Step 3: Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    print_status "PM2 installed"
else
    print_status "PM2 already installed"
fi

# Step 4: Install Nginx
echo ""
echo "📦 Step 4: Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx -qq
    print_status "Nginx installed"
else
    print_status "Nginx already installed"
fi

# Step 5: Create application directory
echo ""
echo "📁 Step 5: Creating application directory..."
mkdir -p ${APP_DIR}
mkdir -p ${APP_DIR}/logs
mkdir -p ${APP_DIR}/uploads
print_status "Directory structure created"

# Step 6: Check if files need to be uploaded
echo ""
echo "📤 Step 6: Checking for application files..."
if [ ! -f "${APP_DIR}/package.json" ]; then
    print_warning "Application files not found in ${APP_DIR}"
    echo ""
    echo "Please upload your files using one of these methods:"
    echo "1. SCP: scp -r /local/path/* root@76.13.242.128:${APP_DIR}/"
    echo "2. Git: git clone <repo> ${APP_DIR}"
    echo "3. FileZilla: Connect via SFTP and upload files"
    echo ""
    read -p "Press Enter after uploading files to continue..."
fi

# Step 7: Install dependencies
echo ""
echo "📦 Step 7: Installing dependencies..."
cd ${APP_DIR}

if [ -f "package.json" ]; then
    npm install --production
    print_status "Server dependencies installed"
else
    print_error "package.json not found. Please ensure files are uploaded correctly."
    exit 1
fi

# Step 8: Build client (if client directory exists)
echo ""
echo "🔨 Step 8: Building client application..."
if [ -d "${APP_DIR}/client" ]; then
    cd ${APP_DIR}/client
    if [ -f "package.json" ]; then
        npm install
        npm run build
        print_status "Client built successfully"
    else
        print_warning "Client package.json not found, skipping build"
    fi
    cd ${APP_DIR}
else
    print_warning "Client directory not found, skipping build"
fi

# Step 9: Create .env file if it doesn't exist
echo ""
echo "⚙️  Step 9: Setting up environment..."
if [ ! -f "${APP_DIR}/.env" ]; then
    print_warning ".env file not found. Creating template..."
    
    cat > ${APP_DIR}/.env << EOL
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
HUGGINGFACE_API_KEY=YOUR_API_KEY_HERE
JWT_SECRET=YOUR_SECRET_KEY_HERE_CHANGE_THIS
FRONTEND_URL=http://76.13.242.128
EOL
    
    print_status "Template .env file created"
    print_warning "IMPORTANT: Edit ${APP_DIR}/.env and add your actual API keys!"
    
    # Open nano for editing
    nano ${APP_DIR}/.env
else
    print_status ".env file already exists"
fi

# Step 10: Set permissions
echo ""
echo "🔒 Step 10: Setting permissions..."
chown -R root:root ${APP_DIR}
chmod -R 755 ${APP_DIR}
chmod -R 777 ${APP_DIR}/uploads
chmod -R 777 ${APP_DIR}/logs
print_status "Permissions set"

# Step 11: Configure Nginx
echo ""
echo "🌐 Step 11: Configuring Nginx..."
NGINX_CONFIG="/etc/nginx/sites-available/${APP_NAME}"

if [ ! -f "${NGINX_CONFIG}" ]; then
cat > ${NGINX_CONFIG} << 'EOL'
server {
    listen 80;
    server_name 76.13.242.128;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /var/www/ai-image-generator/uploads;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
}
EOL

    ln -sf ${NGINX_CONFIG} /etc/nginx/sites-enabled/
    nginx -t
    systemctl restart nginx
    print_status "Nginx configured"
else
    print_status "Nginx already configured"
fi

# Step 12: Configure firewall
echo ""
echo "🔥 Step 12: Configuring firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    ufw allow 3000/tcp
    ufw allow OpenSSH
    
    if ! ufw status | grep -q "Status: active"; then
        echo "y" | ufw enable
    fi
    
    print_status "Firewall configured"
else
    print_warning "UFW not installed, skipping firewall config"
fi

# Step 13: Start application with PM2
echo ""
echo "🚀 Step 13: Starting application with PM2..."
cd ${APP_DIR}

# Check if app is already running
if pm2 list | grep -q "${APP_NAME}"; then
    print_warning "Application already running, restarting..."
    pm2 restart ${APP_NAME}
else
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js --env production
    else
        pm2 start server-production.js --name ${APP_NAME}
    fi
fi

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup systemd -u root --hp /root

print_status "Application started with PM2"

# Step 14: Final checks
echo ""
echo "✅ Step 14: Running final checks..."

# Check if app is running
if pm2 list | grep -q "${APP_NAME}"; then
    print_status "Application is running"
    
    # Test health endpoint
    sleep 2
    if curl -s http://localhost:3000/api/health > /dev/null; then
        print_status "Health check passed"
    else
        print_warning "Health check failed - application may still be starting"
    fi
else
    print_error "Application failed to start"
    exit 1
fi

echo ""
echo "=============================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "=============================================="
echo ""
echo "Application Details:"
echo "  • Name: ${APP_NAME}"
echo "  • Directory: ${APP_DIR}"
echo "  • URL: http://76.13.242.128:3000"
echo "  • Health: http://76.13.242.128:3000/api/health"
echo ""
echo "Useful Commands:"
echo "  • Check status: pm2 status"
echo "  • View logs: pm2 logs ${APP_NAME}"
echo "  • Restart: pm2 restart ${APP_NAME}"
echo "  • Stop: pm2 stop ${APP_NAME}"
echo ""
echo "Demo Credentials:"
echo "  • Email: demo@example.com"
echo "  • Password: demo123"
echo ""
echo "⚠️  IMPORTANT: Make sure to update your .env file with:"
echo "     - HUGGINGFACE_API_KEY"
echo "     - JWT_SECRET (strong random string)"
echo ""
echo "=============================================="
