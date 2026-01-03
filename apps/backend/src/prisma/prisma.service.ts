import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@fayol/database-models';
import { softDeleteExtension } from './extensions/soft-delete.extension';

/**
 * PrismaService com suporte a Soft Delete
 *
 * Utiliza Prisma Client Extensions para implementar soft delete automaticamente.
 * Modelos com campo `deletedAt` terão:
 * - Filtro automático em queries de leitura (deletedAt: null)
 * - Conversão de delete para update (set deletedAt = now())
 * - Métodos auxiliares: restore(), forceDelete(), findManyWithDeleted(), findManyDeleted()
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('❌ FATAL: DATABASE_URL não definida! Verifique seu arquivo .env');
    }

    // Prisma 7 usa conexão direta sem adapter por padrão
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Aplica a extensão de soft delete
    return this.$extends(softDeleteExtension) as any;
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Banco de dados conectado com sucesso');
      this.logger.log('✅ Soft delete extension habilitada');
    } catch (error) {
      this.logger.error('❌ Falha ao conectar no banco de dados', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
