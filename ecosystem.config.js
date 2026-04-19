module.exports = {
  apps: [{
    name: 'ai-image-generator',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '0.0.0.0'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '0.0.0.0'
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    max_memory_restart: '500M',
    restart_delay: 3000,
    max_restarts: 10,
    min_uptime: '10s',
    watch: false,
    autorestart: true,
    kill_timeout: 5000,
    listen_timeout: 10000,
    node_args: '--max-old-space-size=512'
  }]
};
