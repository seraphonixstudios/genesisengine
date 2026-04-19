# AI Image Generator - VPS Deployment Configuration
# For Hostinger VPS or any Ubuntu/Debian VPS

## Prerequisites

- VPS with Ubuntu 20.04+ or Debian 10+
- Root or sudo access
- Domain name (optional)

## Quick Setup Script

Save this as `setup.sh` on your VPS and run it:

```bash
#!/bin/bash

# AI Image Generator VPS Setup Script

set -e

echo "🚀 Setting up AI Image Generator on VPS..."

# Update system
echo "📦 Updating system..."
apt-get update
apt-get upgrade -y

# Install Node.js
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2
echo "📦 Installing PM2..."
npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
apt-get install -y nginx

# Create app directory
echo "📁 Creating app directory..."
mkdir -p /var/www/ai-image-generator
mkdir -p /var/www/ai-image-generator/uploads

# Set permissions
chown -R www-data:www-data /var/www/ai-image-generator
chmod -R 755 /var/www/ai-image-generator

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Upload your application files to /var/www/ai-image-generator"
echo "2. Create .env file with HUGGINGFACE_API_KEY"
echo "3. Run: cd /var/www/ai-image-generator && npm install"
echo "4. Run: pm2 start server.js --name ai-generator"
echo "5. Configure Nginx (see nginx.conf example)"
```

## Environment Variables (.env)

Create a `.env` file in `/var/www/ai-image-generator/`:

```env
# Required
HUGGINGFACE_API_KEY=hf_your_token_here

# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# Frontend URL (for CORS)
FRONTEND_URL=http://your-domain.com

# Optional
LOG_LEVEL=info
```

## Nginx Configuration

Create `/etc/nginx/sites-available/ai-generator`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/ai-image-generator/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api {
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

    # Uploads
    location /uploads {
        alias /var/www/ai-image-generator/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/ai-generator /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## SSL with Certbot

```bash
apt-get install certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

## PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'ai-generator',
    script: './server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd
```

## Firewall

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw enable
```

## Troubleshooting

### Check logs
```bash
pm2 logs ai-generator
tail -f /var/log/nginx/error.log
```

### Restart services
```bash
pm2 restart ai-generator
systemctl restart nginx
```

### Check if running
```bash
pm2 status
netstat -tlnp | grep 3000
```