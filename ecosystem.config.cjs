module.exports = {
  apps: [
    {
      name: 'openclaw-hub',
      script: 'server/index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        PORT: 3100,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3100,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
    },
  ],
};
