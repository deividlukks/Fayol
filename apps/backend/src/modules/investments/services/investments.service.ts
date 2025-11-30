import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateInvestmentDto, UpdateInvestmentDto } from '../dto/investments.dto';
import { LaunchType } from '@fayol/shared-types';

@Injectable()
export class InvestmentsService {
  private readonly logger = new Logger(InvestmentsService.name);

  constructor(private prisma: PrismaService) {}

  // Helper para encontrar a categoria de investimento correta
  private async getInvestmentCategory() {
    // 1. Busca a categoria Pai "Investimentos"
    const parentCategory = await this.prisma.category.findFirst({
      where: {
        name: 'Investimentos',
        isSystemDefault: true,
        parentId: null,
        type: LaunchType.EXPENSE,
      },
    });

    if (!parentCategory) return null;

    // 2. Busca especificamente a subcategoria "Compra de Ativos"
    // Se não achar, tenta "Aportes" como fallback
    const subCategory = await this.prisma.category.findFirst({
      where: {
        parentId: parentCategory.id,
        name: 'Compra de Ativos', // <--- FORÇANDO A BUSCA EXATA
        isSystemDefault: true,
      },
    });

    if (subCategory) return subCategory.id;

    // Fallback: Se não existir "Compra de Ativos", tenta achar qualquer outra subcategoria válida
    const fallbackSub = await this.prisma.category.findFirst({
      where: {
        parentId: parentCategory.id,
        isSystemDefault: true,
      },
    });

    return fallbackSub?.id || parentCategory.id;
  }

  async create(userId: string, data: CreateInvestmentDto) {
    const account = await this.prisma.account.findUnique({
      where: { id: data.accountId },
    });

    if (!account || account.userId !== userId) {
      throw new NotFoundException('Conta de custódia não encontrada.');
    }

    const totalCost = Number(data.quantity) * Number(data.averagePrice);
    
    const categoryId = await this.getInvestmentCategory();

    if (!categoryId) {
      this.logger.warn('Categoria "Investimentos" não encontrada no sistema.');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Cria o Investimento
      const investment = await tx.investment.create({
        data: {
          name: data.name,
          ticker: data.ticker ? data.ticker.toUpperCase() : null,
          quantity: data.quantity,
          averagePrice: data.averagePrice,
          currentPrice: data.currentPrice || data.averagePrice,
          type: data.type,
          purchaseDate: data.purchaseDate,
          user: { connect: { id: userId } },
          account: { connect: { id: data.accountId } },
        },
      });

      // 2. Atualiza Saldo
      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: { decrement: totalCost } },
      });

      // 3. Cria Transação com a Categoria Fixada
      await tx.transaction.create({
        data: {
          userId,
          accountId: data.accountId,
          categoryId: categoryId,
          description: `Compra: ${data.ticker || data.name}`,
          amount: totalCost,
          date: data.purchaseDate,
          type: LaunchType.EXPENSE,
          isPaid: true,
          notes: `Investimento em ${data.quantity} un. de ${data.name}`,
        },
      });

      return investment;
    });
  }

  async findAll(userId: string) {
    const investments = await this.prisma.investment.findMany({
      where: { userId },
      include: { account: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });

    return investments.map((inv) => ({
      ...inv,
      totalValue: Number(inv.quantity) * Number(inv.currentPrice || inv.averagePrice),
      yield: inv.currentPrice 
        ? ((Number(inv.currentPrice) - Number(inv.averagePrice)) / Number(inv.averagePrice)) * 100 
        : 0
    }));
  }

  async findOne(id: string, userId: string) {
    const investment = await this.prisma.investment.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!investment) throw new NotFoundException('Investimento não encontrado.');
    if (investment.userId !== userId) throw new ForbiddenException('Acesso negado.');

    const totalValue = Number(investment.quantity) * Number(investment.currentPrice || investment.averagePrice);

    return { ...investment, totalValue };
  }

  async update(id: string, userId: string, data: UpdateInvestmentDto) {
    await this.findOne(id, userId); 

    return this.prisma.investment.update({
      where: { id },
      data: {
        name: data.name,
        ticker: data.ticker,
        quantity: data.quantity,
        averagePrice: data.averagePrice,
        currentPrice: data.currentPrice,
        type: data.type,
        purchaseDate: data.purchaseDate,
        account: data.accountId ? { connect: { id: data.accountId } } : undefined,
      },
    });
  }

  async lookupTicker(ticker: string) {
    const t = ticker.toUpperCase().trim();
    let type = 'STOCK'; 
    let name = `Ação ${t}`;
    let price = 0;

    const hash = t.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    if (t.endsWith('11')) {
      type = 'FII';
      name = `${t} Fundo Imobiliário`;
      price = (hash % 100) + 50;
    } else {
      price = (hash % 50) + 10;
    }

    return { ticker: t, name, type, price: Number(price.toFixed(2)) };
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.investment.delete({ where: { id } });
  }
}