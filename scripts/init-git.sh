#!/bin/bash

# ==========================================
# GENESIS ENGINE - Git Initialization Script
# ==========================================

set -e

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              🌟 GENESIS ENGINE - GIT SETUP 🌟               ║"
echo "║                                                              ║"
echo "║     Initializing repository for deployment                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git is not installed. Please install Git first.${NC}"
    echo "   Visit: https://git-scm.com/downloads"
    exit 1
fi

# Check if already initialized
if [ -d ".git" ]; then
    echo -e "${YELLOW}⚠️  Git repository already initialized${NC}"
    read -p "   Do you want to reinitialize? (y/N): " confirm
    if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
        rm -rf .git
    else
        echo -e "${BLUE}ℹ️  Using existing repository${NC}"
    fi
fi

# Initialize git
echo -e "${BLUE}📦 Initializing Git repository...${NC}"
git init

# Configure git (if not already configured)
if [ -z "$(git config user.name)" ]; then
    echo ""
    read -p "Enter your Git username: " git_username
    git config user.name "$git_username"
fi

if [ -z "$(git config user.email)" ]; then
    echo ""
    read -p "Enter your Git email: " git_email
    git config user.email "$git_email"
fi

echo -e "${GREEN}✅ Git configured:${NC}"
echo "   User: $(git config user.name)"
echo "   Email: $(git config user.email)"

# Create .env files if they don't exist
echo ""
echo -e "${BLUE}🔧 Setting up environment files...${NC}"

if [ ! -f "server/.env" ]; then
    cp server/.env.example server/.env
    echo -e "${YELLOW}⚠️  Created server/.env from example${NC}"
    echo -e "${YELLOW}   Please edit server/.env and add your API keys${NC}"
else
    echo -e "${GREEN}✅ server/.env already exists${NC}"
fi

# Create placeholder directories
echo ""
echo -e "${BLUE}📁 Creating necessary directories...${NC}"
mkdir -p server/uploads server/outputs client/public logs

# Add .gitkeep files to preserve empty directories
touch server/uploads/.gitkeep
 touch server/outputs/.gitkeep
 touch logs/.gitkeep

echo -e "${GREEN}✅ Directories created${NC}"

# Stage files
echo ""
echo -e "${BLUE}📋 Staging files for initial commit...${NC}"
git add .

# Check git status
echo ""
echo -e "${BLUE}📊 Git status:${NC}"
git status --short

# Initial commit
echo ""
echo -e "${BLUE}💾 Creating initial commit...${NC}"
git commit -m "🌟 Genesis Engine v5.0 - Initial Release

Created by Seraphonix Studios • Powered by Sovereign

Features:
- Seven Modes of Creation (txt2img, img2img, inpaint, outpaint, upscale, controlnet, batch)
- Four AI Providers (HuggingFace, Replicate, Stability AI, OpenAI)
- 20 Free Generations/Day
- WebSocket Real-time Progress
- AI Prompt Enhancement

Tagline: 'In the beginning, there was the prompt'"

echo ""
echo -e "${GREEN}✅ Initial commit created!${NC}"

# Create main branch if on master
if git branch --show-current | grep -q "master"; then
    git branch -M main
    echo -e "${GREEN}✅ Renamed branch to 'main'${NC}"
fi

# Instructions for GitHub
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}🎉 Git repository initialized successfully!${NC}"
echo ""
echo -e "${YELLOW}Next steps to push to GitHub:${NC}"
echo ""
echo "1. ${BLUE}Create a new repository on GitHub:${NC}"
echo "   Visit: https://github.com/new"
echo "   Name: genesis-engine"
echo "   (Don't initialize with README, .gitignore, or License)"
echo ""
echo "2. ${BLUE}Link your local repository:${NC}"
echo "   git remote add origin https://github.com/YOUR_USERNAME/genesis-engine.git"
echo ""
echo "3. ${BLUE}Push to GitHub:${NC}"
echo "   git push -u origin main"
echo ""
echo "4. ${BLUE}Add environment secrets (required for deployment):${NC}"
echo "   - Go to Settings > Secrets and variables > Actions"
echo "   - Add: HUGGINGFACE_API_KEY (minimum required)"
echo "   - Optional: REPLICATE_API_TOKEN, STABILITY_API_KEY, OPENAI_API_KEY"
echo ""
echo "5. ${BLUE}Deploy to Render/Railway:${NC}"
echo "   - Connect your GitHub repo to Render or Railway"
echo "   - Environment variables will be auto-detected from render.yaml"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}🚀 Ready to deploy Genesis Engine!${NC}"
echo ""
echo "📚 Documentation: docs/DEPLOYMENT.md"
echo "🔧 Config: server/.env (edit your API keys)"
echo ""

# Offer to open editor
read -p "Would you like to edit server/.env now? (y/N): " edit_env
if [[ $edit_env == [yY] || $edit_env == [yY][eE][sS] ]]; then
    if command -v code &> /dev/null; then
        code server/.env
    elif command -v nano &> /dev/null; then
        nano server/.env
    elif command -v vim &> /dev/null; then
        vim server/.env
    else
        echo "Please edit server/.env manually"
    fi
fi

echo ""
echo -e "${GREEN}✨ 'In the beginning, there was the prompt' ✨${NC}"
echo ""
