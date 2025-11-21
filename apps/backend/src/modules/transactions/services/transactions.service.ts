import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service'; // Sobe 3 níveis
import { CreateTransactionDto, UpdateTransactionDto } from '../dto/transactions.dto';
import { LaunchType } from '@fayol/shared-types';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  private calculateBalanceChange(type: LaunchType, amount: number): number {
    return type === LaunchType.INCOME ? amount : -amount;
  }

  async create(userId: string, data: CreateTransactionDto) {
    const account = await this.prisma.account.findUnique({
      where: { id: data.accountId },
    });

    if (!account || account.userId !== userId) {
      throw new NotFoundException('Conta não encontrada.');
    }

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          description: data.description,
          amount: data.amount,
          date: data.date,
          type: data.type,
          isPaid: data.isPaid,
          recurrence: data.recurrence,
          notes: data.notes,
          tags: data.tags || [],
          user: { connect: { id: userId } },
          account: { connect: { id: data.accountId } },
          category: data.categoryId ? { connect: { id: data.categoryId } } : undefined,
        },
      });

      if (data.isPaid) {
        const balanceChange = this.calculateBalanceChange(data.type, data.amount);
        await tx.account.update({
          where: { id: data.accountId },
          data: { balance: { increment: balanceChange } },
        });
      }

      return transaction;
    });
  }

  async findAll(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      include: { 
        category: { select: { name: true, icon: true, color: true } },
        account: { select: { name: true } }
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: { category: true, account: true },
    });

    if (!transaction) throw new NotFoundException('Transação não encontrada.');
    if (transaction.userId !== userId) throw new ForbiddenException('Acesso negado.');

    return transaction;
  }

  async update(id: string, userId: string, data: UpdateTransactionDto) {
    const oldTransaction = await this.findOne(id, userId);

    return this.prisma.$transaction(async (tx) => {
      if (oldTransaction.isPaid) {
        const reverseChange = -this.calculateBalanceChange(oldTransaction.type as LaunchType, Number(oldTransaction.amount));
        await tx.account.update({
          where: { id: oldTransaction.accountId },
          data: { balance: { increment: reverseChange } },
        });
      }

      const updatedTransaction = await tx.transaction.update({
        where: { id },
        data: {
          ...data,
          categoryId: data.categoryId,
          accountId: data.accountId,
        },
      });

      if (updatedTransaction.isPaid) {
        const newChange = this.calculateBalanceChange(updatedTransaction.type as LaunchType, Number(updatedTransaction.amount));
        await tx.account.update({
          where: { id: updatedTransaction.accountId },
          data: { balance: { increment: newChange } },
        });
      }

      return updatedTransaction;
    });
  }

  async remove(id: string, userId: string) {
    const transaction = await this.findOne(id, userId);

    return this.prisma.$transaction(async (tx) => {
      if (transaction.isPaid) {
        const reverseChange = -this.calculateBalanceChange(transaction.type as LaunchType, Number(transaction.amount));
        await tx.account.update({
          where: { id: transaction.accountId },
          data: { balance: { increment: reverseChange } },
        });
      }

      return tx.transaction.delete({ where: { id } });
    });
  }
}