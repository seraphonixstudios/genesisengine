# Genesis Engine - Deployment Guide

> **Deploy your own Genesis Engine to the cloud in under 10 minutes**

## 📋 Prerequisites

Before you begin, ensure you have:

- [ ] Git installed
- [ ] GitHub account
- [ ] At least one AI provider API key (HuggingFace is free)
- [ ] 10 minutes of free time

## 🚀 Quick Deployment Options

### Option 1: Render (Recommended - Free Tier)
**Difficulty:** ⭐ Easy  
**Time:** 5 minutes  
**Cost:** Free (with limits)

### Option 2: Railway (Free Tier)
**Difficulty:** ⭐ Easy  
**Time:** 5 minutes  
**Cost:** Free (with limits)

### Option 3: Vercel + Railway (Full Stack)
**Difficulty:** ⭐⭐ Medium  
**Time:** 10 minutes  
**Cost:** Free

### Option 4: Self-Hosted (VPS/Dedicated)
**Difficulty:** ⭐⭐⭐ Advanced  
**Time:** 20 minutes  
**Cost:** $5-20/month

---

## 🎯 Option 1: Deploy to Render (Easiest)

### Step 1: Prepare Your Repository

```bash
# Run the initialization script
cd genesis-engine
bash scripts/init-git.sh

# Or manually:
git init
git add .
git commit -m "Genesis Engine v5.0 - Initial Release"
git branch -M main
```

### Step 2: Push to GitHub

```bash
# Create repo on GitHub first (don't initialize with README)
git remote add origin https://github.com/YOUR_USERNAME/genesis-engine.git
git push -u origin main
```

### Step 3: Connect to Render

1. Visit [Render Dashboard](https://dashboard.render.com/)
2. Click **"New Web Service"**
3. Connect your GitHub repository
4. Render will auto-detect settings from `render.yaml`

### Step 4: Configure Environment Variables

In Render dashboard, add these environment variables:

```
NODE_ENV=production
JWT_SECRET=<generate-a-random-string>
HUGGINGFACE_API_KEY=your_huggingface_token_here
REPLICATE_API_TOKEN=your_replicate_token_here (optional)
```

**Get your HuggingFace token:** https://huggingface.co/settings/tokens

### Step 5: Deploy!

Click "Create Web Service" and Render will:
- ✅ Build the client
- ✅ Install server dependencies
- ✅ Deploy automatically
- ✅ Provide you with a URL

**Your Genesis Engine will be live at:** `https://genesis-engine-xxxx.onrender.com`

---

## 🚂 Option 2: Deploy to Railway

### Step 1: Install Railway CLI

```bash
# macOS/Linux
npm install -g @railway/cli

# Or use the web interface
```

### Step 2: Login and Create Project

```bash
# Login
railway login

# Initialize project
railway init

# Link to existing project (if created via web)
railway link
```

### Step 3: Add Environment Variables

```bash
# Via CLI
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your-secret-key
railway variables set HUGGINGFACE_API_KEY=your-token

# Or via web dashboard: https://railway.app/dashboard
```

### Step 4: Deploy

```bash
# Deploy from current directory
railway up

# Open in browser
railway open
```

**Railway will use the `railway.json` configuration file automatically.**

---

## 🌐 Option 3: Vercel (Frontend) + Railway (Backend)

### Deploy Backend to Railway

Follow Option 2 above for the backend deployment.

### Deploy Frontend to Vercel

1. **Push your code to GitHub**

2. **Visit Vercel Dashboard**: https://vercel.com/dashboard

3. **Import Project**
   - Click "Add New Project"
   - Import your GitHub repository
   - Select the `client` directory as root

4. **Configure Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. **Environment Variables**
   ```
   VITE_API_URL=https://your-railway-app.up.railway.app
   ```

6. **Deploy**

**Benefits:**
- ✅ Global CDN for frontend
- ✅ Separate scaling for frontend/backend
- ✅ Best performance for users worldwide

---

## 🐳 Option 4: Self-Hosted with Docker

### Using Docker Compose (Recommended for VPS)

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/genesis-engine.git
cd genesis-engine

# Create environment file
cp server/.env.example server/.env
nano server/.env  # Edit with your API keys

# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f genesis-engine
```

**Services started:**
- Genesis Engine on port 5000
- Redis on port 6379

### Using Pure Docker

```bash
# Build image
docker build -t genesis-engine .

# Run container
docker run -d \
  --name genesis-engine \
  -p 5000:5000 \
  -e HUGGINGFACE_API_KEY=your-token \
  -e JWT_SECRET=your-secret \
  -v $(pwd)/uploads:/app/uploads \
  genesis-engine
```

---

## ☁️ Platform-Specific Guides

### Deploy to AWS (EC2)

```bash
# 1. Launch Ubuntu 22.04 instance
# 2. SSH into instance
ssh ubuntu@your-ec2-ip

# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Install PM2
sudo npm install -g pm2

# 5. Clone and setup
git clone https://github.com/YOUR_USERNAME/genesis-engine.git
cd genesis-engine
cp server/.env.example server/.env
# Edit server/.env with your API keys

# 6. Install dependencies
cd server && npm install --production
cd ../client && npm install && npm run build

# 7. Start with PM2
pm2 start ../server/server.js --name genesis-engine
pm2 startup
pm2 save
```

### Deploy to DigitalOcean App Platform

1. Fork repository to GitHub
2. Visit [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
3. Create App → GitHub → Select repository
4. Configure:
   - Type: Web Service
   - Branch: main
   - Build Command: `npm install && cd client && npm install && npm run build`
   - Run Command: `cd server && npm start`
5. Add environment variables
6. Deploy

### Deploy to Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create genesis-engine-app

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret
heroku config:set HUGGINGFACE_API_KEY=your-token

# Deploy
git push heroku main

# Open
heroku open
```

---

## 🔐 Environment Variables Reference

### Required (Minimum for Free Tier)

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=<random-32-char-string>
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxx
```

### Optional (Enhanced Features)

```env
# Additional AI Providers
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxx
STABILITY_API_KEY=sk-xxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx

# Rate Limiting
DAILY_GENERATION_LIMIT=20

# Redis (for production queue)
REDIS_URL=redis://localhost:6379

# Cloud Storage (AWS S3/CloudFlare R2)
AWS_ACCESS_KEY_ID=xxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxx
AWS_BUCKET_NAME=genesis-engine-uploads
AWS_ENDPOINT=https://xxxx.r2.cloudflarestorage.com

# Monitoring
SENTRY_DSN=https://xxxx@xxxx.ingest.sentry.io/xxxx
```

---

## 🧪 Testing Your Deployment

### Health Check

```bash
# Check if service is running
curl https://your-app-url/health

# Expected response:
{
  "name": "Genesis Engine",
  "status": "healthy",
  "version": "5.0.0",
  "features": [...],
  "freeTier": {
    "dailyGenerations": 20,
    "resetTime": "00:00 UTC"
  }
}
```

### Test Generation

```bash
# Test text-to-image endpoint
curl -X POST https://your-app-url/api/generate/txt2img \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a serene mountain landscape",
    "provider": "huggingface",
    "style": "photorealistic"
  }'
