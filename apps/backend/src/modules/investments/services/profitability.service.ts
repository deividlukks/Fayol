import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { MarketDataService } from '../../integrations/services/market-data.service';
import { CurrencyService } from '../../accounts/services/currency.service';

interface InvestmentProfitability {
  investmentId: string;
  symbol: string;
  type: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  investedAmount: number;
  currentValue: number;
  profit: number;
  profitPercent: number;
  dayChange: number;
  dayChangePercent: number;
  currency: string;
}

interface PortfolioProfitability {
  totalInvested: number;
  totalValue: number;
  totalProfit: number;
  totalProfitPercent: number;
  dayChange: number;
  dayChangePercent: number;
  investments: InvestmentProfitability[];
}

@Injectable()
export class ProfitabilityService {
  private readonly logger = new Logger(ProfitabilityService.name);

  constructor(
    private prisma: PrismaService,
    private marketDataService: MarketDataService,
    private currencyService: CurrencyService
  ) {}

  /**
   * Calcula a rentabilidade de um único investimento
   */
  async calculateInvestmentProfitability(
    investmentId: string,
    userId: string
  ): Promise<InvestmentProfitability> {
    const investment = await this.prisma.investment.findUnique({
      where: { id: investmentId },
    });

    if (!investment || investment.userId !== userId) {
      throw new Error('Investimento não encontrado');
    }

    // Busca preço atual do mercado
    let currentPrice = Number(investment.currentPrice);
    let dayChange = 0;
    let dayChangePercent = 0;

    try {
      if (investment.type === 'CRYPTO') {
        const cryptoData = await this.marketDataService.getCryptoData(investment.ticker || '');
        currentPrice = cryptoData.currentPrice;
        dayChange = cryptoData.priceChange24h;
        dayChangePercent = cryptoData.priceChangePercent24h;

        // Converte de USD para BRL se necessário
        const usdToBrl = await this.currencyService.getExchangeRate('USD', 'BRL');
        currentPrice = currentPrice * usdToBrl;
        dayChange = dayChange * usdToBrl;
      } else if (investment.type === 'STOCK_US' || investment.type === 'STOCK_BR') {
        const stockData = await this.marketDataService.getStockData(investment.ticker || '');
        currentPrice = stockData.price;
        dayChange = stockData.change;
        dayChangePercent = stockData.changePercent;

        // Se for ação US, converte para BRL
        if (investment.type === 'STOCK_US' && stockData.currency === 'USD') {
          const usdToBrl = await this.currencyService.getExchangeRate('USD', 'BRL');
          currentPrice = currentPrice * usdToBrl;
          dayChange = dayChange * usdToBrl;
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(
        `Erro ao buscar preço atual para ${investment.ticker || 'N/A'}: ${errorMessage}. Usando preço armazenado.`
      );
    }

    const quantity = Number(investment.quantity);
    const averagePrice = Number(investment.averagePrice);
    const investedAmount = quantity * averagePrice;
    const currentValue = quantity * currentPrice;
    const profit = currentValue - investedAmount;
    const profitPercent = (profit / investedAmount) * 100;

    return {
      investmentId: investment.id,
      symbol: investment.ticker || '',
      type: investment.type,
      quantity,
      averagePrice,
      currentPrice,
      investedAmount,
      currentValue,
      profit,
      profitPercent,
      dayChange: dayChange * quantity,
      dayChangePercent,
      currency: 'BRL',
    };
  }

  /**
   * Calcula a rentabilidade de todo o portfólio de um usuário
   */
  async calculatePortfolioProfitability(userId: string): Promise<PortfolioProfitability> {
    const investments = await this.prisma.investment.findMany({
      where: { userId },
    });

    if (investments.length === 0) {
      return {
        totalInvested: 0,
        totalValue: 0,
        totalProfit: 0,
        totalProfitPercent: 0,
        dayChange: 0,
        dayChangePercent: 0,
        investments: [],
      };
    }

    // Calcula rentabilidade de cada investimento
    const profitabilities = await Promise.all(
      investments.map((inv) => this.calculateInvestmentProfitability(inv.id, userId))
    );

    // Consolida os totais
    const totalInvested = profitabilities.reduce((sum, p) => sum + p.investedAmount, 0);
    const totalValue = profitabilities.reduce((sum, p) => sum + p.currentValue, 0);
    const totalProfit = totalValue - totalInvested;
    const totalProfitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
    const dayChange = profitabilities.reduce((sum, p) => sum + p.dayChange, 0);
    const dayChangePercent = totalValue > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0;

    return {
      totalInvested,
      totalValue,
      totalProfit,
      totalProfitPercent,
      dayChange,
      dayChangePercent,
      investments: profitabilities,
    };
  }

  /**
   * Atualiza os preços de todos os investimentos de um usuário
   */
  async updateAllPrices(userId: string): Promise<{ updated: number; failed: number }> {
    const investments = await this.prisma.investment.findMany({
      where: { userId },
    });

    let updated = 0;
    let failed = 0;

    for (const investment of investments) {
      try {
        let currentPrice = 0;

        if (investment.type === 'CRYPTO') {
          const cryptoData = await this.marketDataService.getCryptoData(investment.ticker || '');
          const usdToBrl = await this.currencyService.getExchangeRate('USD', 'BRL');
          currentPrice = cryptoData.currentPrice * usdToBrl;
        } else if (investment.type === 'STOCK_US' || investment.type === 'STOCK_BR') {
          const stockData = await this.marketDataService.getStockData(investment.ticker || '');
          currentPrice = stockData.price;

          if (investment.type === 'STOCK_US' && stockData.currency === 'USD') {
            const usdToBrl = await this.currencyService.getExchangeRate('USD', 'BRL');
            currentPrice = currentPrice * usdToBrl;
          }
        }

        if (currentPrice > 0) {
          await this.prisma.investment.update({
            where: { id: investment.id },
            data: { currentPrice },
          });
          updated++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Erro ao atualizar preço de ${investment.ticker || 'N/A'}: ${errorMessage}`
        );
        failed++;
      }
    }

    this.logger.log(`Atualização de preços: ${updated} sucesso, ${failed} falhas`);

    return { updated, failed };
  }
}
