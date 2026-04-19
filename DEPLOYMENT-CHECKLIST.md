# 🚀 Quick Deployment Checklist - Hostinger VPS

## Pre-Deployment Checklist

### 1. Local Preparation (On Your Computer)
- [ ] Ensure all code changes are saved
- [ ] Run tests locally: `npm test`
- [ ] Build client: `cd client && npm run build`
- [ ] Verify `.env` file has production values ready
- [ ] Have your Hugging Face API key ready

### 2. VPS Access
- [ ] VPS IP: `76.13.242.128`
- [ ] Username: `root`
- [ ] Password: [Your VPS Password]
- [ ] SSH access confirmed

---

## Deployment Steps

### Method 1: Automated Deployment Script (Recommended)

1. **Upload files to VPS:**
   ```bash
   # On your local machine (PowerShell or CMD)
   scp -r "C:\Users\User\Desktop\capital\AI Image Generator\*" root@76.13.242.128:/var/www/ai-image-generator/
   ```

2. **SSH into VPS:**
   ```bash
   ssh root@76.13.242.128
   ```

3. **Run deployment script:**
   ```bash
   cd /var/www/ai-image-generator
   chmod +x deploy-to-vps.sh
   ./deploy-to-vps.sh
   ```

4. **Follow prompts to:**
   - Edit `.env` file with your API keys
   - Wait for installation to complete

### Method 2: Manual Step-by-Step

#### Step 1: Connect to VPS
```bash
ssh root@76.13.242.128
```

#### Step 2: Install Dependencies
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2 and Nginx
npm install -g pm2
apt install nginx -y
```

#### Step 3: Upload Files
```bash
# Create directory
mkdir -p /var/www/ai-image-generator

# From your local machine, upload files:
scp -r "C:\Users\User\Desktop\capital\AI Image Generator\*" root@76.13.242.128:/var/www/ai-image-generator/
```

#### Step 4: Setup Application
```bash
cd /var/www/ai-image-generator

# Install dependencies
npm install

# Build client
cd client
npm install
npm run build
cd ..

# Create directories
mkdir -p logs uploads

# Create .env file
nano .env
```

**Add to .env:**
```
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
HUGGINGFACE_API_KEY=your_actual_api_key_here
JWT_SECRET=your_strong_secret_here_min_32_chars
FRONTEND_URL=http://76.13.242.128
```

#### Step 5: Start Application
```bash
# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 config
pm2 save
pm2 startup

# Configure Nginx
cp nginx-config.txt /etc/nginx/sites-available/ai-image-generator
ln -s /etc/nginx/sites-available/ai-image-generator /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Configure firewall
ufw allow 80/tcp
ufw allow 3000/tcp
ufw allow OpenSSH
ufw enable
```

---

## Post-Deployment Verification

### Check Application Status
```bash
# Check PM2 status
pm2 status

# Test health endpoint
curl http://localhost:3000/api/health

# View logs
pm2 logs ai-image-generator
```

### Browser Tests
- [ ] http://76.13.242.128:3000 (Main App)
- [ ] http://76.13.242.128:3000/api/health (API Health)
- [ ] Login with demo credentials
- [ ] Test image generation

### Demo Credentials
- **Email:** `demo@example.com`
- **Password:** `demo123`

---

## Troubleshooting

### If Application Won't Start
```bash
# Check logs
pm2 logs ai-image-generator

# Check if port is in use
lsof -i :3000

# Restart
pm2 restart ai-image-generator
```

### If Environment Variables Not Loading
```bash
# Restart with env update
pm2 restart ai-image-generator --update-env
```

### If Frontend Not Loading
```bash
# Check build exists
ls -la /var/www/ai-image-generator/client/dist/

# Rebuild
cd /var/www/ai-image-generator/client
npm run build
```

---

## File Locations on VPS

```
/var/www/ai-image-generator/
├── server-production.js    # Main server file
├── ecosystem.config.js     # PM2 configuration
├── package.json           # Dependencies
├── .env                   # Environment variables
├── uploads/               # Generated images
├── logs/                  # Application logs
└── client/
    └── dist/             # Built frontend
```

---

## Important Commands

| Command | Description |
|---------|-------------|
| `pm2 status` | Check application status |
| `pm2 logs` | View application logs |
| `pm2 restart ai-image-generator` | Restart app |
| `pm2 stop ai-image-generator` | Stop app |
| `pm2 monit` | Monitor resources |
| `nginx -t` | Test Nginx config |
| `ufw status` | Check firewall |
| `systemctl status nginx` | Check Nginx status |

---

## Security Reminders

- [ ] Change default JWT_SECRET to strong random string
- [ ] Set up HTTPS (Let's Encrypt)
- [ ] Disable root SSH login (create user with sudo)
- [ ] Set up automatic security updates
- [ ] Configure fail2ban for SSH protection
- [ ] Set up log rotation

---

## Success Criteria

✅ Application accessible at http://76.13.242.128:3000  
✅ Health endpoint returns 200 OK  
✅ Can login with demo credentials  
✅ Can generate images  
✅ PM2 shows app as "online"  
✅ Nginx serving traffic (if configured)  
✅ Firewall allowing connections  

---

## Need Help?

1. Check logs: `pm2 logs ai-image-generator`
2. Test locally: `curl http://localhost:3000/api/health`
3. Verify .env: `cat /var/www/ai-image-generator/.env`
4. Check PM2: `pm2 status`
5. Review Nginx: `nginx -t && tail -f /var/log/nginx/error.log`

**🎉 You're ready to deploy!**
