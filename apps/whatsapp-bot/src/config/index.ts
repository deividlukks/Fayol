import dotenv from 'dotenv';

dotenv.config();

export const config = {
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api/v1',
  },
  bot: {
    name: process.env.BOT_NAME || 'Fayol',
    sessionDir: process.env.SESSION_DIR || './sessions',
  },
};
