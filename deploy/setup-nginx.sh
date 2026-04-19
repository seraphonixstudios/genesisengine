#!/bin/bash

# Nginx Configuration Script
# Sets up Nginx as reverse proxy for Node.js application

set -e

DOMAIN="${1:-your-domain.com}"
VPS_IP="${2:-your-vps-ip}"

echo "Setting up Nginx for domain: $DOMAIN"

# Create Nginx configuration
cat > /etc/nginx/sites-available/ai-image-generator << EOF
# Upstream services
upstream api_backend {
    server 127.0.0.1:5001 max_fails=3 fail_timeout=30s;
    keepalive 64;
}

upstream frontend_backend {
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    keepalive 64;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL certificates (update paths after certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Compression
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/rss+xml application/javascript application/json;
    gzip_min_length 1000;
    gzip_disable "MSIE [1-6]\.";
    gzip_vary on;

    # Logging
    access_log /var/log/nginx/ai-image-generator-access.log;
    error_log /var/log/nginx/ai-image-generator-error.log;

    # Upload size limit
    client_max_body_size 50M;

    # API proxy
    location /api/ {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$server_name;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # Frontend proxy
    location / {
        proxy_pass http://frontend_backend;
        proxy_http_version 1.1;
        
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://frontend_backend;
        
        expires 30d;
        add_header Cache-Control "public, immutable";
        add_header Pragma public;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/ai-image-generator /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test Nginx config
nginx -t

# Restart Nginx
systemctl restart nginx

echo ""
echo "✓ Nginx configured"
echo ""
echo "Next: Setup SSL certificate with:"
echo "  sudo certbot certonly --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
