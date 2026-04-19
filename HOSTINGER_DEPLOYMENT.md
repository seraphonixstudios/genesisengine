# Hostinger VPS Deployment Guide

Complete guide to deploy AI Image Generator on Hostinger VPS

## Prerequisites

- Hostinger VPS with at least 2GB RAM and 20GB storage
- SSH access to your VPS
- A domain name pointing to your VPS IP
- Hugging Face API key for image generation

## Deployment Options

### Option 1: Automatic Deployment (Recommended)

#### Step 1: Connect to VPS via SSH

```bash
ssh root@your-vps-ip
```

#### Step 2: Clone Repository

```bash
cd /var/www
git clone https://github.com/yourusername/ai-image-generator.git
cd ai-image-generator
```

#### Step 3: Run Complete Deployment

```bash
sudo bash deploy/complete-deploy.sh your-domain.com your-email@example.com
```

The script will:
- Update system packages
- Install Node.js and dependencies
- Install PM2 process manager
- Configure Nginx reverse proxy
- Setup SSL certificate
- Start the application

#### Step 4: Configure Environment

Edit `.env` file with your settings:

```bash
nano .env
```

Add your API keys and configuration:
```
HUGGINGFACE_API_KEY=your-key
NODE_ENV=production
```

#### Step 5: Verify Deployment

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs

# Check Nginx
systemctl status nginx
```

---

### Option 2: Docker Deployment

#### Step 1: Install Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

#### Step 2: Prepare Deployment

```bash
cd /var/www/ai-image-generator

# Copy production environment file
cp deploy/.env.production .env.production

# Edit with your values
nano .env.production
```

#### Step 3: Build and Deploy

```bash
# Build Docker image
docker build -f Dockerfile.production -t ai-image-generator:latest .

# Or use docker-compose
docker-compose -f docker-compose.production.yml up -d
```

#### Step 4: Verify

```bash
# Check running containers
docker ps

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Test API
curl http://localhost:5001/api/health
```

---

### Option 3: Manual Deployment

If you prefer manual control:

#### Step 1: System Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

#### Step 2: Setup Application

```bash
# Create app directory
sudo mkdir -p /var/www/ai-image-generator
cd /var/www/ai-image-generator

# Upload your files (via SFTP or git clone)
git clone https://github.com/yourusername/ai-image-generator.git .

# Install dependencies
npm install --legacy-peer-deps

# Build frontend
cd client && npm run build && cd ..

# Create environment file
cp deploy/.env.production .env
nano .env
```

#### Step 3: Setup PM2

```bash
# Copy ecosystem config
cp deploy/ecosystem.config.js .

# Start with PM2
pm2 start ecosystem.config.js

# Save for auto-restart
pm2 save
pm2 startup
```

#### Step 4: Setup Nginx

```bash
# Copy Nginx configuration
sudo cp deploy/nginx.conf /etc/nginx/nginx.conf

# Update domain in config
sudo nano /etc/nginx/nginx.conf
# Change "your-domain.com" to your actual domain

# Test configuration
sudo nginx -t

# Start Nginx
sudo systemctl restart nginx
```

#### Step 5: Setup SSL Certificate

```bash
# Get SSL certificate
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com

# Update certificate paths in nginx.conf
sudo nano /etc/nginx/nginx.conf

# Restart Nginx
sudo systemctl restart nginx
```

---

## Configuration

### Environment Variables

Copy `deploy/.env.production` to `.env` and update:

```bash
# Required
HUGGINGFACE_API_KEY=your-key
JWT_SECRET=your-secret-key

# Domain Configuration
API_URL=https://your-domain.com/api
FRONTEND_URL=https://your-domain.com

# Optional but recommended
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Nginx Configuration

Key settings in `deploy/nginx.conf`:
- **SSL/TLS**: Modern encryption
- **Rate limiting**: API protection
- **Compression**: Gzip for faster delivery
- **Caching**: Static asset caching
- **Security headers**: XSS, clickjacking protection

### PM2 Configuration

Settings in `ecosystem.config.js`:
- **Cluster mode**: Uses all CPU cores
- **Auto-restart**: Restarts on crash
- **Memory limit**: 500MB per instance
- **Logging**: Persistent logs

---

## Monitoring & Maintenance

### Check Application Status

```bash
# PM2 status
pm2 status
pm2 logs ai-image-generator-api
pm2 logs ai-image-generator-frontend

# Nginx status
systemctl status nginx
sudo nginx -t

# System resources
top
df -h
free -h
```

### Update Application

```bash
cd /var/www/ai-image-generator

# Pull latest code
git pull

# Rebuild frontend
cd client && npm run build && cd ..

# Restart application
pm2 restart all

# Or with Docker
docker-compose -f docker-compose.production.yml down
docker build -f Dockerfile.production -t ai-image-generator:latest .
docker-compose -f docker-compose.production.yml up -d
```

