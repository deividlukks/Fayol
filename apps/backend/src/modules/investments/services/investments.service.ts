import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateInvestmentDto, UpdateInvestmentDto } from '../dto/investments.dto';
import { LaunchType } from '@fayol/shared-types';

@Injectable()
export class InvestmentsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: CreateInvestmentDto) {
    // Verifica se a conta existe e pertence ao usuário
    const account = await this.prisma.account.findUnique({
      where: { id: data.accountId },
    });

    if (!account || account.userId !== userId) {
      throw new NotFoundException('Conta de custódia não encontrada.');
    }

    const totalCost = data.quantity * data.averagePrice;

    // Opcional: Bloquear se saldo insuficiente
    // if (Number(account.balance) < totalCost) {
    //   throw new BadRequestException('Saldo insuficiente na conta para realizar este investimento.');
    // }

    // Executa tudo numa transação do banco para garantir consistência
    return this.prisma.$transaction(async (tx) => {
      // 1. Cria o Investimento
      const investment = await tx.investment.create({
        data: {
          name: data.name,
          ticker: data.ticker,
          quantity: data.quantity,
          averagePrice: data.averagePrice,
          currentPrice: data.currentPrice || data.averagePrice,
          type: data.type,
          purchaseDate: data.purchaseDate,
          user: { connect: { id: userId } },
          account: { connect: { id: data.accountId } },
        },
      });

      // 2. Debita o valor do saldo da conta (Dinheiro vira Ativo)
      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: { decrement: totalCost } },
      });

      // 3. Cria o registro na timeline de Transações (para extrato)
      await tx.transaction.create({
        data: {
          userId,
          accountId: data.accountId,
          description: `Compra: ${data.ticker || data.name}`,
          amount: totalCost,
          date: data.purchaseDate,
          type: LaunchType.EXPENSE, // Saiu dinheiro da conta
          isPaid: true,
          notes: `Investimento em ${data.quantity} un. de ${data.name}`,
          // Opcional: Poderíamos criar uma categoria "Investimentos" se não existir, mas deixaremos null por enquanto
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

    // Calcula o valor total estimado de cada ativo
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
    await this.findOne(id, userId); // Valida permissão

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

  // Lookup Ticker (Simulação Inteligente)
  async lookupTicker(ticker: string) {
    const t = ticker.toUpperCase().trim();
    
    let type = 'STOCK'; 
    let name = `Ação ${t}`;
    let price = 0;

    const hash = t.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    const cryptoMap: Record<string, string> = { 
      'BTC': 'Bitcoin', 'ETH': 'Ethereum', 'SOL': 'Solana', 'USDT': 'Tether', 'ADA': 'Cardano' 
    };
    
    const usStocksMap: Record<string, string> = {
      'GOOG': 'Alphabet Inc Class C',
      'GOOGL': 'Alphabet Inc Class A',
      'AAPL': 'Apple Inc.',
      'MSFT': 'Microsoft Corporation',
      'AMZN': 'Amazon.com Inc.',
      'TSLA': 'Tesla Inc.',
      'NVDA': 'NVIDIA Corporation',
      'META': 'Meta Platforms Inc.',
      'NFLX': 'Netflix Inc.',
      'SPY': 'SPDR S&P 500 ETF Trust',
      'IVV': 'iShares Core S&P 500 ETF',
      'VOO': 'Vanguard S&P 500 ETF'
    };

    if (cryptoMap[t]) {
      type = 'CRYPTO';
      name = cryptoMap[t];
      price = (hash * 150) + (hash % 100); 
    } 
    else if (usStocksMap[t]) {
      type = 'STOCK_US';
      name = usStocksMap[t];
      price = (hash % 200) + 100 + ((hash % 100) / 100);
    }
    else if (t.endsWith('11')) {
      if (['BOVA11', 'IVVB11', 'SMAL11'].includes(t)) {
        type = 'ETF';
        name = `${t} ETF Index`;
      } else {
        type = 'FII';
        name = `${t} Fundo Imobiliário`;
      }
      price = (hash % 100) + 50 + ((hash % 10) / 10);
    } 
    else if (t.endsWith('3') || t.endsWith('4') || t.endsWith('5') || t.endsWith('6')) {
      type = 'STOCK';
      const brStocks: Record<string, string> = {
        'PETR4': 'Petrobras PN', 'VALE3': 'Vale ON', 'ITUB4': 'Itaú Unibanco PN',
        'WEGE3': 'Weg ON', 'BBAS3': 'Banco do Brasil ON', 'ITSA4': 'Itaúsa PN'
      };
      name = brStocks[t] || `${t} S.A.`;
      price = (hash % 50) + 10 + ((hash % 10) / 10);
    }

    return { ticker: t, name, type, price: Number(price.toFixed(2)) };
  }

  async remove(id: string, userId: string) {
    // NOTA: Em uma implementação real, ao remover o investimento (venda), 
    // o dinheiro deveria voltar para a conta. Por enquanto, apenas deletamos o registro.
    await this.findOne(id, userId);
    return this.prisma.investment.delete({ where: { id } });
  }
}