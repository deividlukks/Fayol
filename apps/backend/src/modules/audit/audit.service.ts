import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '@fayol/database-models';

export interface CreateAuditLogDto {
  userId?: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um registro de auditoria
   */
  async log(data: CreateAuditLogDto) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          changes: data.changes || null,
          metadata: data.metadata || null,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      this.logger.error('Erro ao criar log de auditoria', error);
      // Não lançar erro para não interromper o fluxo principal
      return null;
    }
  }

  /**
   * Busca logs de auditoria com filtros
   */
  async findAll(filters: {
    userId?: string;
    entity?: string;
    entityId?: string;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
    skip?: number;
    take?: number;
  }) {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.entity) where.entity = filters.entity;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.action) where.action = filters.action;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: filters.skip || 0,
        take: filters.take || 50,
      }),
    ]);

    return {
      data: logs,
      total,
      page: Math.floor((filters.skip || 0) / (filters.take || 50)) + 1,
      pageSize: filters.take || 50,
    };
  }

  /**
   * Busca logs de uma entidade específica
   */
  async findByEntity(entity: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entity, entityId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Busca logs de um usuário específico
   */
  async findByUser(userId: string, skip = 0, take = 50) {
    return this.findAll({ userId, skip, take });
  }

  /**
   * Remove logs antigos (cleanup job)
   */
  async cleanup(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    this.logger.log(`Removidos ${result.count} logs de auditoria antigos`);
    return result;
  }
}
