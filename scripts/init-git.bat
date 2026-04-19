@echo off
REM ==========================================
REM GENESIS ENGINE - Git Initialization Script (Windows)
REM ==========================================

setlocal EnableDelayedExpansion

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║              GENESIS ENGINE - GIT SETUP                      ║
echo ║                                                              ║
echo ║     Initializing repository for deployment                   ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo [31m❌ Git is not installed. Please install Git first.[0m
    echo    Visit: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo [34m📦 Git is installed[0m

REM Check if already initialized
if exist ".git" (
    echo [33m⚠️  Git repository already initialized[0m
    set /p confirm="   Do you want to reinitialize? (y/N): "
    if /I "!confirm!"=="y" (
        rmdir /s /q .git
    ) else (
        echo [34mℹ️  Using existing repository[0m
        goto :setup_complete
    )
)

REM Initialize git
echo [34m📦 Initializing Git repository...[0m
git init

REM Configure git
for /f "tokens=*" %%a in ('git config user.name') do set GIT_USER=%%a
if "!GIT_USER!"=="" (
    set /p git_username="Enter your Git username: "
    git config user.name "!git_username!"
)

for /f "tokens=*" %%a in ('git config user.email') do set GIT_EMAIL=%%a
if "!GIT_EMAIL!"=="" (
    set /p git_email="Enter your Git email: "
    git config user.email "!git_email!"
)

echo [32m✅ Git configured:[0m
for /f "tokens=*" %%a in ('git config user.name') do echo    User: %%a
for /f "tokens=*" %%a in ('git config user.email') do echo    Email: %%a

:setup_complete
REM Create .env files if they don't exist
echo.
echo [34m🔧 Setting up environment files...[0m

if not exist "server\.env" (
    copy server\.env.example server\.env
    echo [33m⚠️  Created server\.env from example[0m
    echo [33m   Please edit server\.env and add your API keys[0m
) else (
    echo [32m✅ server\.env already exists[0m
)

REM Create placeholder directories
echo.
echo [34m📁 Creating necessary directories...[0m
if not exist "server\uploads" mkdir server\uploads
if not exist "server\outputs" mkdir server\outputs
if not exist "client\public" mkdir client\public
if not exist "logs" mkdir logs

echo [32m✅ Directories created[0m

REM Stage files
echo.
echo [34m📋 Staging files for initial commit...[0m
git add .

REM Check git status
echo.
echo [34m📊 Git status:[0m
git status --short

REM Initial commit
echo.
echo [34m💾 Creating initial commit...[0m
git commit -m "🌟 Genesis Engine v5.0 - Initial Release

Created by Seraphonix Studios • Powered by Sovereign

Features:
- Seven Modes of Creation (txt2img, img2img, inpaint, outpaint, upscale, controlnet, batch)
- Four AI Providers (HuggingFace, Replicate, Stability AI, OpenAI)
- 20 Free Generations/Day
- WebSocket Real-time Progress
- AI Prompt Enhancement

Tagline: 'In the beginning, there was the prompt'"

echo [32m✅ Initial commit created![0m

REM Create main branch if on master
for /f "tokens=*" %%a in ('git branch --show-current') do set CURRENT_BRANCH=%%a
if "!CURRENT_BRANCH!"=="master" (
    git branch -M main
    echo [32m✅ Renamed branch to 'main'[0m
)

REM Instructions for GitHub
echo.
echo ═══════════════════════════════════════════════════════════════
echo.
echo [32m🎉 Git repository initialized successfully![0m
echo.
echo [33mNext steps to push to GitHub:[0m
echo.
echo 1. [34mCreate a new repository on GitHub:[0m
echo    Visit: https://github.com/new
echo    Name: genesis-engine
echo    ^(Don't initialize with README, .gitignore, or License^)
echo.
echo 2. [34mLink your local repository:[0m
echo    git remote add origin https://github.com/YOUR_USERNAME/genesis-engine.git
echo.
echo 3. [34mPush to GitHub:[0m
echo    git push -u origin main
echo.
echo 4. [34mAdd environment secrets (required for deployment):[0m
echo    - Go to Settings ^> Secrets and variables ^> Actions
echo    - Add: HUGGINGFACE_API_KEY (minimum required)
echo    - Optional: REPLICATE_API_TOKEN, STABILITY_API_KEY, OPENAI_API_KEY
echo.
echo 5. [34mDeploy to Render/Railway:[0m
echo    - Connect your GitHub repo to Render or Railway
echo    - Environment variables will be auto-detected from render.yaml
echo.
echo ═══════════════════════════════════════════════════════════════
echo.
echo [32m🚀 Ready to deploy Genesis Engine![0m
echo.
echo 📚 Documentation: docs/DEPLOYMENT.md
echo 🔧 Config: server/.env (edit your API keys)
echo.

REM Offer to open editor
set /p edit_env="Would you like to edit server/.env now? (y/N): "
if /I "!edit_env!"=="y" (
    if exist "C:\Program Files\Microsoft VS Code\bin\code.cmd" (
        code server\.env
    ) else (
        notepad server\.env
    )
)

echo.
echo [32m✨ 'In the beginning, there was the prompt' ✨[0m
echo.

pause
