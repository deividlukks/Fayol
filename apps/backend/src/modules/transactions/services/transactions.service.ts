import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTransactionDto, UpdateTransactionDto } from '../dto/transactions.dto';
import { LaunchType } from '@fayol/shared-types';
import { AiService } from '../../ai/services/ai.service';
// Importação adicionada para corrigir a tipagem
import { Transaction } from '@fayol/database-models';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiService
  ) {}

  private calculateBalanceChange(type: LaunchType, amount: number): number {
    if (type === LaunchType.INCOME) return amount;
    if (type === LaunchType.EXPENSE) return -amount;
    return 0;
  }

  // Correção TS2742: Adicionado tipo de retorno explícito
  async create(userId: string, data: CreateTransactionDto): Promise<Transaction> {
    const account = await this.prisma.account.findUnique({
      where: { id: data.accountId },
    });

    if (!account || account.userId !== userId) {
      throw new NotFoundException('Conta de origem não encontrada.');
    }

    let finalCategoryId = data.categoryId;
    // Variável mutável para permitir alteração do tipo caso a IA sugira uma categoria de tipo diferente
    let finalType = data.type;

    // Se não veio categoria (ex: lançamento via Bot ou Texto Livre), tenta categorizar via IA
    if (!finalCategoryId) {
      try {
        this.logger.log(`Tentando categorizar automaticamente: "${data.description}"...`);
        const prediction = await this.aiService.predictCategory(userId, data.description);

        if (prediction.found && prediction.category) {
          finalCategoryId = prediction.category.id;

          // Casting necessário pois o Prisma gera seus próprios Enums que, apesar de terem os mesmos valores,
          // são tecnicamente tipos diferentes do Shared-Types.
          finalType = prediction.category.type as LaunchType;

          this.logger.log(
            `✅ Categoria aplicada: ${prediction.category.name} (Tipo ajustado para: ${finalType})`
          );
        } else {
          this.logger.warn(`⚠️ Nenhuma categoria encontrada para: "${data.description}"`);
        }
      } catch (error) {
        this.logger.error(
          'Erro ao tentar categorizar automaticamente (seguindo sem categoria)',
          error
        );
      }
    }

    // Lógica específica para Transferências
    if (finalType === LaunchType.TRANSFER) {
      if (!data.destinationAccountId) {
        throw new BadRequestException('Conta de destino é obrigatória para transferências.');
      }

      const destAccount = await this.prisma.account.findUnique({
        where: { id: data.destinationAccountId },
      });

      if (!destAccount || destAccount.userId !== userId) {
        throw new NotFoundException('Conta de destino não encontrada.');
      }

      // Transação atômica para garantir que os dois lados da transferência ocorram
      return this.prisma.$transaction(async (tx) => {
        // 1. Saída da origem
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

        // 2. Entrada no destino
        await tx.transaction.create({
          data: {
            userId,
            accountId: data.destinationAccountId!, // ! é seguro aqui pois validamos acima
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

    // Transação padrão (Receita ou Despesa)
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          description: data.description,
          amount: data.amount,
          date: data.date,
          type: finalType, // Usa o tipo final (que pode ter vindo da IA)
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
        const balanceChange = this.calculateBalanceChange(finalType, data.amount);
        await tx.account.update({
          where: { id: data.accountId },
          data: { balance: { increment: balanceChange } },
        });
      }

      return transaction;
    });
  }

  // Correção TS2742: Usamos 'any' aqui pois o retorno contém includes (category/account)
  // que geram tipos complexos do Prisma difíceis de exportar sem quebrar a portabilidade.
  async findAll(userId: string): Promise<any> {
    return this.prisma.transaction.findMany({
      where: { userId },
      include: {
        category: { select: { name: true, icon: true, color: true } },
        account: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  // Correção TS2742: Usamos 'any' pelo mesmo motivo do findAll (uso de include)
  async findOne(id: string, userId: string): Promise<any> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: { category: true, account: true },
    });

    if (!transaction) throw new NotFoundException('Transação não encontrada.');
    if (transaction.userId !== userId) throw new ForbiddenException('Acesso negado.');

    return transaction;
  }

  // Correção TS2742: Adicionado tipo de retorno explícito
  async update(id: string, userId: string, data: UpdateTransactionDto): Promise<Transaction> {
    const oldTransaction = await this.findOne(id, userId);
    // Removemos campos que não devem ser atualizados diretamente no spread
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { accountId, categoryId, destinationAccountId, ...transactionData } = data;

    // --- REFINAMENTO DA IA (FEEDBACK LOOP) ---
    // Se a categoria foi alterada, ensinamos a IA
    if (data.categoryId && data.categoryId !== oldTransaction.categoryId) {
      // Busca o nome da nova categoria
      const newCategory = await this.prisma.category.findUnique({
        where: { id: data.categoryId },
        select: { name: true },
      });

      if (newCategory) {
        // Envia para treino em background (sem await para não bloquear a resposta)
        this.aiService
          .learnCategory(oldTransaction.description, newCategory.name)
          .catch((err) => this.logger.error(`Erro silent no treino da IA: ${err.message}`));
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Se a transação anterior já estava paga, estornamos o valor da conta antiga
      if (oldTransaction.isPaid) {
        const reverseChange = -this.calculateBalanceChange(
          oldTransaction.type as LaunchType,
          Number(oldTransaction.amount)
        );
        await tx.account.update({
          where: { id: oldTransaction.accountId },
          data: { balance: { increment: reverseChange } },
        });
      }

      const updatedTransaction = await tx.transaction.update({
        where: { id },
        data: {
          ...transactionData,

          // Atualização de relacionamentos (Prisma syntax)
          category:
            categoryId === null
              ? { disconnect: true }
              : categoryId
                ? { connect: { id: categoryId } }
                : undefined,

          account: accountId ? { connect: { id: accountId } } : undefined,
        },
      });

      // Se a nova versão está paga, aplicamos o novo valor na nova conta (ou na mesma)
      if (updatedTransaction.isPaid) {
        const newChange = this.calculateBalanceChange(
          updatedTransaction.type as LaunchType,
          Number(updatedTransaction.amount)
        );
        await tx.account.update({
          where: { id: updatedTransaction.accountId },
          data: { balance: { increment: newChange } },
        });
      }

      return updatedTransaction;
    });
  }

  // Correção TS2742: Adicionado tipo de retorno explícito
  async remove(id: string, userId: string): Promise<Transaction> {
    const transaction = await this.findOne(id, userId);

    return this.prisma.$transaction(async (tx) => {
      // Se estava pago, estorna o valor
      if (transaction.isPaid) {
        const reverseChange = -this.calculateBalanceChange(
          transaction.type as LaunchType,
          Number(transaction.amount)
        );
        await tx.account.update({
          where: { id: transaction.accountId },
          data: { balance: { increment: reverseChange } },
        });
      }

      return tx.transaction.delete({ where: { id } });
    });
  }
}
