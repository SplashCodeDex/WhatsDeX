module.exports = {
  apps: [{
    name: 'whatsdex-admin',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      ADMIN_PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      ADMIN_PORT: 3001,
      HOST: '127.0.0.1'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

    // Environment file
    env_file: './.env.production',

    // Restart delay
    restart_delay: 4000,

    // Max restarts
    max_restarts: 5,
    min_uptime: '10s',

    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,

    // Working directory
    cwd: process.cwd(),

    // Node arguments for production
    node_args: '--max-old-space-size=2048',

    // User (optional - set to your deployment user)
    // user: 'whatsdex',
    // group: 'whatsdex'
  }],

  deploy: {
    production: {
      user: 'node',
      host: 'your-server-ip',
      ref: 'origin/master',
      repo: 'git@github.com:yourusername/whatsdex.git',
      path: '/var/www/whatsdex-admin',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};