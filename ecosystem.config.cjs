// PM2 Ecosystem file for production deployment (CommonJS format)
module.exports = {
  apps: [
    {
      name: "zalo-bot-oa",
      script: "./src/index.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3001, // Changed to 3001 to avoid conflict with other services
      },
      // Logging
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
      // Auto restart
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      // Advanced features
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 4000,
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};

