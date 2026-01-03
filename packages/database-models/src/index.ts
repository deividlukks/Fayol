import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Exporta tudo do cliente gerado (Tipos: User, Account, etc.)
export * from '@prisma/client';

// Exporta uma instância global (opcional, útil para scripts isolados)
const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
  pool: Pool;
};

// Cria pool de conexão PostgreSQL com configurações do Prisma 7
// No Prisma 7, o pooling é gerenciado pelo driver pg, não pelo Prisma
const pool =
  globalForPrisma.pool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // Número máximo de conexões no pool (padrão: 10)
    max: parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
    // Tempo antes de fechar conexão inativa em ms (padrão Prisma 7: 10000ms)
    idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '10000', 10),
    // Timeout para estabelecer conexão em ms (padrão Prisma 7: 0 = sem timeout)
    connectionTimeoutMillis: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '0', 10),
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.pool = pool;

// Cria adapter para PostgreSQL
const adapter = new PrismaPg(pool);

// Cria instância do PrismaClient com adapter
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
