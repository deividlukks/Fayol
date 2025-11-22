import { PrismaClient } from '@prisma/client';

// Exporta tudo do cliente gerado (Tipos: User, Account, etc.)
export * from '@prisma/client';

// Exporta uma instância global (opcional, útil para scripts isolados)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;