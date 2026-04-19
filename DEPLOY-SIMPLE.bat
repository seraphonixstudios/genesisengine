@echo off
REM AI Image Generator - SIMPLE Deployment Script for Windows
REM This creates a deployment package and uploads it to VPS

echo ==============================================
echo   AI Image Generator - Simple Deploy
echo ==============================================
echo.
echo VPS: 76.13.242.128
echo.

REM Change to script directory
cd /d "%~dp0"

echo [1/5] Preparing files...
REM Remove node_modules to speed up upload
if exist node_modules (
    echo Removing node_modules folder...
    rmdir /s /q node_modules
)
if exist client\node_modules (
    echo Removing client/node_modules folder...
    rmdir /s /q client\node_modules
)

echo.
echo [2/5] Creating deployment package...
REM Create a zip file (excluding unnecessary files)
powershell -Command "Compress-Archive -Path '*' -DestinationPath 'deploy-package.zip' -Force"

echo.
echo [3/5] Uploading to VPS...
echo This will take a few minutes...
echo.

REM Upload using SCP
scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL deploy-package.zip root@76.13.242.128:/var/www/

if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: Upload failed!
    echo Make sure you can SSH to the VPS first:
    echo   ssh root@76.13.242.128
    pause
    exit /b 1
)

echo.
echo [4/5] Setting up on VPS...
echo.

REM Run setup commands on VPS
ssh root@76.13.242.128 "apt-get update -qq && apt-get install -y unzip -qq && cd /var/www && rm -rf ai-image-generator && mkdir ai-image-generator && unzip -q deploy-package.zip -d ai-image-generator && cd ai-image-generator && npm install && mkdir -p uploads logs && chmod 777 uploads logs"

if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: Setup failed!
    pause
    exit /b 1
)

echo.
echo [5/5] Starting server...
echo.

REM Start the server
ssh root@76.13.242.128 "cd /var/www/ai-image-generator && pkill -f node; nohup node server.js > logs/server.log 2>&1 &"

echo.
echo ==============================================
echo   DEPLOYMENT COMPLETE!
echo ==============================================
echo.
echo IMPORTANT: You need to configure API keys!
echo.
echo 1. SSH to your VPS:
echo    ssh root@76.13.242.128
echo.
echo 2. Edit the .env file:
echo    cd /var/www/ai-image-generator
echo    nano .env
echo.
echo 3. Add your API keys:
echo    HUGGINGFACE_API_KEY=your_key_here
echo    JWT_SECRET=your_secret_here
echo.
echo 4. Restart the server:
echo    pkill -f node
echo    node server.js
echo.
echo Your app will be at: http://76.13.242.128:3000
echo.

REM Clean up
del deploy-package.zip 2>nul

echo Press any key to exit...
pause >nul
