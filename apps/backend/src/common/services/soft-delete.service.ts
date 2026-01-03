import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Serviço genérico para operações de soft delete
 *
 * Todas as entidades com campo `deletedAt` podem usar este serviço
 * para realizar operações de deleção suave e restauração.
 */
@Injectable()
export class SoftDeleteService {
  private readonly logger = new Logger(SoftDeleteService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Realiza soft delete de um registro
   *
   * @param model Nome do modelo Prisma (ex: 'user', 'transaction')
   * @param id ID do registro
   * @returns Registro deletado
   */
  async softDelete(model: string, id: string) {
    try {
      const prismaModel = (this.prisma as any)[model];

      if (!prismaModel) {
        throw new Error(`Modelo ${model} não encontrado`);
      }

      const result = await prismaModel.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      this.logger.log(`Soft delete: ${model}:${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Erro ao fazer soft delete de ${model}:${id}`, error);
      throw error;
    }
  }

  /**
   * Restaura um registro deletado (soft deleted)
   *
   * @param model Nome do modelo Prisma
   * @param id ID do registro
   * @returns Registro restaurado
   */
  async restore(model: string, id: string) {
    try {
      const prismaModel = (this.prisma as any)[model];

      if (!prismaModel) {
        throw new Error(`Modelo ${model} não encontrado`);
      }

      const result = await prismaModel.update({
        where: { id },
        data: { deletedAt: null },
      });

      this.logger.log(`Restaurado: ${model}:${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Erro ao restaurar ${model}:${id}`, error);
      throw error;
    }
  }

  /**
   * Busca apenas registros não deletados
   *
   * @param model Nome do modelo Prisma
   * @param where Condições de busca
   * @returns Array de registros
   */
  async findMany(model: string, where: any = {}) {
    const prismaModel = (this.prisma as any)[model];

    if (!prismaModel) {
      throw new Error(`Modelo ${model} não encontrado`);
    }

    return prismaModel.findMany({
      where: {
        ...where,
        deletedAt: null,
      },
    });
  }

  /**
   * Busca um único registro não deletado
   *
   * @param model Nome do modelo Prisma
   * @param where Condições de busca
   * @returns Registro ou null
   */
  async findFirst(model: string, where: any = {}) {
    const prismaModel = (this.prisma as any)[model];

    if (!prismaModel) {
      throw new Error(`Modelo ${model} não encontrado`);
    }

    return prismaModel.findFirst({
      where: {
        ...where,
        deletedAt: null,
      },
    });
  }

  /**
   * Busca registros deletados
   *
   * @param model Nome do modelo Prisma
   * @param where Condições de busca
   * @returns Array de registros deletados
   */
  async findDeleted(model: string, where: any = {}) {
    const prismaModel = (this.prisma as any)[model];

    if (!prismaModel) {
      throw new Error(`Modelo ${model} não encontrado`);
    }

    return prismaModel.findMany({
      where: {
        ...where,
        deletedAt: { not: null },
      },
    });
  }

  /**
   * Deleta permanentemente um registro (hard delete)
   * CUIDADO: Esta operação é irreversível!
   *
   * @param model Nome do modelo Prisma
   * @param id ID do registro
   * @returns Registro deletado
   */
  async forceDelete(model: string, id: string) {
    try {
      const prismaModel = (this.prisma as any)[model];

      if (!prismaModel) {
        throw new Error(`Modelo ${model} não encontrado`);
      }

      const result = await prismaModel.delete({
        where: { id },
      });

      this.logger.warn(`HARD DELETE: ${model}:${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Erro ao fazer hard delete de ${model}:${id}`, error);
      throw error;
    }
  }

  /**
   * Limpa registros deletados há mais de X dias
   *
   * @param model Nome do modelo Prisma
   * @param days Número de dias
   * @returns Quantidade de registros removidos
   */
  async cleanupOldDeleted(model: string, days: number = 90) {
    try {
      const prismaModel = (this.prisma as any)[model];

      if (!prismaModel) {
        throw new Error(`Modelo ${model} não encontrado`);
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await prismaModel.deleteMany({
        where: {
          deletedAt: {
            lt: cutoffDate,
            not: null,
          },
        },
      });

      this.logger.log(`Cleanup: ${result.count} registros de ${model} removidos (> ${days} dias)`);
      return result;
    } catch (error) {
      this.logger.error(`Erro ao fazer cleanup de ${model}`, error);
      throw error;
    }
  }
}
