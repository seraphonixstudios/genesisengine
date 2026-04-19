#!/bin/bash
#
# AI Image Generator - ONE-CLICK DEPLOYMENT SCRIPT
# This script automates the entire deployment process
# Usage: ./deploy-one-click.sh
#

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VPS_IP="76.13.242.128"
VPS_USER="root"
APP_DIR="/var/www/ai-image-generator"
LOCAL_DIR="C:\Users\User\Desktop\capital\AI Image Generator"

# Print functions
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

# Check if running on Windows (Git Bash/Cygwin) or Linux/Mac
check_os() {
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        echo "windows"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "mac"
    else
        echo "unknown"
    fi
}

OS=$(check_os)

# Header
clear
echo "=============================================="
echo "  AI Image Generator - One-Click Deploy"
echo "=============================================="
echo ""
echo "VPS IP: $VPS_IP"
echo "App Directory: $APP_DIR"
echo "OS Detected: $OS"
echo ""
echo "This will:"
echo "  1. Prepare files (remove node_modules)"
echo "  2. Upload to VPS"
echo "  3. Install dependencies"
echo "  4. Configure environment"
echo "  5. Start the server"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."
echo ""

# Step 1: Prepare files locally
print_info "Step 1: Preparing files locally..."
if [ "$OS" == "windows" ]; then
    # Windows - use PowerShell commands
    print_info "Removing node_modules on Windows..."
    powershell -Command "Remove-Item -Recurse -Force '$LOCAL_DIR\node_modules' -ErrorAction SilentlyContinue"
    powershell -Command "Remove-Item -Recurse -Force '$LOCAL_DIR\client\node_modules' -ErrorAction SilentlyContinue"
else
    # Linux/Mac
    cd "$LOCAL_DIR" 2>/dev/null || cd "$(dirname "$0")"
    rm -rf node_modules client/node_modules 2>/dev/null || true
fi
print_status "Files prepared"

# Step 2: Check SSH connectivity
print_info "Step 2: Checking VPS connectivity..."
if ! ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} "echo 'Connected'" > /dev/null 2>&1; then
    print_error "Cannot connect to VPS. Please check:"
    print_error "  - VPS IP is correct: $VPS_IP"
    print_error "  - You have SSH access"
    print_error "  - Firewall allows SSH (port 22)"
    exit 1
fi
print_status "VPS connection verified"

# Step 3: Clean VPS directory
print_info "Step 3: Preparing VPS directory..."
ssh ${VPS_USER}@${VPS_IP} "
    pkill -f node 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    rm -rf ${APP_DIR}
    mkdir -p ${APP_DIR}
" || {
    print_error "Failed to prepare VPS directory"
    exit 1
}
print_status "VPS directory ready"

# Step 4: Upload files
print_info "Step 4: Uploading files to VPS..."
print_info "This may take a few minutes..."

if [ "$OS" == "windows" ]; then
    # Windows SCP
    powershell -Command "
        \$source = '$LOCAL_DIR\*'
        \$dest = '${VPS_USER}@${VPS_IP}:${APP_DIR}/'
        scp -r -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \$source \$dest
    " || {
        print_error "Upload failed. Trying alternative method..."
        # Try rsync if available
        if command -v rsync &> /dev/null; then
            rsync -avz --progress -e "ssh -o StrictHostKeyChecking=no" "$LOCAL_DIR/" ${VPS_USER}@${VPS_IP}:${APP_DIR}/
        else
            print_error "Please install scp or rsync"
            exit 1
        fi
    }
else
    # Linux/Mac SCP
    scp -r -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
        "$(dirname "$0")/"* ${VPS_USER}@${VPS_IP}:${APP_DIR}/ 2>/dev/null || {
        print_error "SCP failed. Please ensure you're in the project directory"
        exit 1
    }
fi
print_status "Files uploaded successfully"

