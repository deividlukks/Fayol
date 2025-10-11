import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecurringTransactionDto } from './dto/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from './dto/update-recurring-transaction.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class RecurringTransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateRecurringTransactionDto) {
    // Validar que a conta pertence ao usuário
    const account = await this.prisma.account.findFirst({
      where: { id: dto.accountId, userId },
    });

    if (!account) {
      throw new BadRequestException('Conta não encontrada');
    }

    // Validar categoria
    const category = await this.prisma.category.findFirst({
      where: {
        id: dto.categoryId,
        OR: [{ userId }, { userId: null }], // Categoria do usuário ou do sistema
      },
    });

    if (!category) {
      throw new BadRequestException('Categoria não encontrada');
    }

    // Calcular nextDate baseado em startDate
    const nextDate = dto.startDate;

    const recurringTransaction = await this.prisma.recurringTransaction.create({
      data: {
        userId,
        accountId: dto.accountId,
        categoryId: dto.categoryId,
        type: dto.type,
        amount: dto.amount,
        description: dto.description,
        frequency: dto.frequency,
        startDate: dto.startDate,
        endDate: dto.endDate,
        nextDate,
        isActive: dto.isActive ?? true,
        notes: dto.notes,
      },
      include: {
        account: true,
        category: true,
      },
    });

    return recurringTransaction;
  }

  async findAll(userId: string) {
    return this.prisma.recurringTransaction.findMany({
      where: { userId },
      include: {
        account: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const recurringTransaction = await this.prisma.recurringTransaction.findFirst({
      where: { id, userId },
      include: {
        account: true,
        category: true,
      },
    });

    if (!recurringTransaction) {
      throw new NotFoundException('Transação recorrente não encontrada');
    }

    return recurringTransaction;
  }

  async update(userId: string, id: string, dto: UpdateRecurringTransactionDto) {
    await this.findOne(userId, id); // Verifica se existe e pertence ao usuário

    // Validar conta se estiver sendo atualizada
    if (dto.accountId) {
      const account = await this.prisma.account.findFirst({
        where: { id: dto.accountId, userId },
      });

      if (!account) {
        throw new BadRequestException('Conta não encontrada');
      }
    }

    // Validar categoria se estiver sendo atualizada
    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: dto.categoryId,
          OR: [{ userId }, { userId: null }],
        },
      });

      if (!category) {
        throw new BadRequestException('Categoria não encontrada');
      }
    }

    const updated = await this.prisma.recurringTransaction.update({
      where: { id },
      data: dto,
      include: {
        account: true,
        category: true,
      },
    });

    return updated;
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id); // Verifica se existe e pertence ao usuário

    await this.prisma.recurringTransaction.delete({
      where: { id },
    });

    return { message: 'Transação recorrente excluída com sucesso' };
  }

  async pause(userId: string, id: string) {
    return this.update(userId, id, { isActive: false });
  }

  async resume(userId: string, id: string) {
    return this.update(userId, id, { isActive: true });
  }

  /**
   * Processa transações recorrentes
   * Executado diariamente à meia-noite
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processRecurringTransactions() {
    console.log('[CRON] Processando transações recorrentes...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Buscar transações recorrentes que devem ser processadas
    const dueRecurrings = await this.prisma.recurringTransaction.findMany({
      where: {
        isActive: true,
        nextDate: {
          lte: today,
        },
      },
      include: {
        account: true,
        category: true,
      },
    });

    console.log(`[CRON] ${dueRecurrings.length} transação(ões) recorrente(s) para processar`);

    for (const recurring of dueRecurrings) {
      try {
        // Gerar código único para a transação
        const lastTransaction = await this.prisma.transaction.findFirst({
          orderBy: { code: 'desc' },
        });

        const nextCode = lastTransaction
          ? String(Number(lastTransaction.code) + 1).padStart(6, '0')
          : '000001';

        // Criar transação normal
        await this.prisma.transaction.create({
          data: {
            code: nextCode,
            userId: recurring.userId,
            accountId: recurring.accountId,
            categoryId: recurring.categoryId,
            movementType: recurring.type === 'INCOME' ? 'income' : 'expense',
            launchType: recurring.type === 'INCOME' ? 'income' : 'expense',
            amount: recurring.amount,
            description: `${recurring.description} (Recorrente)`,
            effectiveDate: recurring.nextDate,
            dueDate: recurring.nextDate,
          },
        });

        // Calcular próxima data
        const nextDate = this.calculateNextDate(recurring.nextDate, recurring.frequency);

        // Atualizar ou desativar recorrência
        if (recurring.endDate && nextDate > recurring.endDate) {
          await this.prisma.recurringTransaction.update({
            where: { id: recurring.id },
            data: { isActive: false },
          });
          console.log(`[CRON] Transação recorrente ${recurring.id} finalizada (passou endDate)`);
        } else {
          await this.prisma.recurringTransaction.update({
            where: { id: recurring.id },
            data: { nextDate },
          });
          console.log(
            `[CRON] Transação recorrente ${recurring.id} processada. Próxima data: ${nextDate}`,
          );
        }
      } catch (error) {
        console.error(`[CRON] Erro ao processar transação recorrente ${recurring.id}:`, error);
      }
    }

    console.log('[CRON] Processamento de transações recorrentes concluído');
  }

  /**
   * Calcula a próxima data baseado na frequência
   */
  private calculateNextDate(currentDate: Date, frequency: string): Date {
    const next = new Date(currentDate);

    switch (frequency) {
      case 'DAILY':
        next.setDate(next.getDate() + 1);
        break;
      case 'WEEKLY':
        next.setDate(next.getDate() + 7);
        break;
      case 'BIWEEKLY':
        next.setDate(next.getDate() + 14);
        break;
      case 'MONTHLY':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'QUARTERLY':
        next.setMonth(next.getMonth() + 3);
        break;
      case 'YEARLY':
        next.setFullYear(next.getFullYear() + 1);
        break;
      default:
        throw new Error(`Frequência inválida: ${frequency}`);
    }

    return next;
  }
}
