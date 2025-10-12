module.exports = {
  apps: [
    {
      name: 'fayol-backend',
      script: './dist/main.js',
      cwd: '/home/usuario/fayol/apps/backend', // Altere para seu caminho
      instances: 2, // ou 'max' para usar todos os cores disponíveis
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      kill_timeout: 3000,
      listen_timeout: 3000,
      // Variáveis de ambiente específicas (carrega do .env também)
      env_file: '.env',
    },
  ],
};