# Step 5: Install dependencies and setup on VPS
print_info "Step 5: Setting up on VPS..."
ssh ${VPS_USER}@${VPS_IP} "
    cd ${APP_DIR}
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        echo 'Installing Node.js...'
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
    fi
    
    # Install dependencies
    echo 'Installing server dependencies...'
    npm install --production
    
    # Create uploads directory
    mkdir -p uploads logs
    chmod 777 uploads logs
    
    # Create environment file if not exists
    if [ ! -f .env ]; then
        echo 'Creating environment file...'
        cat > .env << 'ENVFILE'
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
HUGGINGFACE_API_KEY=your_api_key_here
JWT_SECRET=your_secret_key_here_change_this_in_production
FRONTEND_URL=http://${VPS_IP}
ENVFILE
        echo '⚠️  IMPORTANT: Edit .env file and add your API keys!'
    fi
    
    # Install PM2 if not present
    if ! command -v pm2 &> /dev/null; then
        echo 'Installing PM2...'
        npm install -g pm2
    fi
    
    # Stop any existing processes
    pm2 delete ai-image-generator 2>/dev/null || true
" || {
    print_error "Setup failed on VPS"
    exit 1
}
print_status "VPS setup complete"

# Step 6: Prompt for API keys
print_info "Step 6: Configure environment variables"
print_warning "You need to set your API keys on the VPS"
echo ""
echo "SSH into your VPS and edit the .env file:"
echo "  ssh ${VPS_USER}@${VPS_IP}"
echo "  nano ${APP_DIR}/.env"
echo ""
echo "Required values:"
echo "  - HUGGINGFACE_API_KEY (get from https://huggingface.co/settings/tokens)"
echo "  - JWT_SECRET (any random string, min 32 characters)"
echo ""
read -p "Press Enter when you've configured the .env file (or to skip)..."

# Step 7: Start the server
print_info "Step 7: Starting the server..."
ssh ${VPS_USER}@${VPS_IP} "
    cd ${APP_DIR}
    
    # Source environment variables
    export \$(cat .env | grep -v '^#' | xargs)
    
    # Start with PM2
    pm2 start server.js --name ai-image-generator --env production
    pm2 save
    pm2 startup systemd -u root --hp /root 2>/dev/null || true
    
    # Wait a moment for server to start
    sleep 3
    
    # Check if running
    if pm2 list | grep -q 'ai-image-generator.*online'; then
        echo '✓ Server started successfully'
    else
        echo '✗ Server failed to start'
        exit 1
    fi
" || {
    print_error "Failed to start server"
    exit 1
}
print_status "Server started"

# Step 8: Verify deployment
print_info "Step 8: Verifying deployment..."
sleep 2

HEALTH_STATUS=$(ssh ${VPS_USER}@${VPS_IP} "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health" 2>/dev/null || echo "000")

if [ "$HEALTH_STATUS" == "200" ]; then
    print_status "Health check PASSED"
else
    print_warning "Health check returned status $HEALTH_STATUS"
    print_warning "Server may still be starting up..."
fi

# Final summary
echo ""
echo "=============================================="
echo "  DEPLOYMENT COMPLETE!"
echo "=============================================="
echo ""
echo "Your AI Image Generator is deployed at:"
echo "  • Application: http://${VPS_IP}:3000"
echo "  • Health Check: http://${VPS_IP}:3000/api/health"
echo "  • API Base: http://${VPS_IP}:3000/api"
echo ""
echo "Demo Credentials:"
echo "  • Email: demo@example.com"
echo "  • Password: demo123"
echo ""
echo "Useful Commands:"
echo "  • Check status: ssh ${VPS_USER}@${VPS_IP} 'pm2 status'"
echo "  • View logs: ssh ${VPS_USER}@${VPS_IP} 'pm2 logs ai-image-generator'"
echo "  • Restart: ssh ${VPS_USER}@${VPS_IP} 'pm2 restart ai-image-generator'"
echo ""
echo "Next Steps:"
echo "  1. Open http://${VPS_IP}:3000 in your browser"
echo "  2. Test the demo login"
echo "  3. Try generating an image"
echo ""

if [ "$HEALTH_STATUS" == "200" ]; then
    print_status "Everything is working! Enjoy your AI Image Generator!"
else
    print_warning "Deployment complete, but health check had issues."
    print_info "Wait 30 seconds and try: curl http://${VPS_IP}:3000/api/health"
fi

echo ""
