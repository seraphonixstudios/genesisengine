# Hostinger VPS Deployment - Quick Start Guide

## 🚀 Quickest Path to Production (5 minutes)

### Prerequisites
- Hostinger VPS (minimum 2GB RAM)
- Domain name
- Hugging Face API key
- SSH access to VPS

### Step 1: SSH into Your VPS

```bash
ssh root@your-vps-ip
# Or if you use a specific user:
ssh user@your-vps-ip
```

### Step 2: Clone Repository

```bash
cd /var/www
git clone https://github.com/yourusername/ai-image-generator.git
cd ai-image-generator
```

### Step 3: Make Deployment Scripts Executable

```bash
chmod +x deploy/*.sh
```

### Step 4: Run Complete Deployment

```bash
sudo bash deploy/complete-deploy.sh your-domain.com your-email@example.com
```

The script automatically:
- ✓ Updates system
- ✓ Installs Node.js, PM2, Nginx
- ✓ Builds frontend
- ✓ Sets up PM2
- ✓ Configures Nginx
- ✓ Installs SSL certificate
- ✓ Starts application

### Step 5: Configure Environment Variables

```bash
nano .env
```

Add your API keys:
```
NODE_ENV=production
HUGGINGFACE_API_KEY=your-key-here
JWT_SECRET=your-secret-key
```

Save and exit (Ctrl+X, then Y)

### Step 6: Restart Application

```bash
pm2 restart all
pm2 logs
```

### Step 7: Verify It's Working

```bash
# Check status
pm2 status

# Test API
curl https://your-domain.com/api/health

# View logs
pm2 logs ai-image-generator-api
```

**That's it! Your app is live at https://your-domain.com** 🎉

---

## Alternative: Deploy from Local Machine

If you want to deploy from your local computer:

```bash
# 1. Make script executable locally
chmod +x deploy/deploy-to-hostinger.sh

# 2. Run deployment
bash deploy/deploy-to-hostinger.sh your-domain.com your.vps.ip root

# 3. SSH in and update .env
ssh root@your.vps.ip
cd /var/www/ai-image-generator
nano .env
```

---

## Useful Commands After Deployment

```bash
# View application status
pm2 status

# View application logs
pm2 logs ai-image-generator-api

# Stop application
pm2 stop all

# Restart application
pm2 restart all

# View system resources
top

# Check disk space
df -h

# Check Nginx status
systemctl status nginx

# View Nginx error logs
tail -f /var/log/nginx/error.log

# Health check script
bash deploy/health-check.sh
```

---

## Troubleshooting

### Application won't start?
```bash
pm2 logs
# Check error message and fix .env configuration
nano .env
pm2 restart all
```

### Domain not working?
```bash
# Check Nginx
sudo nginx -t
systemctl status nginx

# Check DNS
nslookup your-domain.com
```

### SSL certificate issues?
```bash
# Renew certificate
sudo certbot renew

# Check certificate
sudo certbot certificates
```

### Out of memory?
```bash
# Check memory usage
free -h

# Restart application
pm2 restart all

# Or check which process is using memory
ps aux | sort -nrk 4,4 | head -10
```

---

## Important Notes

1. **Environment Variables**: Always update `.env` with your own values
2. **API Keys**: Never commit `.env` to git
3. **Backups**: Regularly backup your `data/` directory
4. **SSL**: Certificates auto-renew, but monitor renewal logs
5. **Logs**: Check `pm2 logs` and Nginx logs for issues

---

## Next Steps

After successful deployment:

1. **Configure CDN** (Optional)
   - Use Cloudflare for better performance

2. **Setup Email** (Optional)
   - Configure SMTP in `.env` for notifications

3. **Monitor Performance**
   - Use `top` command
   - Check `pm2 status` regularly
   - Monitor Nginx access logs

4. **Regular Maintenance**
   - Update application: `git pull && pm2 restart all`
   - Backup database: `cp data/ai-generator.db backups/`
   - Monitor disk space: `df -h`

---

## Getting Help

- Check logs: `pm2 logs`
- Check Nginx: `sudo nginx -t`
- Run health check: `bash deploy/health-check.sh`
- Review main guide: See `HOSTINGER_DEPLOYMENT.md`

---

**Your AI Image Generator is now running on Hostinger VPS!** 🎊
