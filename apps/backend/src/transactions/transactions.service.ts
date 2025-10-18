import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BudgetsService } from '../budgets/budgets.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { TransferDto } from './dto/transfer.dto';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private budgetsService: BudgetsService,
  ) {}

  async create(userId: string, createTransactionDto: CreateTransactionDto) {
    const { accountId, categoryId, subcategoryId, ...data } = createTransactionDto;

    // Verificar se a conta pertence ao usuário
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new ForbiddenException('Conta não encontrada ou não pertence ao usuário');
    }

    // Verificar categoria
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    // Gerar código único da transação
    const lastTransaction = await this.prisma.transaction.findFirst({
      orderBy: { code: 'desc' },
    });

    const nextCode = lastTransaction
      ? String(Number(lastTransaction.code) + 1).padStart(6, '0')
      : '000001';

    const transaction = await this.prisma.transaction.create({
      data: {
        ...data,
        code: nextCode,
        userId,
        accountId,
        categoryId,
        subcategoryId: subcategoryId || null,
      },
      include: {
        account: true,
        category: true,
        subcategory: true,
      },
    });

    // Verificar orçamentos após criar despesa
    if (data.movementType === 'expense') {
      await this.budgetsService.checkBudgetLimits(userId, categoryId).catch(err => {
        console.error('Erro ao verificar limites de orçamento:', err);
      });
    }

    return transaction;
  }

  async findAll(userId: string, filters?: FilterTransactionDto) {
    const {
      movementType,
      accountId,
      categoryId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = filters || {};

    const where: any = { userId };

    if (movementType) {
      where.movementType = movementType;
    }

    if (accountId) {
      where.accountId = accountId;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          account: true,
          category: true,
          subcategory: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        account: true,
        category: true,
        subcategory: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada');
    }

    if (transaction.userId !== userId) {
      throw new ForbiddenException('Acesso negado');
    }

    return transaction;
  }

  async update(id: string, userId: string, updateTransactionDto: UpdateTransactionDto) {
    const transaction = await this.findOne(id, userId);

    // Não pode editar se já foi efetivada
    if (transaction.effectiveDate) {
      throw new BadRequestException('Não é possível editar uma transação já efetivada');
    }

    return this.prisma.transaction.update({
      where: { id },
      data: updateTransactionDto,
      include: {
        account: true,
        category: true,
        subcategory: true,
      },
    });
  }

  async remove(id: string, userId: string) {
    const transaction = await this.findOne(id, userId);

    // Não pode excluir se já foi efetivada
    if (transaction.effectiveDate) {
      throw new BadRequestException('Não é possível excluir uma transação já efetivada');
    }

    await this.prisma.transaction.delete({
      where: { id },
    });

    return { message: 'Transação removida com sucesso' };
  }

  async effectuate(id: string, userId: string) {
    const transaction = await this.findOne(id, userId);

    if (transaction.effectiveDate) {
      throw new BadRequestException('Transação já efetivada');
    }

    return this.prisma.transaction.update({
      where: { id },
      data: {
        effectiveDate: new Date(),
      },
      include: {
        account: true,
        category: true,
        subcategory: true,
      },
    });
  }

  async pause(id: string, userId: string) {
    const transaction = await this.findOne(id, userId);

    if (!transaction.isRecurring) {
      throw new BadRequestException('Apenas transações recorrentes podem ser pausadas');
    }

    return this.prisma.transaction.update({
      where: { id },
      data: { isPaused: true },
    });
  }

  async resume(id: string, userId: string) {
    const transaction = await this.findOne(id, userId);

    if (!transaction.isRecurring) {
      throw new BadRequestException('Apenas transações recorrentes podem ser retomadas');
    }

    return this.prisma.transaction.update({
      where: { id },
      data: { isPaused: false },
    });
  }

  /**
   * Cria uma transferência entre duas contas do usuário
   * Cria duas transações: uma de saída na conta origem e uma de entrada na conta destino
   */
  async createTransfer(userId: string, transferDto: TransferDto) {
    const { fromAccountId, toAccountId, amount, description } = transferDto;

    // Validar que as contas existem e pertencem ao usuário
    const [fromAccount, toAccount] = await Promise.all([
      this.prisma.account.findFirst({
        where: { id: fromAccountId, userId },
      }),
      this.prisma.account.findFirst({
        where: { id: toAccountId, userId },
      }),
    ]);

    if (!fromAccount) {
      throw new BadRequestException('Conta de origem não encontrada');
    }

    if (!toAccount) {
      throw new BadRequestException('Conta de destino não encontrada');
    }

    if (fromAccountId === toAccountId) {
      throw new BadRequestException('Conta de origem e destino não podem ser a mesma');
    }

    // Validar saldo (caso queira implementar validação de saldo)
    // Nota: Como initialBalance é Decimal e não há campo balance, você pode adicionar essa validação depois
    // if (fromAccount.initialBalance < amount) {
    //   throw new BadRequestException('Saldo insuficiente na conta de origem');
    // }

    // Buscar ou criar categoria de transferência
    let transferCategory = await this.prisma.category.findFirst({
      where: {
        name: 'Transferência',
        isSystem: true,
      },
    });

    if (!transferCategory) {
      // Criar categoria de transferência se não existir
      transferCategory = await this.prisma.category.create({
        data: {
          name: 'Transferência',
          type: 'expense', // Tipo genérico
          isSystem: true,
        },
      });
    }

    // Gerar código único para as transações
    const lastTransaction = await this.prisma.transaction.findFirst({
      orderBy: { code: 'desc' },
    });

    const nextCodeNum = lastTransaction ? Number(lastTransaction.code) + 1 : 1;
    const debitCode = String(nextCodeNum).padStart(6, '0');
    const creditCode = String(nextCodeNum + 1).padStart(6, '0');

    // Usar transação do Prisma para garantir atomicidade
    const result = await this.prisma.$transaction(async (prisma) => {
      // Criar transação de débito (saída da conta origem)
      const debitTransaction = await prisma.transaction.create({
        data: {
          code: debitCode,
          userId,
          accountId: fromAccountId,
          movementType: 'expense',
          launchType: 'transfer',
          categoryId: transferCategory.id,
          amount,
          description: description || `Transferência para ${toAccount.name}`,
          effectiveDate: new Date(),
          transferAccountId: toAccountId,
        },
      });

      // Criar transação de crédito (entrada na conta destino)
      const creditTransaction = await prisma.transaction.create({
        data: {
          code: creditCode,
          userId,
          accountId: toAccountId,
          movementType: 'income',
          launchType: 'transfer',
          categoryId: transferCategory.id,
          amount,
          description: description || `Transferência de ${fromAccount.name}`,
          effectiveDate: new Date(),
          transferAccountId: fromAccountId,
          transferId: debitTransaction.id, // Vincular as transações
        },
      });

      // Atualizar a transação de débito com o ID da transação de crédito
      await prisma.transaction.update({
        where: { id: debitTransaction.id },
        data: { transferId: creditTransaction.id },
      });

      return { debitTransaction, creditTransaction };
    });

    // Buscar as transações criadas com includes
    const [debit, credit] = await Promise.all([
      this.prisma.transaction.findUnique({
        where: { id: result.debitTransaction.id },
        include: {
          account: true,
          category: true,
        },
      }),
      this.prisma.transaction.findUnique({
        where: { id: result.creditTransaction.id },
        include: {
          account: true,
          category: true,
        },
      }),
    ]);

    return {
      message: 'Transferência realizada com sucesso',
      transfer: {
        from: debit,
        to: credit,
        amount,
      },
    };
  }
}
