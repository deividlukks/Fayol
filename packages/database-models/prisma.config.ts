import { defineConfig, env } from 'prisma/config';
import { config } from 'dotenv';
import { resolve } from 'path';

// Carrega .env da raiz do monorepo
config({ path: resolve(__dirname, '../../.env') });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
