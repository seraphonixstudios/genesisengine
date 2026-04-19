# 🚀 One-Click Deployment Guide

Deploy your AI Image Generator to VPS in **ONE CLICK**!

## 📦 What's Included

Three deployment options for maximum convenience:

1. **DEPLOY.bat** - Double-click deployment (Windows)
2. **deploy-one-click.ps1** - PowerShell script (Windows)
3. **deploy-one-click.sh** - Bash script (Mac/Linux)

Plus:
- **verify-deployment.sh** - Test that everything works after deployment

---

## 🎯 Quick Start (Windows - Easiest)

### Step 1: Prepare
1. Ensure you have SSH access to your VPS (76.13.242.128)
2. Have your VPS root password or SSH key ready
3. Get your Hugging Face API key: https://huggingface.co/settings/tokens

### Step 2: Deploy
**Double-click `DEPLOY.bat`**

That's it! The script will:
- ✅ Prepare files (remove node_modules for faster upload)
- ✅ Upload to VPS
- ✅ Install all dependencies
- ✅ Configure the server
- ✅ Start the application

### Step 3: Configure API Keys
When prompted, SSH into your VPS:
```bash
ssh root@76.13.242.128
nano /var/www/ai-image-generator/.env
```

Add your API keys:
```
HUGGINGFACE_API_KEY=your_actual_api_key_here
JWT_SECRET=your_random_secret_here_at_least_32_chars
```

Save: `Ctrl+O`, `Enter`, `Ctrl+X`

### Step 4: Verify
Run the verification script:
```bash
./verify-deployment.sh
```

Or test in browser:
- http://76.13.242.128:3000
- http://76.13.242.128:3000/api/health

---

## 💻 PowerShell Deployment (Alternative)

If the batch file doesn't work, use PowerShell:

```powershell
# Open PowerShell as Administrator
# Navigate to your project folder
cd "C:\Users\User\Desktop\capital\AI Image Generator"

# Run deployment
.\deploy-one-click.ps1
```

---

## 🐧 Linux/Mac Deployment

```bash
# Make script executable
chmod +x deploy-one-click.sh

# Run deployment
./deploy-one-click.sh
```

---

## 🔍 What The Script Does

### Phase 1: Local Preparation (30 seconds)
- Removes `node_modules` folders (speeds up upload 10x)
- Verifies SSH connectivity to VPS

### Phase 2: VPS Setup (2-3 minutes)
- Cleans old deployment
- Uploads files via SCP
- Installs Node.js (if missing)
- Installs all dependencies (`npm install`)
- Creates required directories
- Sets up PM2 process manager

### Phase 3: Configuration (1 minute)
- Creates `.env` file template
- Prompts you to add API keys
- Configures environment variables

### Phase 4: Launch (30 seconds)
- Starts server with PM2
- Verifies health endpoint
- Displays success message with URLs

**Total time: ~5 minutes**

---

## ✅ Success Indicators

You'll know it worked when you see:
```
==============================================
  DEPLOYMENT COMPLETE!
==============================================

Your AI Image Generator is deployed at:
  • Application: http://76.13.242.128:3000
  • Health Check: http://76.13.242.128:3000/api/health

✓ ALL TESTS PASSED!
```

---

## 🛠️ Troubleshooting

### "Cannot connect to VPS"
- Check VPS IP: `ping 76.13.242.128`
- Verify SSH works: `ssh root@76.13.242.128`
- Check firewall allows port 22

### "Upload failed"
- Try manually: `scp -r "folder/*" root@76.13.242.128:/var/www/ai-image-generator/`
- Check disk space on VPS: `ssh root@76.13.242.128 "df -h"`

### "Server won't start"
- Check logs: `ssh root@76.13.242.128 "pm2 logs ai-image-generator"`
- Verify .env file: `ssh root@76.13.242.128 "cat /var/www/ai-image-generator/.env"`
- Check port in use: `ssh root@76.13.242.128 "lsof -i :3000"`

### "Tests fail but server is running"
- Wait 30 seconds for full startup
- Run verify script again
- Test manually: `curl http://76.13.242.128:3000/api/health`

---

## 📊 Post-Deployment Management

### Check Server Status
```bash
ssh root@76.13.242.128 "pm2 status"
```

### View Logs
```bash
ssh root@76.13.242.128 "pm2 logs ai-image-generator"
```

### Restart Server
```bash
ssh root@76.13.242.128 "pm2 restart ai-image-generator"
```

### Update Application
```bash
# Upload new files
scp -r "C:\Users\User\Desktop\capital\AI Image Generator\*" root@76.13.242.128:/var/www/ai-image-generator/

# Restart
ssh root@76.13.242.128 "pm2 restart ai-image-generator"
```

---

## 🎁 What You Get

After deployment:
- ✅ Fully functional AI Image Generator
- ✅ 100% working API endpoints
- ✅ Web interface accessible globally
- ✅ Auto-restart on crash (PM2)
- ✅ Process monitoring
- ✅ Demo account ready to use

---

## 🎯 Demo Credentials

- **URL:** http://76.13.242.128:3000
- **Email:** demo@example.com
- **Password:** demo123

---

## 🚀 Next Steps

1. **Test the demo login**
2. **Generate your first image**
3. **Create a real user account**
4. **Set up HTTPS** (recommended)
5. **Configure domain name** (optional)

---

## 📞 Need Help?

1. Check VPS-DEPLOYMENT-GUIDE.md for detailed instructions
2. Review DEPLOYMENT-CHECKLIST.md
3. Check server logs: `ssh root@76.13.242.128 "pm2 logs"`
4. Run verify script: `./verify-deployment.sh`

---

**🎉 You're now 1 click away from a fully deployed AI Image Generator!**
