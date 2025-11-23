import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTransactionDto, UpdateTransactionDto } from '../dto/transactions.dto';
import { LaunchType } from '@fayol/shared-types';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  private calculateBalanceChange(type: LaunchType, amount: number): number {
    if (type === LaunchType.INCOME) return amount;
    if (type === LaunchType.EXPENSE) return -amount;
    return 0; // Transferências são tratadas de forma especial
  }

  async create(userId: string, data: CreateTransactionDto) {
    // Valida a conta de origem
    const account = await this.prisma.account.findUnique({
      where: { id: data.accountId },
    });

    if (!account || account.userId !== userId) {
      throw new NotFoundException('Conta de origem não encontrada.');
    }

    // LÓGICA ESPECIAL PARA TRANSFERÊNCIAS
    if (data.type === LaunchType.TRANSFER) {
      if (!data.destinationAccountId) {
        throw new BadRequestException('Conta de destino é obrigatória para transferências.');
      }

      const destAccount = await this.prisma.account.findUnique({
        where: { id: data.destinationAccountId },
      });

      if (!destAccount || destAccount.userId !== userId) {
        throw new NotFoundException('Conta de destino não encontrada.');
      }

      return this.prisma.$transaction(async (tx) => {
        // 1. Saída da Origem (Débito)
        const debitTransaction = await tx.transaction.create({
          data: {
            userId,
            accountId: data.accountId,
            categoryId: data.categoryId,
            description: `Transferência para: ${destAccount.name}`,
            amount: data.amount,
            date: data.date,
            type: LaunchType.EXPENSE, // Registra como despesa na origem para auditoria
            isPaid: true,
            notes: data.notes,
            tags: data.tags,
          },
        });

        await tx.account.update({
          where: { id: data.accountId },
          data: { balance: { decrement: data.amount } },
        });

        // 2. Entrada no Destino (Crédito)
        await tx.transaction.create({
          data: {
            userId,
            accountId: data.destinationAccountId!,
            categoryId: data.categoryId,
            description: `Recebido de: ${account.name}`,
            amount: data.amount,
            date: data.date,
            type: LaunchType.INCOME, // Registra como receita no destino
            isPaid: true,
            notes: data.notes,
            tags: data.tags,
          },
        });

        await tx.account.update({
          where: { id: data.destinationAccountId },
          data: { balance: { increment: data.amount } },
        });

        return debitTransaction; // Retorna a transação de origem como referência
      });
    }

    // LÓGICA PADRÃO (RECEITA/DESPESA)
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
      // Estorna o saldo anterior se foi pago
      if (oldTransaction.isPaid) {
        // Se era uma despesa, devolve o dinheiro (increment). Se era receita, retira (decrement/negativo do positivo).
        // Nota: Transferências complexas (dual entry) não são editáveis facilmente nesta versão simples, 
        // editamos apenas o registro "em foco".
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
          // Nota: Não atualizamos o destinationAccountId aqui no update simples MVP
        },
      });

      // Aplica o novo saldo
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