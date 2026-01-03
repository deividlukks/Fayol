import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: Date;
  currency: string;
}

export interface HistoricalData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);
  private readonly alphaVantageKey: string;
  private readonly brapiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.alphaVantageKey = this.configService.get('ALPHA_VANTAGE_API_KEY', '');
    this.brapiKey = this.configService.get('BRAPI_API_KEY', '');
  }

  async getBrazilianStockQuote(ticker: string): Promise<StockQuote> {
    try {
      const url = `https://brapi.dev/api/quote/${ticker}`;
      const params = this.brapiKey ? { token: this.brapiKey } : {};

      const response = await firstValueFrom(this.httpService.get(url, { params }));
      const data = response.data.results[0];

      return {
        symbol: data.symbol,
        price: data.regularMarketPrice,
        change: data.regularMarketChange,
        changePercent: data.regularMarketChangePercent,
        volume: data.regularMarketVolume,
        timestamp: new Date(data.regularMarketTime),
        currency: data.currency,
      };
    } catch (error: any) {
      this.logger.error(`Erro ao buscar cotação de ${ticker}:`, error);
      throw new Error(`Não foi possível buscar cotação de ${ticker}`);
    }
  }

  async getMultipleQuotes(tickers: string[]): Promise<StockQuote[]> {
    try {
      const tickersStr = tickers.join(',');
      const url = `https://brapi.dev/api/quote/${tickersStr}`;
      const params = this.brapiKey ? { token: this.brapiKey } : {};

      const response = await firstValueFrom(this.httpService.get(url, { params }));

      return response.data.results.map((data: any) => ({
        symbol: data.symbol,
        price: data.regularMarketPrice,
        change: data.regularMarketChange,
        changePercent: data.regularMarketChangePercent,
        volume: data.regularMarketVolume,
        timestamp: new Date(data.regularMarketTime),
        currency: data.currency,
      }));
    } catch (error: any) {
      this.logger.error('Erro ao buscar cotações múltiplas:', error);
      throw new Error('Não foi possível buscar cotações');
    }
  }

  async getHistoricalData(
    ticker: string,
    range: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | 'max' = '1mo'
  ): Promise<HistoricalData[]> {
    try {
      const url = `https://brapi.dev/api/quote/${ticker}`;
      const params = {
        range,
        interval: '1d',
        ...(this.brapiKey && { token: this.brapiKey }),
      };

      const response = await firstValueFrom(this.httpService.get(url, { params }));
      const historical = response.data.results[0]?.historicalDataPrice || [];

      return historical.map((item: any) => ({
        date: new Date(item.date * 1000),
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,
      }));
    } catch (error: any) {
      this.logger.error(`Erro ao buscar dados históricos de ${ticker}:`, error);
      throw new Error(`Não foi possível buscar dados históricos de ${ticker}`);
    }
  }

  async getGlobalStockQuote(symbol: string): Promise<StockQuote> {
    if (!this.alphaVantageKey) {
      throw new Error('ALPHA_VANTAGE_API_KEY não configurada');
    }

    try {
      const url = 'https://www.alphavantage.co/query';
      const params = {
        function: 'GLOBAL_QUOTE',
        symbol,
        apikey: this.alphaVantageKey,
      };

      const response = await firstValueFrom(this.httpService.get(url, { params }));
      const data = response.data['Global Quote'];

      return {
        symbol: data['01. symbol'],
        price: parseFloat(data['05. price']),
        change: parseFloat(data['09. change']),
        changePercent: parseFloat(data['10. change percent'].replace('%', '')),
        volume: parseInt(data['06. volume']),
        timestamp: new Date(data['07. latest trading day']),
        currency: 'USD',
      };
    } catch (error: any) {
      this.logger.error(`Erro ao buscar cotação global de ${symbol}:`, error);
      throw new Error(`Não foi possível buscar cotação de ${symbol}`);
    }
  }

  async getAssetInfo(ticker: string): Promise<any> {
    try {
      const url = `https://brapi.dev/api/quote/${ticker}`;
      const params = {
        fundamental: true,
        ...(this.brapiKey && { token: this.brapiKey }),
      };

      const response = await firstValueFrom(this.httpService.get(url, { params }));
      return response.data.results[0];
    } catch (error: any) {
      this.logger.error(`Erro ao buscar informações de ${ticker}:`, error);
      throw new Error(`Não foi possível buscar informações de ${ticker}`);
    }
  }

  calculateAveragePrice(trades: Array<{ type: 'BUY' | 'SELL'; quantity: number; price: number }>): {
    averagePrice: number;
    totalQuantity: number;
  } {
    let totalCost = 0;
    let totalQuantity = 0;

    for (const trade of trades) {
      if (trade.type === 'BUY') {
        totalCost += trade.quantity * trade.price;
        totalQuantity += trade.quantity;
      } else if (trade.type === 'SELL') {
        totalQuantity -= trade.quantity;
      }
    }

    const averagePrice = totalQuantity > 0 ? totalCost / totalQuantity : 0;

    return {
      averagePrice: Math.round(averagePrice * 100) / 100,
      totalQuantity,
    };
  }

  calculateRealizedPnL(
    sellTrades: Array<{ quantity: number; price: number }>,
    averageBuyPrice: number
  ): number {
    let totalPnL = 0;

    for (const trade of sellTrades) {
      const costBasis = trade.quantity * averageBuyPrice;
      const saleValue = trade.quantity * trade.price;
      totalPnL += saleValue - costBasis;
    }

    return Math.round(totalPnL * 100) / 100;
  }

  calculateUnrealizedPnL(quantity: number, averageBuyPrice: number, currentPrice: number): number {
    const costBasis = quantity * averageBuyPrice;
    const currentValue = quantity * currentPrice;
    const unrealizedPnL = currentValue - costBasis;

    return Math.round(unrealizedPnL * 100) / 100;
  }
}
