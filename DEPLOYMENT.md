# AI Image Generator - Hostinger VPS Deployment

## Prerequisites

1. Hostinger VPS with Ubuntu 20.04+ or similar
2. SSH access to VPS
3. Domain name (optional but recommended)
4. PM2 installed for process management

## VPS Setup Instructions

### 1. Connect to VPS

```bash
ssh root@your-vps-ip
```

### 2. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Install PM2

```bash
sudo npm install -g pm2
```

### 4. Install Git (if needed)

```bash
sudo apt-get install -y git
```

### 5. Clone/Upload Project

Option A - Clone from GitHub:
```bash
cd /var/www
git clone https://github.com/yourusername/ai-image-generator.git
cd ai-image-generator
```

Option B - Upload via FTP/SFTP:
Upload files to `/var/www/ai-image-generator`

### 6. Install Dependencies

```bash
npm install
```

### 7. Create Environment File

```bash
nano .env
```

Add these variables:
```env
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
PORT=3000
HOST=0.0.0.0
FRONTEND_URL=http://your-domain.com
NODE_ENV=production
```

Save (Ctrl+X, Y, Enter)

### 8. Start Server with PM2

```bash
pm2 start server-production.js --name ai-generator
pm2 save
pm2 startup systemd
```

### 9. Configure Nginx (Reverse Proxy)

```bash
sudo apt-get install nginx
sudo nano /etc/nginx/sites-available/ai-generator
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

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
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/ai-generator /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 10. Setup SSL with Certbot (Optional but Recommended)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 11. Firewall Configuration

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

## Client Deployment

### Option A: Deploy to Same VPS

1. Build the client:
```bash
cd client
npm install
npm run build
```

2. Serve with Nginx:
```bash
sudo mkdir -p /var/www/html/ai-generator
sudo cp -r dist/* /var/www/html/ai-generator/
```

Update Nginx config to serve frontend:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/html/ai-generator;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Uploads
    location /uploads {
        alias /var/www/ai-image-generator/uploads;
    }
}
```

### Option B: Deploy Frontend to Vercel/Netlify

1. Update client environment:
```bash
# client/.env.production
VITE_API_URL=https://your-api-domain.com
```

2. Build and deploy:
```bash
cd client
npm run build
# Upload dist folder to hosting
```

## Monitoring

Check logs:
```bash
pm2 logs ai-generator
```

Monitor processes:
```bash
pm2 monit
```

Restart server:
```bash
pm2 restart ai-generator
```

## Updating

Pull updates:
```bash
cd /var/www/ai-image-generator
git pull
npm install
pm2 restart ai-generator
```

## Troubleshooting

### Port already in use
```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

### Permission denied
```bash
sudo chown -R www-data:www-data /var/www/ai-image-generator
```

### Nginx errors
```bash
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

### Node errors
```bash
pm2 logs
pm2 flush
```

## Security Considerations

1. **Never commit .env file**
2. **Use strong firewall rules**
3. **Keep server and dependencies updated**
4. **Use SSL/HTTPS**
5. **Set up fail2ban for SSH protection**
6. **Regular backups**

## API Limits

Hugging Face free tier has rate limits. For production:
- Monitor API usage
- Implement rate limiting if needed
- Consider upgrading to paid tier for higher volume

## Backup Strategy

Backup uploads directory:
```bash
sudo tar -czf uploads-backup-$(date +%Y%m%d).tar.gz /var/www/ai-image-generator/uploads
```

Setup cron job for daily backups:
```bash
0 2 * * * tar -czf /backups/uploads-$(date +\%Y\%m\%d).tar.gz /var/www/ai-image-generator/uploads
```