import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly telegramBotToken: string;
  private readonly telegramApiUrl: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.telegramBotToken = this.configService.get('TELEGRAM_BOT_TOKEN') || '';
    this.telegramApiUrl = `https://api.telegram.org/bot${this.telegramBotToken}`;
  }

  /**
   * Cron que roda diariamente às 20:00 para verificar usuários
   * que não registraram transações no dia
   */
  @Cron('0 20 * * *', {
    name: 'daily-transaction-reminder',
    timeZone: 'America/Sao_Paulo',
  })
  async sendDailyTransactionReminder() {
    this.logger.log('🔔 Iniciando envio de lembretes diários...');

    try {
      // Buscar todos os usuários ativos
      const users = await this.prisma.user.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          phone: true, // Telegram ID pode estar no phone
        },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let sentCount = 0;
      let skippedCount = 0;

      for (const user of users) {
        // Verificar se o usuário registrou transações hoje
        const todayTransactions = await this.prisma.transaction.count({
          where: {
            userId: user.id,
            createdAt: {
              gte: today,
            },
          },
        });

        if (todayTransactions === 0) {
          // Usuário não registrou transações hoje
          // Verificar se não enviamos lembrete recentemente (últimas 24h)
          const recentNotification = await this.prisma.notification.findFirst({
            where: {
              userId: user.id,
              type: 'reminder',
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
              },
            },
          });

          if (!recentNotification) {
            await this.sendTelegramReminder(user);

            // Registrar notificação
            await this.prisma.notification.create({
              data: {
                userId: user.id,
                type: 'reminder',
                title: 'Lembrete de Registro',
                message: 'Você ainda não registrou transações hoje',
              },
            });

            sentCount++;
          } else {
            skippedCount++;
          }
        }
      }

      this.logger.log(
        `✅ Lembretes enviados: ${sentCount} | Ignorados: ${skippedCount}`
      );
    } catch (error) {
      this.logger.error('Erro ao enviar lembretes diários', error);
    }
  }

  /**
   * Cron que roda toda segunda-feira às 09:00 para enviar
   * resumo semanal
   */
  @Cron('0 9 * * 1', {
    name: 'weekly-summary',
    timeZone: 'America/Sao_Paulo',
  })
  async sendWeeklySummary() {
    this.logger.log('📊 Iniciando envio de resumos semanais...');

    try {
      const users = await this.prisma.user.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          phone: true,
        },
      });

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      let sentCount = 0;

      for (const user of users) {
        const transactions = await this.prisma.transaction.findMany({
          where: {
            userId: user.id,
            createdAt: {
              gte: oneWeekAgo,
            },
          },
        });

        if (transactions.length > 0) {
          const totalIncome = transactions
            .filter(t => t.movementType === 'income')
            .reduce((sum, t) => sum + t.amount.toNumber(), 0);

          const totalExpenses = transactions
            .filter(t => t.movementType === 'expense')
            .reduce((sum, t) => sum + t.amount.toNumber(), 0);

          const balance = totalIncome - totalExpenses;

          await this.sendTelegramWeeklySummary(user, {
            totalIncome,
            totalExpenses,
            balance,
            transactionCount: transactions.length,
          });

          // Registrar notificação
          await this.prisma.notification.create({
            data: {
              userId: user.id,
              type: 'recommendation',
              title: 'Resumo Semanal',
              message: `Você registrou ${transactions.length} transações esta semana`,
              data: {
                totalIncome,
                totalExpenses,
                balance,
              },
            },
          });

          sentCount++;
        }
      }

      this.logger.log(`✅ Resumos semanais enviados: ${sentCount}`);
    } catch (error) {
      this.logger.error('Erro ao enviar resumos semanais', error);
    }
  }

  /**
   * Cron que roda no primeiro dia do mês às 10:00
   * para enviar relatório mensal
   */
  @Cron('0 10 1 * *', {
    name: 'monthly-report',
    timeZone: 'America/Sao_Paulo',
  })
  async sendMonthlyReport() {
    this.logger.log('📈 Iniciando envio de relatórios mensais...');

    try {
      const users = await this.prisma.user.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          phone: true,
        },
      });

      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const year = lastMonth.getFullYear();
      const month = lastMonth.getMonth() + 1;

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      let sentCount = 0;

      for (const user of users) {
        const transactions = await this.prisma.transaction.findMany({
          where: {
            userId: user.id,
            effectiveDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            category: true,
          },
        });

        if (transactions.length > 0) {
          const totalIncome = transactions
            .filter(t => t.movementType === 'income')
            .reduce((sum, t) => sum + t.amount.toNumber(), 0);

          const totalExpenses = transactions
            .filter(t => t.movementType === 'expense')
            .reduce((sum, t) => sum + t.amount.toNumber(), 0);

          const balance = totalIncome - totalExpenses;

          // Categoria com mais gastos
          const categoryMap = new Map<string, number>();
          transactions
            .filter(t => t.movementType === 'expense')
            .forEach(t => {
              const current = categoryMap.get(t.category.name) || 0;
              categoryMap.set(t.category.name, current + t.amount.toNumber());
            });

          const topCategory = Array.from(categoryMap.entries())
            .sort((a, b) => b[1] - a[1])[0];

          await this.sendTelegramMonthlyReport(user, {
            month: this.getMonthName(month),
            year,
            totalIncome,
            totalExpenses,
            balance,
            transactionCount: transactions.length,
            topCategory: topCategory ? topCategory[0] : 'N/A',
            topCategoryAmount: topCategory ? topCategory[1] : 0,
          });

          sentCount++;
        }
      }

      this.logger.log(`✅ Relatórios mensais enviados: ${sentCount}`);
    } catch (error) {
      this.logger.error('Erro ao enviar relatórios mensais', error);
    }
  }

  /**
   * Verificar orçamentos próximos do limite
   * Roda a cada 6 horas
   */
  @Cron('0 */6 * * *', {
    name: 'budget-check',
    timeZone: 'America/Sao_Paulo',
  })
  async checkBudgetLimits() {
    this.logger.log('💰 Verificando limites de orçamento...');

    try {
      // Buscar alertas não lidos recentes (últimas 6 horas)
      const recentAlerts = await this.prisma.budgetAlert.findMany({
        where: {
          isRead: false,
          createdAt: {
            gte: new Date(Date.now() - 6 * 60 * 60 * 1000),
          },
        },
        include: {
          budget: {
            include: {
              user: true,
              category: true,
            },
          },
        },
      });

      let sentCount = 0;

      for (const alert of recentAlerts) {
        await this.sendTelegramBudgetAlert(alert.budget.user, alert);
        sentCount++;
      }

      this.logger.log(`✅ Alertas de orçamento enviados: ${sentCount}`);
    } catch (error) {
      this.logger.error('Erro ao verificar limites de orçamento', error);
    }
  }

  /**
   * Enviar mensagem via Telegram
   */
  private async sendTelegramMessage(chatId: string, text: string): Promise<void> {
    try {
      await axios.post(`${this.telegramApiUrl}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      });
    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem Telegram para ${chatId}`, error);
    }
  }

  private async sendTelegramReminder(user: any): Promise<void> {
    if (!user.phone) return;

    const message =
      `👋 Olá, ${user.name}!\n\n` +
      `📝 Você ainda não registrou nenhuma transação hoje.\n\n` +
      `Que tal adicionar suas despesas ou receitas do dia?\n\n` +
      `Use /addreceita ou /adddespesa para começar!`;

    await this.sendTelegramMessage(user.phone, message);
  }

  private async sendTelegramWeeklySummary(user: any, data: any): Promise<void> {
    if (!user.phone) return;

    const incomeIcon = data.totalIncome > 0 ? '💰' : '💵';
    const expenseIcon = '💳';
    const balanceIcon = data.balance >= 0 ? '✅' : '⚠️';

    const message =
      `📊 *Resumo Semanal*\n\n` +
      `Olá, ${user.name}!\n\n` +
      `Aqui está o resumo da sua semana:\n\n` +
      `${incomeIcon} Receitas: R$ ${data.totalIncome.toFixed(2)}\n` +
      `${expenseIcon} Despesas: R$ ${data.totalExpenses.toFixed(2)}\n` +
      `${balanceIcon} Saldo: R$ ${data.balance.toFixed(2)}\n\n` +
      `📝 Total de transações: ${data.transactionCount}\n\n` +
      `Continue assim! Use /relatorio para ver mais detalhes.`;

    await this.sendTelegramMessage(user.phone, message);
  }

  private async sendTelegramMonthlyReport(user: any, data: any): Promise<void> {
    if (!user.phone) return;

    const balanceIcon = data.balance >= 0 ? '🎉' : '⚠️';

    const message =
      `📈 *Relatório Mensal - ${data.month}/${data.year}*\n\n` +
      `Olá, ${user.name}!\n\n` +
      `💰 Receitas: R$ ${data.totalIncome.toFixed(2)}\n` +
      `💳 Despesas: R$ ${data.totalExpenses.toFixed(2)}\n` +
      `${balanceIcon} Saldo: R$ ${data.balance.toFixed(2)}\n\n` +
      `📝 Transações: ${data.transactionCount}\n` +
      `📊 Maior gasto: ${data.topCategory} (R$ ${data.topCategoryAmount.toFixed(2)})\n\n` +
      `Use /graficos para visualizar seus gastos!`;

    await this.sendTelegramMessage(user.phone, message);
  }

  private async sendTelegramBudgetAlert(user: any, alert: any): Promise<void> {
    if (!user.phone) return;

    await this.sendTelegramMessage(user.phone, alert.message);
  }

  private getMonthName(month: number): string {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1] || '';
  }

  /**
   * Criar notificação manual
   */
  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: any
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data,
      },
    });
  }

  /**
   * Buscar notificações não lidas de um usuário
   */
  async getUnreadNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        isRead: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Marcar notificação como lida
   */
  async markAsRead(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }
}
