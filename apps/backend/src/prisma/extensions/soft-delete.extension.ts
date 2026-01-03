import { Prisma } from '@fayol/database-models';

/**
 * Lista de modelos que suportam soft delete
 */
const SOFT_DELETE_MODELS = [
  'user',
  'account',
  'category',
  'transaction',
  'budget',
  'investment',
  'notification',
  'trade',
  'goal',
] as const;

type SoftDeleteModel = (typeof SOFT_DELETE_MODELS)[number];

/**
 * Verifica se um modelo suporta soft delete
 */
function isSoftDeleteModel(modelName?: string): modelName is SoftDeleteModel {
  return SOFT_DELETE_MODELS.includes(modelName as any);
}

/**
 * Prisma Client Extension para implementar Soft Delete
 *
 * Esta extensão adiciona automaticamente:
 * - Filtro { deletedAt: null } em queries de leitura (findMany, findFirst, findUnique)
 * - Conversão de delete para update com { deletedAt: new Date() }
 * - Métodos auxiliares: restore() e forceDelete()
 *
 * @see https://www.prisma.io/docs/orm/prisma-client/client-extensions
 */
export const softDeleteExtension = Prisma.defineExtension({
  name: 'softDelete',
  query: {
    $allModels: {
      async findUnique({ args, query, model }) {
        if (!isSoftDeleteModel(model)) {
          return query(args);
        }

        // Adiciona filtro deletedAt: null
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },

      async findFirst({ args, query, model }) {
        if (!isSoftDeleteModel(model)) {
          return query(args);
        }

        // Adiciona filtro deletedAt: null
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },

      async findMany({ args, query, model }) {
        if (!isSoftDeleteModel(model)) {
          return query(args);
        }

        // Adiciona filtro deletedAt: null se não foi especificado
        if (args.where) {
          if ((args.where as any).deletedAt === undefined) {
            (args.where as any).deletedAt = null;
          }
        } else {
          args.where = { deletedAt: null } as any;
        }

        return query(args);
      },

      async update({ args, query, model }) {
        if (!isSoftDeleteModel(model)) {
          return query(args);
        }

        // Adiciona filtro deletedAt: null para não atualizar registros deletados
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },

      async updateMany({ args, query, model }) {
        if (!isSoftDeleteModel(model)) {
          return query(args);
        }

        // Adiciona filtro deletedAt: null
        if (args.where) {
          (args.where as any).deletedAt = null;
        } else {
          args.where = { deletedAt: null } as any;
        }

        return query(args);
      },

      async delete({ args, model }) {
        if (!isSoftDeleteModel(model)) {
          // Para modelos que não suportam soft delete, executa delete normal
          return (this as any)[model].delete(args);
        }

        // Converte delete em update com deletedAt
        return (this as any)[model].update({
          ...args,
          data: { deletedAt: new Date() },
        });
      },

      async deleteMany({ args, model }) {
        if (!isSoftDeleteModel(model)) {
          // Para modelos que não suportam soft delete, executa delete normal
          return (this as any)[model].deleteMany(args);
        }

        // Converte deleteMany em updateMany com deletedAt
        return (this as any)[model].updateMany({
          ...args,
          data: { deletedAt: new Date() },
        });
      },
    },
  },

  model: {
    $allModels: {
      /**
       * Restaura um registro deletado (soft delete)
       *
       * @example
       * await prisma.user.restore({ where: { id: 1 } })
       */
      async restore<T>(this: T, args: { where: any }): Promise<{ count: number }> {
        const context = Prisma.getExtensionContext(this);

        return (this as any).updateMany({
          where: {
            ...args.where,
            deletedAt: { not: null },
          },
          data: {
            deletedAt: null,
          },
        });
      },

      /**
       * Deleta permanentemente um registro (hard delete)
       * ⚠️ Use com cautela! Esta ação é irreversível.
       *
       * @example
       * await prisma.user.forceDelete({ where: { id: 1 } })
       */
      async forceDelete<T>(this: T, args: { where: any }): Promise<{ count: number }> {
        const context = Prisma.getExtensionContext(this);

        return (this as any).deleteMany(args);
      },

      /**
       * Busca todos os registros, incluindo os deletados (soft delete)
       *
       * @example
       * await prisma.user.findManyWithDeleted({ where: { email: 'test@example.com' } })
       */
      async findManyWithDeleted<T>(this: T, args?: any): Promise<any[]> {
        const context = Prisma.getExtensionContext(this);

        // Remove o filtro de soft delete temporariamente
        const originalWhere = args?.where || {};
        const { deletedAt, ...restWhere } = originalWhere;

        return (this as any).findMany({
          ...args,
          where: restWhere,
        });
      },

      /**
       * Busca apenas registros deletados (soft delete)
       *
       * @example
       * await prisma.user.findManyDeleted()
       */
      async findManyDeleted<T>(this: T, args?: any): Promise<any[]> {
        const context = Prisma.getExtensionContext(this);

        return (this as any).findMany({
          ...args,
          where: {
            ...args?.where,
            deletedAt: { not: null },
          },
        });
      },
    },
  },
});

/**
 * Tipo do Prisma Client estendido com soft delete
 */
export type ExtendedPrismaClient = ReturnType<typeof createExtendedPrismaClient>;

/**
 * Cria uma instância do Prisma Client com a extensão de soft delete
 */
export function createExtendedPrismaClient(prismaClient: any) {
  return prismaClient.$extends(softDeleteExtension);
}
