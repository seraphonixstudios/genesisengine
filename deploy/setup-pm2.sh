#!/bin/bash

# PM2 Configuration and Startup Script
# Manages Node.js application with PM2 process manager

set -e

echo "Setting up PM2 Process Manager..."

# Create ecosystem file
cat > /var/www/ai-image-generator/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: "ai-image-generator-api",
      script: "./server.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 5001,
        DATABASE_URL: "file:./data/ai-generator.db"
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      restart_delay: 4000,
      max_memory_restart: "500M",
      max_restarts: 10,
      min_uptime: "10s"
    },
    {
      name: "ai-image-generator-frontend",
      script: "npm",
      args: "run preview",
      cwd: "./client",
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      error_file: "./logs/frontend-err.log",
      out_file: "./logs/frontend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z"
    }
  ],

  deploy: {
    production: {
      user: "root",
      host: "your-vps-ip",
      ref: "origin/main",
      repo: "https://github.com/yourusername/ai-image-generator.git",
      path: "/var/www/ai-image-generator",
      "post-deploy": "npm install && npm run build && pm2 startOrRestart ecosystem.config.js --env production"
    }
  }
};
EOF

# Create logs directory
mkdir -p /var/www/ai-image-generator/logs
mkdir -p /var/www/ai-image-generator/data

# Install PM2 globally
npm install -g pm2

# Start PM2 with ecosystem config
cd /var/www/ai-image-generator
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Enable PM2 startup script
pm2 startup systemd -u root --hp /root

echo ""
echo "✓ PM2 configured and running"
echo ""
echo "Useful commands:"
echo "  pm2 status              - Show all processes"
echo "  pm2 logs                - View logs"
echo "  pm2 stop all            - Stop all processes"
echo "  pm2 restart all         - Restart all processes"
echo "  pm2 delete all          - Delete all processes"
echo ""
