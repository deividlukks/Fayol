import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateInvestmentDto, UpdateInvestmentDto } from '../dto/investments.dto';
import { LaunchType } from '@fayol/shared-types';

@Injectable()
export class InvestmentsService {
  private readonly logger = new Logger(InvestmentsService.name);

  constructor(private prisma: PrismaService) {}

  // Helper para arredondar valores financeiros (2 casas)
  private roundCurrency(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  // Helper para garantir categoria de investimento
  private async getInvestmentCategory(userId: string) {
    // 1. Tenta achar uma categoria do sistema ou do usuário que corresponda
    const category = await this.prisma.category.findFirst({
      where: {
        OR: [
          { name: { contains: 'Investimento', mode: 'insensitive' } },
          { name: { contains: 'Aporte', mode: 'insensitive' } },
        ],
        type: LaunchType.EXPENSE,
        AND: [{ OR: [{ isSystemDefault: true }, { userId }] }],
      },
    });

    if (category) return category.id;

    // 2. Se não achar, cria uma categoria "Investimentos" personalizada para o usuário
    // Isso evita erros caso o seed de categorias padrão não tenha rodado ou tenha sido alterado
    this.logger.log(`Categoria de investimentos não encontrada para user ${userId}. Criando nova.`);

    const newCategory = await this.prisma.category.create({
      data: {
        name: 'Investimentos',
        type: LaunchType.EXPENSE,
        icon: '📈',
        color: '#6A4C93',
        isSystemDefault: false,
        user: { connect: { id: userId } },
      },
    });

    return newCategory.id;
  }

  async create(userId: string, data: CreateInvestmentDto) {
    const account = await this.prisma.account.findUnique({
      where: { id: data.accountId },
    });

    if (!account || account.userId !== userId) {
      throw new NotFoundException('Conta de custódia não encontrada.');
    }

    // Cálculo seguro do custo total
    const rawTotal = Number(data.quantity) * Number(data.averagePrice);
    const totalCost = this.roundCurrency(rawTotal);

    // Busca categoria de forma segura (cria se não existir)
    const categoryId = await this.getInvestmentCategory(userId);

    return this.prisma.$transaction(async (tx) => {
      // 1. Cria o Investimento (Carteira)
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

      // 2. Atualiza Saldo da Conta (Debita o valor da compra)
      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: { decrement: totalCost } },
      });

      // 3. Cria a Transação Financeira (Para fluxo de caixa)
      await tx.transaction.create({
        data: {
          userId,
          accountId: data.accountId,
          categoryId: categoryId,
          description: `Aporte: ${data.ticker || data.name}`,
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
      // Cálculos de visualização também devem ser arredondados
      totalValue: this.roundCurrency(
        Number(inv.quantity) * Number(inv.currentPrice || inv.averagePrice)
      ),
      yield:
        inv.currentPrice && Number(inv.averagePrice) > 0
          ? ((Number(inv.currentPrice) - Number(inv.averagePrice)) / Number(inv.averagePrice)) * 100
          : 0,
    }));
  }

  async findOne(id: string, userId: string) {
    const investment = await this.prisma.investment.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!investment) throw new NotFoundException('Investimento não encontrado.');
    if (investment.userId !== userId) throw new ForbiddenException('Acesso negado.');

    const totalValue = this.roundCurrency(
      Number(investment.quantity) * Number(investment.currentPrice || investment.averagePrice)
    );

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
    // Simulação (Mock) - Na Fase 6 conectaremos à API externa (Alpha Vantage/Yahoo)
    const t = ticker.toUpperCase().trim();
    let type = 'STOCK';
    let name = `Ação ${t}`;
    let price = 0;

    const hash = t.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    if (t.endsWith('11')) {
      type = 'FII';
      name = `${t} Fundo Imobiliário`;
      price = (hash % 100) + 50;
    } else if (t === 'BTC' || t === 'ETH') {
      type = 'CRYPTO';
      name = t === 'BTC' ? 'Bitcoin' : 'Ethereum';
      price = t === 'BTC' ? 250000 : 15000;
    } else {
      price = (hash % 50) + 10;
    }

    return { ticker: t, name, type, price: Number(price.toFixed(2)) };
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    // Nota: Ao deletar um investimento, NÃO estamos estornando o saldo ou deletando a transação original
    // Isso é o comportamento correto (histórico se mantém), mas o ativo sai da carteira.
    return this.prisma.investment.delete({ where: { id } });
  }
}
