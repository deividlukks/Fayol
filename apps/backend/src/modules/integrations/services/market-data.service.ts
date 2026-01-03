import { Injectable, Logger } from '@nestjs/common';
import yahooFinance from 'yahoo-finance2';

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);

  /**
   * Busca o preço atual de um ativo
   * @param ticker Ex: AAPL, PETR4.SA
   */
  async getCurrentPrice(ticker: string): Promise<number> {
    try {
      // Ajuste para ativos brasileiros se não tiver sufixo
      const symbol = this.normalizeTicker(ticker);

      // Chamada Real (Yahoo Finance)
      // Cast como any para evitar problemas de tipagem do módulo yahoo-finance2
      const quote = (await yahooFinance.quote(symbol)) as any;

      if (!quote || !quote.regularMarketPrice) {
        throw new Error(`Preço não encontrado para ${symbol}`);
      }

      return quote.regularMarketPrice;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro ao buscar cotação para ${ticker}: ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }

  /**
   * Dados de crypto: preço atual e variação 24h
   */
  async getCryptoData(
    ticker: string
  ): Promise<{
    currentPrice: number;
    priceChange24h: number;
    priceChangePercent24h: number;
    symbol?: string;
  }> {
    try {
      const symbol = `${ticker}-USD`;
      const quote = (await yahooFinance.quote(symbol)) as any;

      if (!quote || !quote.regularMarketPrice) {
        throw new Error(`Crypto não encontrada: ${symbol}`);
      }

      return {
        symbol,
        currentPrice: Number(quote.regularMarketPrice || 0),
        priceChange24h: Number(quote.regularMarketChange || 0),
        priceChangePercent24h: Number(quote.regularMarketChangePercent || 0),
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro ao buscar crypto ${ticker}: ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }

  /**
   * Dados de ação/stock: preço, variação e moeda
   */
  async getStockData(
    ticker: string
  ): Promise<{ price: number; change: number; changePercent: number; currency?: string }> {
    try {
      const symbol = this.normalizeTicker(ticker);
      const quote = (await yahooFinance.quote(symbol)) as any;

      if (!quote || !quote.regularMarketPrice) {
        throw new Error(`Ação não encontrada: ${symbol}`);
      }

      const currency =
        quote.currency || quote.financialCurrency || (quote.price && quote.price.currency) || 'USD';

      return {
        price: Number(quote.regularMarketPrice || 0),
        change: Number(quote.regularMarketChange || 0),
        changePercent: Number(quote.regularMarketChangePercent || 0),
        currency,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro ao buscar stock ${ticker}: ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }

  /**
   * Busca taxa de câmbio entre duas moedas (ex: USD, BRL)
   */
  async getCurrencyRate(baseCurrency: string, targetCurrency: string): Promise<number> {
    try {
      const pair = `${baseCurrency}${targetCurrency}=X`;
      const quote = (await yahooFinance.quote(pair)) as any;

      if (!quote || !quote.regularMarketPrice) {
        throw new Error(`Taxa não encontrada para ${pair}`);
      }

      return Number(quote.regularMarketPrice || 0);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro ao buscar taxa ${baseCurrency}/${targetCurrency}: ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }

  /**
   * Busca várias cotações de uma vez e retorna um mapa ticker -> preço
   */
  async getMultipleQuotes(tickers: string[]): Promise<Record<string, number>> {
    const results: Record<string, number> = {};
    await Promise.all(
      tickers.map(async (t) => {
        try {
          const price = await this.getCurrentPrice(t);
          results[t] = price;
        } catch (err) {
          this.logger.warn(`Falha ao buscar cotação para ${t}: ${(err as Error).message}`);
          results[t] = 0;
        }
      })
    );
    return results;
  }

  private normalizeTicker(ticker: string): string {
    // Regra simples: Se for 5 ou 6 letras e terminar com número (ex: PETR4), adiciona .SA
    if (/^[A-Z]{4}[0-9]{1,2}$/.test(ticker)) {
      return `${ticker}.SA`;
    }
    return ticker;
  }
}
