# AI Image Generator - ONE-CLICK DEPLOYMENT (Windows PowerShell)
# This script automates the entire deployment process
# Run as Administrator

param(
    [string]$VPS_IP = "76.13.242.128",
    [string]$VPS_USER = "root"
)

$ErrorActionPreference = "Stop"

# Colors
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Cyan"

# Configuration
$APP_DIR = "/var/www/ai-image-generator"
$LOCAL_DIR = $PSScriptRoot

if (-not $LOCAL_DIR) {
    $LOCAL_DIR = Get-Location
}

function Write-Status($message) {
    Write-Host "[✓] $message" -ForegroundColor $Green
}

function Write-Error($message) {
    Write-Host "[✗] $message" -ForegroundColor $Red
}

function Write-Warning($message) {
    Write-Host "[!] $message" -ForegroundColor $Yellow
}

function Write-Info($message) {
    Write-Host "[i] $message" -ForegroundColor $Blue
}

# Header
Clear-Host
Write-Host "==============================================" -ForegroundColor $Blue
Write-Host "  AI Image Generator - One-Click Deploy" -ForegroundColor $Blue
Write-Host "==============================================" -ForegroundColor $Blue
Write-Host ""
Write-Host "VPS IP: $VPS_IP"
Write-Host "App Directory: $APP_DIR"
Write-Host ""
Write-Host "This will:"
Write-Host "  1. Prepare files (remove node_modules)"
Write-Host "  2. Upload to VPS"
Write-Host "  3. Install dependencies"
Write-Host "  4. Configure environment"
Write-Host "  5. Start the server"
Write-Host ""
Read-Host "Press Enter to continue or Ctrl+C to cancel"
Write-Host ""

try {
    # Step 1: Prepare files
    Write-Info "Step 1: Preparing files locally..."
    
    $nodeModulesPath = Join-Path $LOCAL_DIR "node_modules"
    $clientNodeModulesPath = Join-Path $LOCAL_DIR "client\node_modules"
    
    if (Test-Path $nodeModulesPath) {
        Write-Info "Removing node_modules..."
        Remove-Item -Recurse -Force $nodeModulesPath -ErrorAction SilentlyContinue
    }
    
    if (Test-Path $clientNodeModulesPath) {
        Write-Info "Removing client/node_modules..."
        Remove-Item -Recurse -Force $clientNodeModulesPath -ErrorAction SilentlyContinue
    }
    
    Write-Status "Files prepared"
    
    # Step 2: Check SSH
    Write-Info "Step 2: Checking VPS connectivity..."
    
    $sshTest = ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} "echo 'Connected'" 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Cannot connect to VPS. Please check:"
        Write-Error "  - VPS IP is correct: $VPS_IP"
        Write-Error "  - You have SSH access (ssh key or password)"
        Write-Error "  - Firewall allows SSH (port 22)"
        exit 1
    }
    
    Write-Status "VPS connection verified"
    
    # Step 3: Clean VPS directory
    Write-Info "Step 3: Preparing VPS directory..."
    
    ssh ${VPS_USER}@${VPS_IP} "pkill -f node 2>/dev/null; pm2 delete all 2>/dev/null; rm -rf ${APP_DIR}; mkdir -p ${APP_DIR}"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to prepare VPS directory"
        exit 1
    }
    
    Write-Status "VPS directory ready"
    
    # Step 4: Upload files
    Write-Info "Step 4: Uploading files to VPS..."
    Write-Info "This may take 2-5 minutes..."
    
    # Create exclusion file for SCP
    $excludeFile = Join-Path $env:TEMP "scp_exclude.txt"
    @("node_modules", "logs", "uploads", ".git") | Out-File $excludeFile
    
    # Use SCP to upload
    $sourcePath = Join-Path $LOCAL_DIR "*"
    $destPath = "${VPS_USER}@${VPS_IP}:${APP_DIR}/"
    
    scp -r -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL $sourcePath $destPath
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Upload failed. Trying alternative method..."
        # Try with different options
        Get-ChildItem $LOCAL_DIR -Exclude "node_modules", "logs", "uploads", ".git" | ForEach-Object {
            $itemPath = $_.FullName
            $itemName = $_.Name
            Write-Info "Uploading $itemName..."
            scp -r -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL $itemPath ${VPS_USER}@${VPS_IP}:${APP_DIR}/
        }
    }
    
    Write-Status "Files uploaded successfully"
    
    # Step 5: Setup on VPS
    Write-Info "Step 5: Setting up on VPS..."
    
    $setupScript = @"
