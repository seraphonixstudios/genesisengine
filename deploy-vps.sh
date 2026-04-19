#!/bin/bash

# AI Image Generator Pro v2.0 - VPS Deployment Script
# Run this on your Hostinger VPS to upgrade to the latest version

set -e

echo "🚀 AI Image Generator Pro v2.0 - VPS Upgrader"
echo "================================================"

# Configuration
APP_DIR="/var/www/ai-generator"
BACKUP_DIR="/var/backups/ai-generator-$(date +%Y%m%d-%H%M%S)"
REPO_URL="${REPO_URL:-https://github.com/yourusername/ai-image-generator.git}"
NODE_VERSION="18"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root"
   exit 1
fi

# Backup existing installation
print_status "Creating backup of current installation..."
mkdir -p "$BACKUP_DIR"
if [ -d "$APP_DIR" ]; then
    cp -r "$APP_DIR"/* "$BACKUP_DIR/" 2>/dev/null || true
    print_success "Backup created at $BACKUP_DIR"
else
    print_warning "No existing installation found at $APP_DIR"
    mkdir -p "$APP_DIR"
fi

# Check Node.js version
print_status "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js ${NODE_VERSION}..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs
fi

NODE_CURRENT=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_CURRENT" -lt "18" ]; then
    print_status "Upgrading Node.js to version ${NODE_VERSION}..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs
fi

print_success "Node.js $(node -v) installed"

# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    npm install -g pm2
    print_success "PM2 installed"
fi

# Install dependencies
print_status "Installing server dependencies..."
cd "$APP_DIR"
npm install --production

print_status "Installing client dependencies..."
cd "$APP_DIR/client"
npm install

# Build client
print_status "Building React client..."
npm run build
print_success "Client built successfully"

# Setup environment file
print_status "Setting up environment..."
if [ ! -f "$APP_DIR/.env" ]; then
    cat > "$APP_DIR/.env" << 'EOF'
# Server Configuration
PORT=5000
NODE_ENV=production

# Client URL (update with your domain or IP)
CLIENT_URL=http://76.13.242.128:3000

# AI Provider API Keys (add your keys here)
HUGGINGFACE_API_KEY=
OPENAI_API_KEY=
REPLICATE_API_TOKEN=
STABILITY_API_KEY=
EOF
    print_warning "Please edit $APP_DIR/.env and add your API keys"
fi

# Create directories
mkdir -p "$APP_DIR/server/uploads"
mkdir -p "$APP_DIR/server/temp"
mkdir -p "$APP_DIR/server/workspaces"
chmod 755 "$APP_DIR/server/uploads"
chmod 755 "$APP_DIR/server/temp"
chmod 755 "$APP_DIR/server/workspaces"

# Setup PM2 ecosystem file
print_status "Configuring PM2..."
cat > "$APP_DIR/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [
    {
      name: 'ai-generator-api',
      script: './server/server.js',
      cwd: '/var/www/ai-generator',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'ai-generator-client',
      script: 'serve',
      cwd: '/var/www/ai-generator/client/build',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        PM2_SERVE_PATH: './',
        PM2_SERVE_PORT: 3000,
        PM2_SERVE_SPA: 'true',
        PM2_SERVE_BASIC_AUTH: 'false'
      }
    }
  ]
};
EOF

# Install serve for client
npm install -g serve

# Create logs directory
mkdir -p "$APP_DIR/logs"

# Stop existing processes
print_status "Stopping existing processes..."
pm2 stop ai-generator-api 2>/dev/null || true
pm2 stop ai-generator-client 2>/dev/null || true

# Start new processes
print_status "Starting AI Generator services..."
cd "$APP_DIR"
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save
pm2 startup systemd -u root --hp /root

# Configure firewall
print_status "Configuring firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 3000/tcp
    ufw allow 5000/tcp
    print_success "Firewall configured"
fi

# Health check
print_status "Running health check..."
sleep 3
if curl -s http://localhost:5000/api/health > /dev/null; then
    print_success "API is responding"
else
    print_error "API health check failed"
fi

# Display status
echo ""
echo "================================================"
print_success "AI Image Generator Pro v2.0 Deployed!"
echo "================================================"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend: http://76.13.242.128:3000"
echo "   Backend API: http://76.13.242.128:5000"
echo "   Health Check: http://76.13.242.128:5000/api/health"
echo ""
echo "📁 Installation Directory: $APP_DIR"
echo "💾 Backup Location: $BACKUP_DIR"
echo ""
echo "🔧 Management Commands:"
echo "   pm2 status           - Check service status"
echo "   pm2 logs             - View logs"
echo "   pm2 restart all      - Restart all services"
echo "   pm2 stop all         - Stop all services"
echo ""
echo "⚠️  IMPORTANT: Edit $APP_DIR/.env and add your API keys!"
echo ""
print_success "Deployment complete!"
