# VPS Deployment Guide - Hostinger

## 🚀 Quick Deploy Steps

### Step 1: Connect to Your VPS

```bash
ssh root@76.13.242.128
```

### Step 2: Update System & Install Dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install Nginx
apt install nginx -y

# Install Git
apt install git -y
```

### Step 3: Create Application Directory

```bash
mkdir -p /var/www/ai-image-generator
cd /var/www/ai-image-generator
```

### Step 4: Upload Your Code

**Option A: Using SCP (from your local machine)**
```bash
# On your local machine, run:
scp -r C:\Users\User\Desktop\capital\AI\ Image\ Generator\* root@76.13.242.128:/var/www/ai-image-generator/
```

**Option B: Using Git (if you have a repository)**
```bash
git clone <your-repo-url> /var/www/ai-image-generator
cd /var/www/ai-image-generator
```

**Option C: Using FileZilla or WinSCP**
- Connect to `76.13.242.128` with SFTP
- Username: `root`
- Password: Your VPS password
- Upload all files to `/var/www/ai-image-generator/`

### Step 5: Install Dependencies & Build

```bash
cd /var/www/ai-image-generator

# Install server dependencies
npm install

# Install client dependencies and build
cd client
npm install
npm run build
cd ..

# Create logs directory
mkdir -p logs
mkdir -p uploads

# Set permissions
chmod -R 755 uploads
chmod -R 755 logs
```

### Step 6: Create Environment File

```bash
nano /var/www/ai-image-generator/.env
```

Add this content:
```
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
FRONTEND_URL=http://76.13.242.128
```

**⚠️ IMPORTANT:** Replace `your_huggingface_api_key_here` with your actual Hugging Face API key!

### Step 7: Start with PM2

```bash
cd /var/www/ai-image-generator

# Start the application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
```

### Step 8: Configure Nginx (Optional but Recommended)

```bash
nano /etc/nginx/sites-available/ai-image-generator
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name 76.13.242.128;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /var/www/ai-image-generator/uploads;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/ai-image-generator /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 9: Configure Firewall

```bash
# Allow HTTP﻿ traffic
ufw allow 80/tcp

# Allow your application port
ufw allow 3000/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

### Step 10: Test Your Deployment

```bash
# Test health endpoint
curl http://76.13.242.128:3000/api/health

# Should return:
# {"status":"online","version":"2.0.0",...}
```

Open your browser and visit:
- **Application:** http://76.13.242.128:3000
- **Health Check:** http://76.13.242.128:3000/api/health

---

## 📋 Useful PM2 Commands

```bash
# View application status
pm2 status

# View logs
pm2 logs ai-image-generator

# Restart application
pm2 restart ai-image-generator

# Stop application
pm2 stop ai-image-generator

# Delete application from PM2
pm2 delete ai-image-generator

# Monitor application
pm2 monit
```

---

## 🔄 Update Deployment

When you need to update the code:

```bash
cd /var/www/ai-image-generator

# Pull new code (if using git)
git pull

# Or upload new files via SCP/FileZilla

# Install dependencies
npm install

# Rebuild client
cd client && npm run build && cd ..

# Restart with PM2
pm2 restart ai-image-generator
```

---

## 🛠️ Troubleshooting

### Issue: Application won't start
```bash
# Check PM2 logs
pm2 logs ai-image-generator

# Check if port is in use
lsof -i :3000

# Kill process using port
kill -9 <PID>
```

### Issue: Permission denied
```bash
# Fix permissions
chown -R root:root /var/www/ai-image-generator
chmod -R 755 /var/www/ai-image-generator
```

### Issue: Missing environment variables
```bash
# Check .env file exists
cat /var/www/ai-image-generator/.env

# Restart PM2 to load new env variables
pm2 restart ai-image-generator --update-env
```

### Issue: Frontend not loading
```bash
# Check if build exists
ls -la /var/www/ai-image-generator/client/dist/

# Rebuild if needed
cd /var/www/ai-image-generator/client
npm run build
```

---

## 🔒 Security Checklist

- [ ] Change JWT_SECRET to a strong random string
- [ ] Set up HTTPS (Let's Encrypt)
- [ ] Configure firewall (UFW)
- [ ] Disable root SSH login (use key-based auth)
- [ ] Set up automatic security updates
- [ ] Configure log rotation
- [ ] Set up monitoring/alerting

---

## 📊 Monitoring

### Check Application Status
```bash
pm2 status
pm2 monit
```

### View Logs
```bash
# Application logs
pm2 logs ai-image-generator

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# System logs
journalctl -u nginx -f
```

### Check Resource Usage
```bash
htop
# or
docker stats (if using Docker)
```

---

## 🎉 Success!

Your AI Image Generator is now deployed on Hostinger VPS!

**Demo Credentials:**
- Email: `demo@example.com`
- Password: `demo123`

**API Base URL:** http://76.13.242.128:3000/api

**Health Check:** http://76.13.242.128:3000/api/health

---

## 📞 Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs ai-image-generator`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Verify .env file has correct values
4. Ensure Hugging Face API key is valid