cd ${APP_DIR}

# Check/install Node.js
if ! command -v node &> /dev/null; then
    echo 'Installing Node.js...'
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install dependencies
echo 'Installing dependencies...'
npm install --production

# Create directories
mkdir -p uploads logs
chmod 777 uploads logs

# Create .env if not exists
if [ ! -f .env ]; then
    cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
HUGGINGFACE_API_KEY=your_api_key_here
JWT_SECRET=your_secret_key_here_change_this_in_production
FRONTEND_URL=http://${VPS_IP}
EOF
    echo 'Created .env file - PLEASE EDIT IT!'
fi

# Install PM2
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

pm2 delete ai-image-generator 2>/dev/null || true
"@
    
    $setupScript | ssh ${VPS_USER}@${VPS_IP} "bash -s"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Setup failed on VPS"
        exit 1
    }
    
    Write-Status "VPS setup complete"
    
    # Step 6: Prompt for API keys
    Write-Info "Step 6: Configure environment variables"
    Write-Warning "You need to set your API keys on the VPS"
    Write-Host ""
    Write-Host "SSH into your VPS and edit the .env file:"
    Write-Host "  ssh ${VPS_USER}@${VPS_IP}"
    Write-Host "  nano ${APP_DIR}/.env"
    Write-Host ""
    Write-Host "Required values:"
    Write-Host "  - HUGGINGFACE_API_KEY (get from https://huggingface.co/settings/tokens)"
    Write-Host "  - JWT_SECRET (any random string, min 32 characters)"
    Write-Host ""
    Read-Host "Press Enter when you've configured the .env file (or to skip)"
    
    # Step 7: Start server
    Write-Info "Step 7: Starting the server..."
    
    $startScript = @"
cd ${APP_DIR}
export PORT=3000
export HOST=0.0.0.0
pm2 start server.js --name ai-image-generator --env production
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true
sleep 3
pm2 list | grep -q 'ai-image-generator.*online' && echo 'SUCCESS' || echo 'FAILED'
"@
    
    $result = $startScript | ssh ${VPS_USER}@${VPS_IP} "bash -s"
    
    if ($result -match "SUCCESS") {
        Write-Status "Server started successfully"
    } else {
        Write-Warning "Server status unclear, checking..."
    }
    
    # Step 8: Verify
    Write-Info "Step 8: Verifying deployment..."
    Start-Sleep -Seconds 2
    
    $healthCheck = ssh ${VPS_USER}@${VPS_IP} "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health" 2>$null
    
    Write-Host ""
    Write-Host "==============================================" -ForegroundColor $Green
    Write-Host "  DEPLOYMENT COMPLETE!" -ForegroundColor $Green
    Write-Host "==============================================" -ForegroundColor $Green
    Write-Host ""
    Write-Host "Your AI Image Generator is deployed at:"
    Write-Host "  • Application: http://${VPS_IP}:3000"
    Write-Host "  • Health Check: http://${VPS_IP}:3000/api/health"
    Write-Host "  • API Base: http://${VPS_IP}:3000/api"
    Write-Host ""
    Write-Host "Demo Credentials:"
    Write-Host "  • Email: demo@example.com"
    Write-Host "  • Password: demo123"
    Write-Host ""
    Write-Host "Useful Commands:"
    Write-Host "  • Check status: ssh ${VPS_USER}@${VPS_IP} 'pm2 status'"
    Write-Host "  • View logs: ssh ${VPS_USER}@${VPS_IP} 'pm2 logs ai-image-generator'"
    Write-Host "  • Restart: ssh ${VPS_USER}@${VPS_IP} 'pm2 restart ai-image-generator'"
    Write-Host ""
    
    if ($healthCheck -eq "200") {
        Write-Status "Everything is working! Enjoy your AI Image Generator!"
    } else {
        Write-Warning "Deployment complete, but health check returned: $healthCheck"
        Write-Info "Wait 30 seconds and try: http://${VPS_IP}:3000/api/health"
    }
    
    Write-Host ""

} catch {
    Write-Error "Deployment failed: $_"
    Write-Host ""
    Write-Host "Troubleshooting:"
    Write-Host "  1. Ensure you can SSH to the VPS: ssh ${VPS_USER}@${VPS_IP}"
    Write-Host "  2. Check VPS firewall allows connections"
    Write-Host "  3. Verify Node.js can be installed on VPS"
    Write-Host "  4. Check available disk space on VPS"
    exit 1
}
