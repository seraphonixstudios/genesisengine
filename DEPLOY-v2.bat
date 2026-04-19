@echo off
REM AI Image Generator - Deployment Script v2
REM Uses SCP directly instead of zip

echo ==============================================
echo   AI Image Generator - Deploy to VPS
echo ==============================================
echo.
echo VPS: 76.13.242.128
echo.

REM Change to script directory
cd /d "%~dp0"

echo [1/3] Preparing files (removing node_modules)...
if exist node_modules (
    rmdir /s /q node_modules
    echo   - Removed node_modules
)
if exist client\node_modules (
    rmdir /s /q client\node_modules
    echo   - Removed client/node_modules
)

echo.
echo [2/3] Uploading files to VPS...
echo This will take 3-5 minutes...
echo.

REM Create directory and upload files one by one to avoid issues
ssh root@76.13.242.128 "rm -rf /var/www/ai-image-generator; mkdir -p /var/www/ai-image-generator" 2>nul

REM Use robocopy-like approach with scp for each major folder
echo   - Uploading server files...
scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL -q server.js root@76.13.242.128:/var/www/ai-image-generator/
scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL -q package.json root@76.13.242.128:/var/www/ai-image-generator/
scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL -q package-lock.json root@76.13.242.128:/var/www/ai-image-generator/
scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL -q .env root@76.13.242.128:/var/www/ai-image-generator/ 2>nul

echo   - Uploading client folder...
scp -r -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL -q client root@76.13.242.128:/var/www/ai-image-generator/

echo   - Uploading server modules...
scp -r -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL -q src root@76.13.242.128:/var/www/ai-image-generator/ 2>nul

echo   - Uploading tests...
scp -r -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL -q tests root@76.13.242.128:/var/www/ai-image-generator/ 2>nul

echo.
echo [3/3] Setting up on VPS and starting server...
echo.

REM Run setup on VPS
ssh root@76.13.242.128 "
cd /var/www/ai-image-generator

# Check/install Node.js
if ! command -v node >/dev/null 2>&1; then
    echo 'Installing Node.js...'
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - >/dev/null 2>&1
    apt-get install -y nodejs >/dev/null 2>&1
fi

# Install dependencies
echo 'Installing npm packages...'
npm install --production

# Create directories
mkdir -p uploads logs
chmod 777 uploads logs

# Create .env if missing
if [ ! -f .env ]; then
    echo 'Creating .env file...'
    cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
HUGGINGFACE_API_KEY=your_api_key_here
JWT_SECRET=your_secret_here_change_this
FRONTEND_URL=http://76.13.242.128
EOF
fi

# Kill any old processes
pkill -f 'node.*server' 2>/dev/null || true

# Start server
echo 'Starting server...'
nohup node server.js > logs/server.log 2>&1 &
sleep 3

# Check if running
if pgrep -f 'node.*server' >/dev/null; then
    echo 'Server started successfully!'
else
    echo 'WARNING: Server may not have started'
fi
"

echo.
echo ==============================================
echo   DEPLOYMENT COMPLETE!
echo ==============================================
echo.
echo IMPORTANT: You MUST configure API keys!
echo.
echo 1. SSH to your VPS:
echo    ssh root@76.13.242.128
echo.
echo 2. Edit the .env file:
echo    nano /var/www/ai-image-generator/.env
echo.
echo 3. Add your actual API keys:
echo    HUGGINGFACE_API_KEY=hf_your_actual_key_here
echo    JWT_SECRET=your_random_string_here
echo.
echo 4. Restart the server:
echo    pkill -f node
echo    cd /var/www/ai-image-generator ^&^& node server.js
echo.
echo Your app will be at: http://76.13.242.128:3000
echo.
echo Demo login: demo@example.com / demo123
echo.
pause