### Backup Database

```bash
# Manual backup
cp data/ai-generator.db backups/ai-generator-$(date +%s).db

# Automated with Docker Compose (configured)
# Or setup cron job

# Setup cron (every day at 2 AM)
crontab -e
# Add: 0 2 * * * cp /var/www/ai-image-generator/data/ai-generator.db /var/www/ai-image-generator/backups/backup-$(date +\%s).db
```

### View Logs

```bash
# Application logs
tail -f /var/www/ai-image-generator/logs/out.log

# Nginx access logs
tail -f /var/log/nginx/access.log

# Nginx error logs
tail -f /var/log/nginx/error.log

# System logs
journalctl -u nginx -f
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs

# Check if port is in use
sudo lsof -i :5001

# Check Node.js
node --version

# Rebuild dependencies
npm install --legacy-peer-deps
npm run db:generate
```

### Nginx 502 Bad Gateway

```bash
# Check backend status
curl http://localhost:5001/api/health

# Check Nginx config
sudo nginx -t

# Restart backend
pm2 restart all

# Check upstream connection
curl -v http://localhost:5001/api/health
```

### SSL Certificate Issues

```bash
# Check certificate expiry
sudo certbot certificates

# Renew certificate
sudo certbot renew --dry-run

# Reload Nginx after renewal
sudo systemctl reload nginx
```

### Database Issues

```bash
# Check database
sqlite3 /var/www/ai-image-generator/data/ai-generator.db ".databases"

# Backup and reset if corrupted
cp data/ai-generator.db data/ai-generator.db.backup
rm data/ai-generator.db
npm run db:migrate
```

### High Memory Usage

```bash
# Check memory
top -b -n 1 | head -20

# Check process memory
ps aux | sort -nrk 4,4 | head -20

# In PM2 config, increase memory limit
# max_memory_restart: "1G"

# Restart with new limits
pm2 restart all
```

---

## Performance Optimization

### Enable Caching

```bash
# Redis for caching (optional)
sudo apt install -y redis-server
sudo systemctl start redis-server

# Update .env
CACHE_ENABLED=true
REDIS_URL=redis://localhost:6379
```

### Database Optimization

```bash
# Vacuum database
sqlite3 /var/www/ai-image-generator/data/ai-generator.db "VACUUM;"

# Check database size
du -h /var/www/ai-image-generator/data/ai-generator.db
```

### Monitor Performance

```bash
# Watch server metrics
watch -n 1 'free -h && echo "---" && df -h'

# Monitor Nginx connections
watch -n 1 'netstat -an | grep ESTABLISHED | wc -l'

# Check Node.js memory
node -e "console.log(require('os').totalmem() / 1024 / 1024 / 1024, 'GB')"
```

---

## Security Hardening

### Firewall Configuration

```bash
sudo apt install -y ufw

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

### Fail2Ban Protection

```bash
sudo apt install -y fail2ban

# Create config
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Start
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

### SSH Hardening

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Recommended changes:
# - Port 22
# - PermitRootLogin no
# - PasswordAuthentication no
# - PubkeyAuthentication yes

sudo systemctl restart ssh
```

---

## Commands Reference

### PM2 Commands

```bash
pm2 start ecosystem.config.js    # Start all apps
pm2 status                        # Show status
pm2 logs                          # View logs
pm2 stop all                      # Stop all
pm2 restart all                   # Restart all
pm2 delete all                    # Remove from PM2
pm2 save                          # Save process list
pm2 startup                       # Enable auto-restart
```

### Nginx Commands

```bash
sudo systemctl start nginx        # Start Nginx
sudo systemctl stop nginx         # Stop Nginx
sudo systemctl restart nginx      # Restart Nginx
sudo systemctl status nginx       # Check status
sudo nginx -t                     # Test configuration
sudo systemctl reload nginx       # Reload config
```

### Docker Commands

```bash
docker ps                         # List containers
docker logs container-id          # View logs
docker exec -it container-id bash # Shell access
docker-compose down              # Stop services
docker-compose up -d             # Start services
docker-compose logs -f           # View logs
```

---

## Useful Resources

- [Hostinger VPS Docs](https://www.hostinger.com/help)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt/Certbot](https://certbot.eff.org/)
- [Docker Documentation](https://docs.docker.com/)

---

## Support

For issues or questions:
1. Check the logs (pm2 logs, nginx error logs)
2. Review troubleshooting section
3. Check application repository issues
4. Contact Hostinger support for infrastructure issues

---

**Status: ✓ Ready for Production Deployment**
