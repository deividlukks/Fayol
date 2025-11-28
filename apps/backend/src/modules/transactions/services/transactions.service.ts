import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTransactionDto, UpdateTransactionDto } from '../dto/transactions.dto';
import { LaunchType } from '@fayol/shared-types';
import { AiService } from '../../ai/services/ai.service';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  private calculateBalanceChange(type: LaunchType, amount: number): number {
    if (type === LaunchType.INCOME) return amount;
    if (type === LaunchType.EXPENSE) return -amount;
    return 0;
  }

  async create(userId: string, data: CreateTransactionDto) {
    const account = await this.prisma.account.findUnique({
      where: { id: data.accountId },
    });

    if (!account || account.userId !== userId) {
      throw new NotFoundException('Conta de origem não encontrada.');
    }

    let finalCategoryId = data.categoryId;

    if (!finalCategoryId) {
      try {
        this.logger.log(`Tentando categorizar automaticamente: "${data.description}"...`);
        const prediction = await this.aiService.predictCategory(userId, data.description);
        
        if (prediction.found && prediction.category) {
          finalCategoryId = prediction.category.id;
          this.logger.log(`✅ Categoria aplicada: ${prediction.category.name}`);
        } else {
          this.logger.warn(`⚠️ Nenhuma categoria encontrada para: "${data.description}"`);
        }
      } catch (error) {
        this.logger.error('Erro ao tentar categorizar automaticamente (seguindo sem categoria)', error);
      }
    }

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
        const debitTransaction = await tx.transaction.create({
          data: {
            userId,
            accountId: data.accountId,
            categoryId: finalCategoryId,
            description: `Transferência para: ${destAccount.name}`,
            amount: data.amount,
            date: data.date,
            type: LaunchType.EXPENSE,
            isPaid: true,
            notes: data.notes,
            tags: data.tags,
          },
        });

        await tx.account.update({
          where: { id: data.accountId },
          data: { balance: { decrement: data.amount } },
        });

        await tx.transaction.create({
          data: {
            userId,
            accountId: data.destinationAccountId!,
            categoryId: finalCategoryId,
            description: `Recebido de: ${account.name}`,
            amount: data.amount,
            date: data.date,
            type: LaunchType.INCOME,
            isPaid: true,
            notes: data.notes,
            tags: data.tags,
          },
        });

        await tx.account.update({
          where: { id: data.destinationAccountId },
          data: { balance: { increment: data.amount } },
        });

        return debitTransaction;
      });
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
          category: finalCategoryId ? { connect: { id: finalCategoryId } } : undefined,
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

    // CORREÇÃO: Separamos os IDs de relacionamento do restante dos dados.
    // Isso evita o conflito entre passar 'accountId' (string) e estar num contexto
    // onde o Prisma espera 'account' (relação).
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { accountId, categoryId, destinationAccountId, ...transactionData } = data;

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
          ...transactionData,
          
          // Atualiza Categoria (Relacionamento)
          category: categoryId === null 
            ? { disconnect: true } 
            : categoryId 
              ? { connect: { id: categoryId } } 
              : undefined,

          // Atualiza Conta (Relacionamento)
          // Usamos 'connect' aqui para satisfazer a tipagem estrita do Prisma
          // quando outros relacionamentos (como category) também estão sendo atualizados.
          account: accountId 
            ? { connect: { id: accountId } } 
            : undefined,
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