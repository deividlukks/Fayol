import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConsentService } from '../../../consent/consent.service';
import { ComplianceNotificationsService } from '../../../common/services/compliance-notifications.service';
import { ConsentType } from '@fayol/shared-types';

export interface DeletionResult {
  userId: string;
  deletedAt: Date;
  itemsDeleted: {
    accounts: number;
    transactions: number;
    budgets: number;
    investments: number;
    categories: number;
    goals: number;
    notifications: number;
    trades: number;
    consents: number;
    dataExports: number;
    auditLogs: number;
  };
}

@Injectable()
export class UserDeletionService {
  private readonly logger = new Logger(UserDeletionService.name);

  constructor(
    private prisma: PrismaService,
    private consentService: ConsentService,
    private notificationsService: ComplianceNotificationsService
  ) {}

  /**
   * Deleta completamente todos os dados de um usuário (LGPD right to erasure)
   *
   * IMPORTANTE: Esta é uma operação irreversível!
   */
  async deleteUserData(userId: string, confirmEmail: string): Promise<DeletionResult> {
    // Busca o usuário
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Validação de segurança: email deve corresponder
    if (user.email !== confirmEmail) {
      throw new BadRequestException('Email confirmation does not match');
    }

    // Registra a retirada de todos os consentimentos (fora da transação)
    const consentTypes = [
      ConsentType.TERMS_OF_SERVICE,
      ConsentType.PRIVACY_POLICY,
      ConsentType.MARKETING,
      ConsentType.ANALYTICS,
      ConsentType.COOKIES,
      ConsentType.DATA_SHARING,
      ConsentType.PROFILING,
    ];

    for (const type of consentTypes) {
      try {
        await this.consentService.withdrawConsent(userId, type);
      } catch {
        // Ignora se não existe
      }
    }

    // Executa toda a deleção dentro de uma transação para garantir atomicidade
    const deletionResult = await this.prisma.$transaction(async (tx) => {
      const result: DeletionResult = {
        userId,
        deletedAt: new Date(),
        itemsDeleted: {
          accounts: 0,
          transactions: 0,
          budgets: 0,
          investments: 0,
          categories: 0,
          goals: 0,
          notifications: 0,
          trades: 0,
          consents: 0,
          dataExports: 0,
          auditLogs: 0,
        },
      };

      // 1. Deleta trades (depende de transactions, investments, accounts)
      const deletedTrades = await tx.trade.deleteMany({
        where: { userId },
      });
      result.itemsDeleted.trades = deletedTrades.count;

      // 2. Deleta transactions (depende de accounts, categories)
      const deletedTransactions = await tx.transaction.deleteMany({
        where: { userId },
      });
      result.itemsDeleted.transactions = deletedTransactions.count;

      // 3. Deleta investments (depende de accounts)
      const deletedInvestments = await tx.investment.deleteMany({
        where: { userId },
      });
      result.itemsDeleted.investments = deletedInvestments.count;

      // 4. Deleta budgets (depende de categories)
      const deletedBudgets = await tx.budget.deleteMany({
        where: { userId },
      });
      result.itemsDeleted.budgets = deletedBudgets.count;

      // 5. Deleta goals
      const deletedGoals = await tx.goal.deleteMany({
        where: { userId },
      });
      result.itemsDeleted.goals = deletedGoals.count;

      // 6. Deleta notifications
      const deletedNotifications = await tx.notification.deleteMany({
        where: { userId },
      });
      result.itemsDeleted.notifications = deletedNotifications.count;

      // 7. Deleta accounts
      const deletedAccounts = await tx.account.deleteMany({
        where: { userId },
      });
      result.itemsDeleted.accounts = deletedAccounts.count;

      // 8. Deleta categories customizadas do usuário
      const deletedCategories = await tx.category.deleteMany({
        where: { userId },
      });
      result.itemsDeleted.categories = deletedCategories.count;

      // 9. Deleta consents
      const deletedConsents = await tx.userConsent.deleteMany({
        where: { userId },
      });
      result.itemsDeleted.consents = deletedConsents.count;

      // 10. Deleta data export requests
      const deletedExports = await tx.dataExportRequest.deleteMany({
        where: { userId },
      });
      result.itemsDeleted.dataExports = deletedExports.count;

      // 11. Anonimiza audit logs (não deleta para manter compliance, mas remove PII)
      const updatedAuditLogs = await tx.auditLog.updateMany({
        where: { userId },
        data: {
          userId: null,
          metadata: { anonymized: true, originalUserId: userId },
          ipAddress: null,
          userAgent: null,
        },
      });
      result.itemsDeleted.auditLogs = updatedAuditLogs.count;

      // 12. Finalmente, deleta o usuário
      await tx.user.delete({
        where: { id: userId },
      });

      return result;
    });

    // 13. Notifica que a conta foi deletada (fora da transação)
    await this.notificationsService.notifyAccountDeleted(user.email);

    return deletionResult;
  }

