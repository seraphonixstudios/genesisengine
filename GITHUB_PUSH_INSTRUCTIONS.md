# GitHub Push Instructions

## Step 1: Create GitHub Repository (Do This First!)

1. Go to https://github.com/new
2. **Repository name:** `genesis-engine`
3. **Description:** `AI Image Generation Platform - Seven Modes of Creation, 20 Free Generations/Day`
4. **Visibility:** Public (or Private)
5. **⚠️ IMPORTANT:** 
   - [ ] UNCHECK "Add a README file"
   - [ ] UNCHECK "Add .gitignore"
   - [ ] UNCHECK "Choose a license"
6. Click **"Create repository"**

## Step 2: Add Remote and Push

Run these commands (replace YOUR_USERNAME with your actual GitHub username):

```bash
git remote add origin https://github.com/YOUR_USERNAME/genesis-engine.git
git push -u origin main
```

## Quick Copy-Paste Commands

### For PowerShell:
```powershell
$username = Read-Host "Enter your GitHub username"
git remote add origin "https://github.com/$username/genesis-engine.git"
git push -u origin main
```

### For Command Prompt:
```cmd
set /p username="Enter your GitHub username: "
git remote add origin https://github.com/%username%/genesis-engine.git
git push -u origin main
```

### For Git Bash:
```bash
read -p "Enter your GitHub username: " username
git remote add origin https://github.com/$username/genesis-engine.git
git push -u origin main
```

## After Push - Add Environment Secrets

Go to your GitHub repository:
1. Click **Settings** tab
2. Click **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add:
   - Name: `HUGGINGFACE_API_KEY`
   - Value: Your HuggingFace token (get at https://huggingface.co/settings/tokens)

## Verify Push Was Successful

```bash
# Check remote
git remote -v

# Should show:
# origin  https://github.com/YOUR_USERNAME/genesis-engine.git (fetch)
# origin  https://github.com/YOUR_USERNAME/genesis-engine.git (push)

# View status
git status

# Check GitHub
# Visit: https://github.com/YOUR_USERNAME/genesis-engine
```

## Full Example Session

```bash
# 1. Make sure you're in the project directory
cd "C:\Users\User\Desktop\AI Image Generator"

# 2. Check current status
git status

# 3. Add remote (replace with your username)
git remote add origin https://github.com/johndoe/genesis-engine.git

# 4. Verify remote was added
git remote -v

# 5. Push to GitHub
git push -u origin main

# 6. Enter credentials when prompted
# (Or use SSH if configured)

# 7. Success! 🎉
```

## Troubleshooting

### "fatal: remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/genesis-engine.git
```

### "failed to push some refs"
Your GitHub repo might have files. Delete and recreate it empty, or:
```bash
git pull origin main --rebase
git push origin main
```

### "Could not resolve host: github.com"
Check your internet connection or use:
```bash
git remote set-url origin git@github.com:YOUR_USERNAME/genesis-engine.git
```

### Authentication Issues
If prompted for password, use your **Personal Access Token** (not your GitHub password):
1. Generate token: https://github.com/settings/tokens
2. Use token as password
3. Or use SSH keys for easier auth

## What's Next After Push

1. ✅ Code is on GitHub
2. Add environment secrets (HUGGINGFACE_API_KEY)
3. Deploy to Render/Railway (they auto-deploy from GitHub)
4. Share your Genesis Engine!

## Your Repository URL Will Be
```
https://github.com/YOUR_USERNAME/genesis-engine
```
