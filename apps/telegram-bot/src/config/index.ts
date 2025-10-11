import dotenv from 'dotenv';

dotenv.config();

export const config = {
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN || '',
  },
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api/v1',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    ttl: parseInt(process.env.REDIS_SESSION_TTL || '86400', 10), // 24 hours
  },
};

if (!config.telegram.token) {
  throw new Error('TELEGRAM_BOT_TOKEN is required in .env file');
}