```

---

## 📊 Post-Deployment Checklist

- [ ] Service is accessible via HTTPS
- [ ] Health check endpoint returns 200
- [ ] Can register a new user
- [ ] Can generate an image (test 20/day limit)
- [ ] WebSocket connection works (real-time progress)
- [ ] Gallery displays correctly
- [ ] All 7 generation modes work
- [ ] Environment variables are secure (not exposed in client)
- [ ] File uploads work
- [ ] Daily generation limit resets at midnight UTC

---

## 🚨 Troubleshooting

### "Cannot find module 'xxx'"

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### "HUGGINGFACE_API_KEY not configured"

1. Get free token: https://huggingface.co/settings/tokens
2. Add to environment variables in deployment platform
3. Redeploy

### "Build failed"

```bash
# Check build logs
# Ensure client builds successfully:
cd client
npm install
npm run build
```

### "WebSocket connection failed"

- Check CORS_ORIGIN matches your frontend URL
- Ensure WebSocket port is not blocked by firewall
- Verify WS_CORS_ORIGIN environment variable

### "Daily limit not resetting"

- Check server timezone is set to UTC
- Verify DAILY_GENERATION_LIMIT environment variable
- Check Redis connection (if using Redis for production)

---

## 🔄 Updating Your Deployment

### Automatic Updates (Render/Railway)

Just push to GitHub:

```bash
git add .
git commit -m "Update: new feature"
git push origin main
```

**Render/Railway will auto-deploy!**

### Manual Update (Docker)

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

---

## 🌟 Production Optimization

### 1. Enable Redis (for production)

Uncomment in `docker-compose.yml` or add Redis URL to environment.

### 2. Use Cloud Storage

Configure AWS S3 or CloudFlare R2 for persistent image storage.

### 3. Add CDN

Use CloudFlare or AWS CloudFront for global content delivery.

### 4. Monitoring

Add Sentry for error tracking:
```bash
npm install @sentry/node
```

### 5. Backup Strategy

Set up automated backups for:
- Environment variables
- Uploads directory
- User database (if using PostgreSQL)

---

## 📞 Support

**Deployment Issues:**
- Check logs: `docker-compose logs` or platform dashboard
- Verify environment variables
- Test locally first: `npm run dev`

**General Help:**
- GitHub Issues: https://github.com/YOUR_USERNAME/genesis-engine/issues
- Documentation: docs/README.md
- Community: Discord (coming soon)

---

## 🎉 Success!

Your Genesis Engine is now live and ready to create!

**Share your deployment:**
```
🌟 Just deployed Genesis Engine!

"In the beginning, there was the prompt"

✨ 20 free generations/day
🎨 7 modes of creation
🤖 4 AI providers

Try it: https://your-app-url
```

---

**Created by Seraphonix Studios** 🔥  
**Powered by Sovereign** 👑

*Last Updated: January 2026*