  /**
   * Soft delete (marca como inativo sem deletar dados)
   * Alternativa menos drástica que pode ser usada primeiro
   */
  async softDeleteUser(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        deletedAt: new Date(),
        // Limpa dados sensíveis mas mantém o registro
        email: `deleted_${userId}@deleted.com`,
        name: 'Deleted User',
        passwordHash: 'DELETED',
        profileImage: null,
        cpf: null,
        phoneNumber: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });
  }

  /**
   * Verifica se pode deletar o usuário (regras de negócio)
   */
  async canDeleteUser(userId: string): Promise<{
    canDelete: boolean;
    reasons: string[];
  }> {
    const reasons: string[] = [];

    // Exemplo de regras de negócio:
    // - Não pode deletar se tem transações pendentes
    // - Não pode deletar se tem investimentos ativos
    // etc.

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        transactions: {
          where: { isPaid: false },
        },
      },
    });

    if (!user) {
      reasons.push('User not found');
      return { canDelete: false, reasons };
    }

    if (user.transactions.length > 0) {
      reasons.push(
        `Has ${user.transactions.length} pending transactions. Please complete or cancel them first.`
      );
    }

    // Adicione mais validações conforme necessário

    return {
      canDelete: reasons.length === 0,
      reasons,
    };
  }

  /**
   * Agenda deleção do usuário (para dar tempo de arrependimento - LGPD best practice)
   */
  async scheduleDeletion(userId: string, daysToWait: number = 30): Promise<Date> {
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + daysToWait);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: deletionDate,
        isActive: false,
      },
    });

    // Notifica o usuário sobre a deletion agendada
    await this.notificationsService.notifyAccountDeletionScheduled(
      userId,
      user.email,
      deletionDate
    );

    return deletionDate;
  }

  /**
   * Cancela deleção agendada
   */
  async cancelScheduledDeletion(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: null,
        isActive: true,
      },
    });
  }

  /**
   * Processa deletions agendadas (cron job)
   * Deleta permanentemente usuários cuja data de deletion já passou
   */
  async processScheduledDeletions(): Promise<number> {
    // Busca usuários com deletedAt no passado
    const usersToDelete = await this.prisma.user.findMany({
      where: {
        deletedAt: {
          lte: new Date(),
        },
        isActive: false,
      },
      select: {
        id: true,
        email: true,
      },
    });

    let deletedCount = 0;

    for (const user of usersToDelete) {
      try {
        await this.deleteUserData(user.id, user.email);
        deletedCount++;
      } catch (error) {
        // SEGURANÇA: Não loga userId ou email para evitar exposição de dados pessoais em logs
        this.logger.error(
          'Erro ao deletar dados de usuário durante limpeza automática',
          error instanceof Error ? error.stack : error
        );
        // Continua com o próximo usuário mesmo se um falhar
      }
    }

    return deletedCount;
  }

  /**
   * Envia lembretes para usuários com deletion agendada em breve (cron job)
   * Envia email 7 dias antes da deletion
   */
  async sendDeletionReminders(): Promise<number> {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Busca usuários com deletion agendada para daqui a 7 dias
    const usersToRemind = await this.prisma.user.findMany({
      where: {
        deletedAt: {
          gte: now,
          lte: sevenDaysFromNow,
        },
        isActive: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        deletedAt: true,
      },
    });

    let remindersSent = 0;

    for (const user of usersToRemind) {
      try {
        await this.notificationsService.notifyAccountDeletionImminent(
          user.id,
          user.email,
          user.deletedAt!
        );
        remindersSent++;
      } catch (error) {
        // SEGURANÇA: Não loga userId ou email para evitar exposição de dados pessoais em logs
        this.logger.error(
          'Erro ao enviar lembrete de deleção de conta',
          error instanceof Error ? error.stack : error
        );
      }
    }

    return remindersSent;
  }
}
