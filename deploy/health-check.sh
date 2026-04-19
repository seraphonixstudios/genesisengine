#!/bin/bash

# Quick Health Check Script
# Monitors application health on Hostinger VPS

echo "=========================================="
echo "AI Image Generator - Health Check"
echo "=========================================="
echo ""

# Check PM2 status
echo "📦 Process Manager (PM2):"
pm2 status
echo ""

# Check API health
echo "🔍 API Health:"
curl -s http://localhost:5001/api/health | jq . 2>/dev/null || echo "API unreachable"
echo ""

# Check Nginx status
echo "🌐 Nginx Status:"
systemctl is-active --quiet nginx && echo "✓ Nginx is running" || echo "✗ Nginx is stopped"
nginx -t 2>/dev/null | head -1
echo ""

# Check system resources
echo "💾 System Resources:"
echo "Memory: $(free -h | awk 'NR==2 {print "Used: " $3 " / Total: " $2}')"
echo "Disk: $(df -h / | awk 'NR==2 {print "Used: " $3 " / Total: " $2}')"
echo ""

# Check SSL certificate
echo "🔒 SSL Certificate:"
if [ -f "/etc/letsencrypt/live/your-domain.com/fullchain.pem" ]; then
    expiry=$(openssl x509 -in /etc/letsencrypt/live/your-domain.com/fullchain.pem -noout -dates | grep notAfter)
    echo "$expiry"
else
    echo "No SSL certificate found"
fi
echo ""

# Check ports
echo "🔌 Open Ports:"
netstat -tulpn 2>/dev/null | grep LISTEN | awk '{print $4, $7}' | column -t
echo ""

# Check logs for errors
echo "⚠️  Recent Errors (last 10):"
pm2 logs --lines 10 2>/dev/null | grep -i error | tail -10 || echo "No errors"
echo ""

echo "=========================================="
echo "Health check complete"
echo "=========================================="
