# AI Image Generator Pro v2.0 - VPS Update Guide

## 🚀 Quick Update Steps

Your VPS IP: `76.13.242.128`
Current App URL: `http://76.13.242.128:3000`

---

## Method 1: Automated Update (Recommended)

### Step 1: Upload New Files to VPS

**Option A: Using SCP (from your local machine)**

Open PowerShell or Command Prompt on your Windows machine:

```powershell
# Create a zip of the new files first
Compress-Archive -Path "C:\Users\User\Desktop\AI Image Generator\*" -DestinationPath "$env:TEMP\ai-generator-update.zip" -Force

# Upload to VPS
scp $env:TEMP\ai-generator-update.zip root@76.13.242.128:/tmp/
```

**Option B: Using FileZilla or WinSCP**
1. Connect to `76.13.242.128` with username `root`
2. Upload the entire `AI Image Generator` folder to `/tmp/ai-generator-update`

### Step 2: SSH into VPS and Run Update

```bash
ssh root@76.13.242.128

# Extract the uploaded files
cd /tmp
unzip ai-generator-update.zip -d ai-generator-update

# Run the update script
cd ai-generator-update
chmod +x update-vps.sh
./update-vps.sh
```

---

## Method 2: Manual Update

### Step 1: SSH into VPS

```bash
ssh root@76.13.242.128
```

### Step 2: Backup Current Installation

```bash
cd /var/www
tar -czf ai-generator-backup-$(date +%Y%m%d).tar.gz ai-generator
echo "Backup created!"
```

### Step 3: Update Server Files

```bash
cd /var/www/ai-generator

# Stop current services
pm2 stop all

# Update package.json
cat > package.json << 'EOF'
{
  "name": "ai-image-generator-pro",
  "version": "2.0.0",
  "description": "Advanced AI Image Generator with multiple providers, upscaling, editing, and enhanced UI",
  "main": "server/server.js",
  "scripts": {
    "start": "node server/server.js",
    "server": "nodemon server/server.js",
    "client": "cd client && npm start",
    "dev:full": "concurrently \"npm run server\" \"npm run client\"",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "axios": "^1.4.0",
    "dotenv": "^16.3.1",
    "uuid": "^9.0.0",
    "helmet": "^7.0.0",
    "compression": "^1.7.4",
    "express-rate-limit": "^6.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "concurrently": "^8.2.0",
    "jest": "^29.7.0"
  }
}
EOF

# Install server dependencies
npm install --production
```

### Step 4: Create New Server Structure

```bash
# Create new server directory structure
mkdir -p server/routes
mkdir -p server/utils
mkdir -p server/middleware
mkdir -p server/uploads
mkdir -p server/temp
mkdir -p server/workspaces
mkdir -p logs

# Set permissions
chmod -R 755 server/uploads
chmod -R 755 server/temp
chmod -R 755 server/workspaces
```

### Step 5: Update Client

```bash
cd /var/www/ai-generator/client

# Update package.json
cat > package.json << 'EOF'
{
  "name": "ai-image-generator-client",
  "version": "2.0.0",
  "private": true,
  "dependencies": {
    "@emotion/react": "^11.11.1",
    "@emotion/styled": "^11.11.0",
    "@mui/icons-material": "^5.14.1",
    "@mui/material": "^5.14.1",
    "axios": "^1.4.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-dropzone": "^14.2.3",
    "react-scripts": "5.0.1",
    "react-router-dom": "^6.14.2",
    "socket.io-client": "^4.7.2"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "eject": "react-scripts eject"
  },
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
  }
}
EOF

# Install dependencies
npm install

# Build for production
npm run build
```

### Step 6: Create PM2 Config

```bash
cd /var/www/ai-generator

cat > ecosystem.config.js << 'EOF'
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
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
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
        PM2_SERVE_SPA: 'true'
      }
    }
  ]
};
EOF

# Install serve globally
npm install -g serve
```

### Step 7: Update Environment Variables

```bash
cat > /var/www/ai-generator/.env << 'EOF'
# Server Configuration
PORT=5000
NODE_ENV=production
CLIENT_URL=http://76.13.242.128:3000

# AI Provider API Keys (add your keys)
HUGGINGFACE_API_KEY=your_huggingface_key_here
OPENAI_API_KEY=your_openai_key_here
REPLICATE_API_TOKEN=your_replicate_token_here
STABILITY_API_KEY=your_stability_key_here
EOF

chmod 600 /var/www/ai-generator/.env
```

### Step 8: Start Services

```bash
cd /var/www/ai-generator

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup systemd

# Check status
pm2 status
```

---

## ✅ Verify Update

Test these URLs:
1. **Health Check**: `curl http://76.13.242.128:5000/api/health`
2. **Frontend**: Open `http://76.13.242.128:3000` in browser
3. **API Docs**: `curl http://76.13.242.128:5000/api/providers`

---

## 🔧 Post-Update Configuration

### Add API Keys

Edit `/var/www/ai-generator/.env` and add your API keys:

```bash
nano /var/www/ai-generator/.env
```

Add at least one:
- **Hugging Face** (Free): https://huggingface.co/settings/tokens
- **OpenAI**: https://platform.openai.com/api-keys
- **Replicate**: https://replicate.com/account/api-tokens

### Restart After Config Changes

```bash
pm2 restart all
```

---

## 🆘 Troubleshooting

### Services won't start
```bash
# Check logs
pm2 logs

# Check for errors
cat /var/www/ai-generator/logs/err.log
```

### Port already in use
```bash
# Find process
lsof -i :3000
lsof -i :5000

# Kill if needed
kill -9 <PID>
```

### Permission denied
```bash
# Fix permissions
chmod -R 755 /var/www/ai-generator
chown -R root:root /var/www/ai-generator
```

### Module not found
```bash
# Reinstall dependencies
cd /var/www/ai-generator
rm -rf node_modules
npm install --production

cd client
rm -rf node_modules
npm install
npm run build
```

---

## 📊 What's New in v2.0

✅ **Multiple AI Providers** - Hugging Face, OpenAI, Stability AI, Replicate
✅ **Image Upscaling** - 2x-4x with Real-ESRGAN
✅ **Image Editing** - Inpaint, Outpaint, Variations, Img2Img
✅ **Advanced Gallery** - Filtering, sorting, workspaces
✅ **Modern UI** - Dark theme, 5 tabs, responsive design
✅ **Better Performance** - Optimized backend, caching

---

## 🌐 Access After Update

- **Main App**: http://76.13.242.128:3000
- **API**: http://76.13.242.128:5000
- **Health**: http://76.13.242.128:5000/api/health

**Note**: Make sure ports 3000 and 5000 are open in your Hostinger firewall!
