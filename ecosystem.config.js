module.exports = {
  apps: [{
    name: 'whatsdex-bot',
    script: './dist/index.js',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      OTEL_TRACES_EXPORTER: 'console',
      OTEL_METRICS_EXPORTER: 'prometheus'
    },
    // Performance monitoring
    max_memory_restart: '180M', // Your target
    min_uptime: '10s',
    max_restarts: 10,
    // Logging
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // Monitoring
    monitoring: true,
    pmx: true,
    // Environment variables
    env_production: {
      NODE_ENV: 'production',
      OTEL_SERVICE_NAME: 'whatsdex-bot',
      OTEL_PROMETHEUS_PORT: 9464
    }
  }, {
    name: 'whatsdex-dashboard',
    script: 'cd web && npm start',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    max_memory_restart: '150M',
    min_uptime: '10s',
    max_restarts: 5,
    error_file: './logs/dashboard-err.log',
    out_file: './logs/dashboard-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }, {
    name: 'whatsdex-worker',
    script: './src/worker.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production'
    },
    max_memory_restart: '100M',
    min_uptime: '10s',
    max_restarts: 3,
    error_file: './logs/worker-err.log',
    out_file: './logs/worker-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};