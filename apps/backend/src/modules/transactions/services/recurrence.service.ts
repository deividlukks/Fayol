import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { TransactionsService } from './transactions.service';
import { Recurrence, LaunchType } from '@fayol/shared-types';
import { addDays, addWeeks, addMonths, addYears, isBefore, startOfDay } from 'date-fns';

@Injectable()
export class RecurrenceService {
  private readonly logger = new Logger(RecurrenceService.name);

  constructor(
    private prisma: PrismaService,
    private transactionsService: TransactionsService
  ) {}

  /**
   * Roda diariamente à meia-noite para processar transações recorrentes
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processRecurringTransactions(): Promise<void> {
    this.logger.log('Iniciando processamento de transações recorrentes...');

    try {
      const today = startOfDay(new Date());

      // Busca todas as transações recorrentes pagas (que servem como template)
      const recurringTransactions = await this.prisma.transaction.findMany({
        where: {
          recurrence: { not: Recurrence.NONE },
          isPaid: true,
        },
        include: {
          account: true,
        },
      });

      this.logger.log(`Encontradas ${recurringTransactions.length} transações recorrentes`);

      let created = 0;
      let skipped = 0;

      for (const transaction of recurringTransactions) {
        try {
          const nextDate = this.calculateNextOccurrence(
            new Date(transaction.date),
            transaction.recurrence as Recurrence
          );

          // Verifica se a próxima ocorrência é hoje
          if (nextDate && startOfDay(nextDate).getTime() === today.getTime()) {
            // Verifica se já existe uma transação para hoje com a mesma descrição e conta
            const existingToday = await this.prisma.transaction.findFirst({
              where: {
                userId: transaction.userId,
                accountId: transaction.accountId,
                description: transaction.description,
                date: {
                  gte: today,
                  lt: addDays(today, 1),
                },
              },
            });

            if (existingToday) {
              this.logger.debug(
                `Transação recorrente já existe para hoje: ${transaction.description}`
              );
              skipped++;
              continue;
            }

            // Cria a nova transação recorrente
            await this.transactionsService.create(transaction.userId, {
              description: transaction.description,
              amount: Number(transaction.amount),
              date: nextDate,
              type: transaction.type as LaunchType,
              accountId: transaction.accountId,
              categoryId: transaction.categoryId || undefined,
              isPaid: true,
              recurrence: transaction.recurrence as Recurrence,
              notes: transaction.notes || undefined,
              tags: transaction.tags || [],
            });

            this.logger.log(
              `✅ Criada transação recorrente: ${transaction.description} (${transaction.recurrence})`
            );
            created++;
          } else {
            skipped++;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorStack = error instanceof Error ? error.stack : undefined;
          this.logger.error(
            `Erro ao processar transação recorrente ${transaction.id}: ${errorMessage}`,
            errorStack
          );
        }
      }

      this.logger.log(`Processamento concluído: ${created} criadas, ${skipped} ignoradas`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Erro ao processar transações recorrentes: ${errorMessage}`, errorStack);
    }
  }

  /**
   * Calcula a próxima ocorrência de uma transação recorrente
   */
  private calculateNextOccurrence(lastDate: Date, recurrence: Recurrence): Date | null {
    const today = startOfDay(new Date());
    const last = startOfDay(lastDate);

    // Se a última ocorrência é no futuro, não há próxima ocorrência ainda
    if (isBefore(today, last)) {
      return null;
    }

    switch (recurrence) {
      case Recurrence.DAILY:
        return addDays(last, 1);

      case Recurrence.WEEKLY:
        return addWeeks(last, 1);

      case Recurrence.MONTHLY:
        return addMonths(last, 1);

      case Recurrence.YEARLY:
        return addYears(last, 1);

      case Recurrence.NONE:
      default:
        return null;
    }
  }

  /**
   * Método manual para processar recorrências (útil para testes ou execução sob demanda)
   */
  async manualProcess(): Promise<{ created: number; skipped: number; errors: number }> {
    this.logger.log('Processamento manual de recorrências iniciado');

    try {
      const today = startOfDay(new Date());
      const recurringTransactions = await this.prisma.transaction.findMany({
        where: {
          recurrence: { not: Recurrence.NONE },
          isPaid: true,
        },
      });

      let created = 0;
      let skipped = 0;
      let errors = 0;

      for (const transaction of recurringTransactions) {
        try {
          const nextDate = this.calculateNextOccurrence(
            new Date(transaction.date),
            transaction.recurrence as Recurrence
          );

          if (nextDate && startOfDay(nextDate).getTime() === today.getTime()) {
            const existingToday = await this.prisma.transaction.findFirst({
              where: {
                userId: transaction.userId,
                accountId: transaction.accountId,
                description: transaction.description,
                date: {
                  gte: today,
                  lt: addDays(today, 1),
                },
              },
            });

            if (existingToday) {
              skipped++;
              continue;
            }

            await this.transactionsService.create(transaction.userId, {
              description: transaction.description,
              amount: Number(transaction.amount),
              date: nextDate,
              type: transaction.type as LaunchType,
              accountId: transaction.accountId,
              categoryId: transaction.categoryId || undefined,
              isPaid: true,
              recurrence: transaction.recurrence as Recurrence,
              notes: transaction.notes || undefined,
              tags: transaction.tags || [],
            });

            created++;
          } else {
            skipped++;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(`Erro ao processar transação: ${errorMessage}`);
          errors++;
        }
      }

      return { created, skipped, errors };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Erro no processamento manual: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Lista todas as próximas ocorrências de transações recorrentes
   */
  async getUpcomingRecurrences(userId: string, days: number = 30): Promise<any[]> {
    const recurringTransactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        recurrence: { not: Recurrence.NONE },
        isPaid: true,
      },
      include: {
        account: { select: { name: true } },
        category: { select: { name: true, icon: true } },
      },
    });

    const upcoming: any[] = [];
    const today = startOfDay(new Date());
    const limitDate = addDays(today, days);

    for (const transaction of recurringTransactions) {
      const nextDate = this.calculateNextOccurrence(
        new Date(transaction.date),
        transaction.recurrence as Recurrence
      );

      if (nextDate && isBefore(nextDate, limitDate)) {
        upcoming.push({
          id: transaction.id,
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type,
          recurrence: transaction.recurrence,
          nextOccurrence: nextDate,
          account: transaction.account.name,
          category: transaction.category?.name,
          categoryIcon: transaction.category?.icon,
        });
      }
    }

    // Ordena por data
    upcoming.sort((a, b) => a.nextOccurrence.getTime() - b.nextOccurrence.getTime());

    return upcoming;
  }
}
