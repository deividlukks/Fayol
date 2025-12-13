import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@fayol/database-models';

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
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.enableSoftDeleteMiddleware();
      this.logger.log('✅ Banco de dados conectado com sucesso');
    } catch (error) {
      this.logger.error('❌ Falha ao conectar no banco de dados', error);
      throw error;
    }
  }

  /**
   * Middleware que aplica soft delete automaticamente em todas as queries
   * Adiciona filtro { deletedAt: null } para não retornar registros deletados
   */
  private enableSoftDeleteMiddleware() {
    this.$use(async (params, next) => {
      // Lista de modelos que suportam soft delete
      const softDeleteModels = [
        'user',
        'account',
        'category',
        'transaction',
        'budget',
        'investment',
        'notification',
        'trade',
        'goal',
      ];

      if (softDeleteModels.includes(params.model?.toLowerCase() || '')) {
        // Para queries de leitura, filtra registros não deletados
        if (params.action === 'findUnique' || params.action === 'findFirst') {
          params.action = 'findFirst';
          params.args.where = {
            ...params.args.where,
            deletedAt: null,
          };
        }

        if (params.action === 'findMany') {
          if (params.args.where) {
            if (params.args.where.deletedAt === undefined) {
              params.args.where.deletedAt = null;
            }
          } else {
            params.args.where = { deletedAt: null };
          }
        }

        // Para update e delete, converte em soft delete
        if (params.action === 'update') {
          params.action = 'updateMany';
          params.args.where = {
            ...params.args.where,
            deletedAt: null,
          };
        }

        if (params.action === 'updateMany') {
          if (params.args.where) {
            params.args.where.deletedAt = null;
          } else {
            params.args.where = { deletedAt: null };
          }
        }

        if (params.action === 'delete') {
          params.action = 'update';
          params.args.data = { deletedAt: new Date() };
        }

        if (params.action === 'deleteMany') {
          params.action = 'updateMany';
          params.args.data = { deletedAt: new Date() };
        }
      }

      return next(params);
    });
  }

  /**
   * Método para restaurar um registro deletado (soft delete)
   */
  async restore(model: string, where: any) {
    return (this as any)[model].updateMany({
      where: {
        ...where,
        deletedAt: { not: null },
      },
      data: {
        deletedAt: null,
      },
    });
  }

  /**
   * Método para hard delete (deleção permanente)
   * Use com cautela!
   */
  async forceDelete(model: string, where: any) {
    return (this as any)[model].deleteMany({ where });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
