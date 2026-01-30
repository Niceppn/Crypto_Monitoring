export default {
  apps: [{
    name: 'crypto-monitoring-api',
    script: 'server.js',
    cwd: './server',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    // Auto restart on crash
    min_uptime: '10s',
    max_restarts: 10
  }]
}

