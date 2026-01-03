import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DataExportRequest,
  DataExportStatus,
  CreateDataExportDto,
  UserDataExport,
} from '@fayol/shared-types';
import { ComplianceNotificationsService } from '../common/services/compliance-notifications.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class DataExportService {
  private readonly logger = new Logger(DataExportService.name);
  private readonly exportsDir = path.join(process.cwd(), 'exports');

  constructor(
    private prisma: PrismaService,
    private notificationsService: ComplianceNotificationsService
  ) {
    this.ensureExportsDir();
  }

  /**
   * Garante que o diretório de exports existe
   */
  private async ensureExportsDir() {
    try {
      await fs.access(this.exportsDir);
    } catch {
      await fs.mkdir(this.exportsDir, { recursive: true });
    }
  }

  /**
   * Cria uma requisição de exportação de dados
   */
  async createExportRequest(
    userId: string,
    dto: CreateDataExportDto,
    ipAddress?: string
  ): Promise<DataExportRequest> {
    const exportRequest = await this.prisma.dataExportRequest.create({
      data: {
        userId,
        format: (dto.format || 'JSON') as any,
        status: DataExportStatus.PENDING as any,
        ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      },
    });

    // Processa a exportação em background (em produção, usar queue)
    this.processExport(exportRequest.id).catch((error) => {
      this.logger.error(
        `Erro ao processar exportação ${exportRequest.id}`,
        error instanceof Error ? error.stack : error
      );
    });

    return exportRequest as unknown as DataExportRequest;
  }

  /**
   * Processa a exportação de dados
   */
  private async processExport(requestId: string): Promise<void> {
    try {
      // Atualiza status para PROCESSING
      await this.prisma.dataExportRequest.update({
        where: { id: requestId },
        data: { status: DataExportStatus.PROCESSING as any },
      });

      const request = await this.prisma.dataExportRequest.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        throw new NotFoundException('Export request not found');
      }

      // Coleta todos os dados do usuário
      const userData = await this.collectUserData(request.userId);

      // SEGURANÇA: Gera nome de arquivo seguro usando UUID para evitar path traversal
      const fileExtension = this.sanitizeFileExtension(request.format);
      const safeFileName = `export-${crypto.randomUUID()}.${fileExtension}`;
      const filePath = path.join(this.exportsDir, safeFileName);

      if (request.format === 'JSON') {
        await fs.writeFile(filePath, JSON.stringify(userData, null, 2));
      } else if (request.format === 'CSV') {
        // Implementação básica de CSV (pode ser melhorado)
        const csv = this.convertToCSV(userData);
        await fs.writeFile(filePath, csv);
      }

      // Atualiza a requisição com o caminho do arquivo
      const updatedRequest = await this.prisma.dataExportRequest.update({
        where: { id: requestId },
        data: {
          status: DataExportStatus.COMPLETED,
          downloadUrl: `/exports/${safeFileName}`,
          completedAt: new Date(),
        },
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      // Notifica o usuário que o export está pronto
      const downloadUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}${updatedRequest.downloadUrl}`;
      await this.notificationsService.notifyDataExportReady(
        request.userId,
        updatedRequest.user.email,
        downloadUrl
      );
    } catch (error: any) {
      // Marca como falha
      await this.prisma.dataExportRequest.update({
        where: { id: requestId },
        data: {
          status: DataExportStatus.FAILED,
          failedReason: error.message || 'Unknown error',
        },
      });
    }
  }

  /**
   * Coleta todos os dados do usuário (LGPD data portability)
   */
  private async collectUserData(userId: string): Promise<UserDataExport> {
    const [user, accounts, transactions, budgets, investments, categories, goals, consents] =
      await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            gender: true,
            cpf: true,
            phoneNumber: true,
            investorProfile: true,
            mainCurrency: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        this.prisma.account.findMany({
          where: { userId },
        }),
        this.prisma.transaction.findMany({
          where: { userId },
          include: {
            category: true,
          },
        }),
        this.prisma.budget.findMany({
          where: { userId },
        }),
        this.prisma.investment.findMany({
          where: { userId },
        }),
        this.prisma.category.findMany({
          where: { userId },
        }),
        this.prisma.goal.findMany({
          where: { userId },
        }),
        this.prisma.userConsent.findMany({
          where: { userId },
        }),
      ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Adaptação dos tipos do Prisma para os tipos compartilhados
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      accounts: accounts.map((acc) => ({
        id: acc.id,
        name: acc.name,
        type: acc.type,
        balance: acc.balance,
        currency: acc.currency,
      })),
      transactions: transactions.map((tx) => ({
        id: tx.id,
        description: tx.description,
        amount: tx.amount,
        type: tx.type,
        date: tx.date,
        category: tx.category ? { id: tx.category.id, name: tx.category.name } : null,
      })),
      budgets: budgets.map((budget) => ({
        id: budget.id,
        name: budget.name,
        amount: budget.amount,
        startDate: budget.startDate,
        endDate: budget.endDate,
      })),
      investments: investments.map((inv) => ({
        id: inv.id,
        name: inv.name,
        type: inv.type,
        quantity: inv.quantity,
        averagePrice: inv.averagePrice,
        currentPrice: inv.currentPrice,
      })),
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        type: cat.type,
      })),
      goals: goals.map((goal) => ({
        id: goal.id,
        title: goal.title,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        deadline: goal.deadline,
      })),
      consents: consents.map((consent) => ({
        id: consent.id,
        type: consent.type,
        status: consent.status,
        grantedAt: consent.grantedAt,
      })),
      exportedAt: new Date(),
    };
  }

  /**
   * SEGURANÇA: Sanitiza extensão de arquivo para prevenir path traversal
   */
  private sanitizeFileExtension(format: string): string {
    // Remove qualquer caractere perigoso e normaliza
    const normalized = format.toLowerCase().trim();

    // Whitelist de extensões permitidas
    const allowedExtensions = ['json', 'csv'];

    if (!allowedExtensions.includes(normalized)) {
      throw new Error(`Invalid file format: ${format}. Allowed: ${allowedExtensions.join(', ')}`);
    }

    return normalized;
  }

  /**
   * Converte dados para CSV (simplificado)
   */
  private convertToCSV(data: UserDataExport): string {
    const lines: string[] = [];

    // Header do usuário
    lines.push('=== USER DATA ===');
    lines.push(`ID,Name,Email,Created At`);
    lines.push(`${data.user.id},${data.user.name},${data.user.email},${data.user.createdAt}`);
    lines.push('');

    // Contas
    lines.push('=== ACCOUNTS ===');
    if (data.accounts.length > 0) {
      const accountKeys = Object.keys(data.accounts[0]);
      lines.push(accountKeys.join(','));
      data.accounts.forEach((acc) => {
        lines.push(accountKeys.map((k) => acc[k]).join(','));
      });
    }
    lines.push('');

    // Transações
    lines.push('=== TRANSACTIONS ===');
    if (data.transactions.length > 0) {
      const txKeys = Object.keys(data.transactions[0]);
      lines.push(txKeys.join(','));
      data.transactions.forEach((tx) => {
        lines.push(txKeys.map((k) => JSON.stringify(tx[k])).join(','));
      });
    }

    return lines.join('\n');
  }

  /**
   * Lista as requisições de exportação de um usuário
   */
  async getUserExportRequests(userId: string): Promise<DataExportRequest[]> {
    const requests = await this.prisma.dataExportRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return requests as unknown as DataExportRequest[];
  }

  /**
   * Busca uma requisição específica
   */
  async getExportRequest(userId: string, requestId: string): Promise<DataExportRequest> {
    const request = await this.prisma.dataExportRequest.findFirst({
      where: { id: requestId, userId },
    });

    if (!request) {
      throw new NotFoundException('Export request not found');
    }

    return request as unknown as DataExportRequest;
  }

  /**
   * Remove arquivos de exportação expirados (cron job)
   */
  async cleanupExpiredExports(): Promise<number> {
    const expiredRequests = await this.prisma.dataExportRequest.findMany({
      where: {
        expiresAt: { lt: new Date() },
        status: DataExportStatus.COMPLETED as any,
      },
    });

    let deletedCount = 0;

    for (const request of expiredRequests) {
      if (request.downloadUrl) {
        const fileName = request.downloadUrl.replace('/exports/', '');
        const filePath = path.join(this.exportsDir, fileName);

        try {
          await fs.unlink(filePath);
          deletedCount++;
        } catch (error) {
          // SEGURANÇA: Não loga path completo que pode conter informações sensíveis
          this.logger.error(
            'Falha ao deletar arquivo de exportação',
            error instanceof Error ? error.stack : error
          );
        }
      }

      // Remove o registro do banco
      await this.prisma.dataExportRequest.delete({
        where: { id: request.id },
      });
    }

    return deletedCount;
  }
}
