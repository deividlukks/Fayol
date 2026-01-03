import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: Date;
}

export interface StockTimeSeries {
  symbol: string;
  data: {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
}

export interface CryptoQuote {
  symbol: string;
  price: number;
  marketCap: number;
  volume24h: number;
  changePercent24h: number;
}

@Injectable()
export class AlphaVantageService {
  private readonly logger = new Logger(AlphaVantageService.name);
  private readonly client: AxiosInstance;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ALPHA_VANTAGE_API_KEY') || 'demo';

    this.client = axios.create({
      baseURL: 'https://www.alphavantage.co/query',
      timeout: 10000,
    });
  }

  /**
   * Obtém cotação em tempo real de uma ação
   */
  async getStockQuote(symbol: string): Promise<StockQuote> {
    try {
      const response = await this.client.get('', {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol.toUpperCase(),
          apikey: this.apiKey,
        },
      });

      const quote = response.data['Global Quote'];

      if (!quote || Object.keys(quote).length === 0) {
        throw new Error('No data found for symbol');
      }

      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        timestamp: new Date(quote['07. latest trading day']),
      };
    } catch (error) {
      this.logger.error(`Failed to get stock quote for ${symbol}`, error);
      throw new BadRequestException(`Failed to get stock quote for ${symbol}`);
    }
  }

  /**
   * Obtém série histórica diária de uma ação
   */
  async getDailyTimeSeries(
    symbol: string,
    outputsize: 'compact' | 'full' = 'compact'
  ): Promise<StockTimeSeries> {
    try {
      const response = await this.client.get('', {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol: symbol.toUpperCase(),
          outputsize,
          apikey: this.apiKey,
        },
      });

      const timeSeries = response.data['Time Series (Daily)'];

      if (!timeSeries) {
        throw new Error('No data found for symbol');
      }

      const data = Object.entries(timeSeries).map(([date, values]: [string, any]) => ({
        date,
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseInt(values['5. volume']),
      }));

      return {
        symbol: symbol.toUpperCase(),
        data,
      };
    } catch (error) {
      this.logger.error(`Failed to get daily time series for ${symbol}`, error);
      throw new BadRequestException(`Failed to get daily time series for ${symbol}`);
    }
  }

  /**
   * Obtém série histórica intraday (1, 5, 15, 30, 60 min)
   */
  async getIntradayTimeSeries(
    symbol: string,
    interval: '1min' | '5min' | '15min' | '30min' | '60min' = '5min'
  ): Promise<StockTimeSeries> {
    try {
      const response = await this.client.get('', {
        params: {
          function: 'TIME_SERIES_INTRADAY',
          symbol: symbol.toUpperCase(),
          interval,
          apikey: this.apiKey,
        },
      });

      const key = `Time Series (${interval})`;
      const timeSeries = response.data[key];

      if (!timeSeries) {
        throw new Error('No data found for symbol');
      }

      const data = Object.entries(timeSeries).map(([date, values]: [string, any]) => ({
        date,
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseInt(values['5. volume']),
      }));

      return {
        symbol: symbol.toUpperCase(),
        data,
      };
    } catch (error) {
      this.logger.error(`Failed to get intraday time series for ${symbol}`, error);
      throw new BadRequestException(`Failed to get intraday time series for ${symbol}`);
    }
  }

  /**
   * Busca símbolos (search)
   */
  async searchSymbols(keywords: string): Promise<any[]> {
    try {
      const response = await this.client.get('', {
        params: {
          function: 'SYMBOL_SEARCH',
          keywords,
          apikey: this.apiKey,
        },
      });

      return response.data.bestMatches || [];
    } catch (error) {
      this.logger.error(`Failed to search symbols with keywords: ${keywords}`, error);
      return [];
    }
  }

  /**
   * Obtém cotação de criptomoedas
   */
  async getCryptoQuote(symbol: string, market: string = 'USD'): Promise<CryptoQuote> {
    try {
      const response = await this.client.get('', {
        params: {
          function: 'CURRENCY_EXCHANGE_RATE',
          from_currency: symbol.toUpperCase(),
          to_currency: market.toUpperCase(),
          apikey: this.apiKey,
        },
      });

      const data = response.data['Realtime Currency Exchange Rate'];

      if (!data) {
        throw new Error('No data found for crypto symbol');
      }

      return {
        symbol: data['1. From_Currency Code'],
        price: parseFloat(data['5. Exchange Rate']),
        marketCap: 0, // Alpha Vantage não fornece market cap
        volume24h: 0, // Alpha Vantage não fornece volume 24h
        changePercent24h: 0, // Não disponível nesta API
      };
    } catch (error) {
      this.logger.error(`Failed to get crypto quote for ${symbol}`, error);
      throw new BadRequestException(`Failed to get crypto quote for ${symbol}`);
    }
  }

  /**
   * Obtém série histórica de criptomoedas (diária)
   */
  async getCryptoDailyTimeSeries(symbol: string, market: string = 'USD'): Promise<StockTimeSeries> {
    try {
      const response = await this.client.get('', {
        params: {
          function: 'DIGITAL_CURRENCY_DAILY',
          symbol: symbol.toUpperCase(),
          market: market.toUpperCase(),
          apikey: this.apiKey,
        },
      });

      const timeSeries = response.data['Time Series (Digital Currency Daily)'];

      if (!timeSeries) {
        throw new Error('No data found for crypto symbol');
      }

      const data = Object.entries(timeSeries).map(([date, values]: [string, any]) => ({
        date,
        open: parseFloat(values[`1a. open (${market})`]),
        high: parseFloat(values[`2a. high (${market})`]),
        low: parseFloat(values[`3a. low (${market})`]),
        close: parseFloat(values[`4a. close (${market})`]),
        volume: parseFloat(values['5. volume']),
      }));

      return {
        symbol: `${symbol.toUpperCase()}/${market.toUpperCase()}`,
        data,
      };
    } catch (error) {
      this.logger.error(`Failed to get crypto daily time series for ${symbol}`, error);
      throw new BadRequestException(`Failed to get crypto daily time series for ${symbol}`);
    }
  }

  /**
   * Obtém indicadores técnicos (SMA - Simple Moving Average)
   */
  async getSMA(
    symbol: string,
    interval: string = 'daily',
    timePeriod: number = 20,
    seriesType: string = 'close'
  ): Promise<any> {
    try {
      const response = await this.client.get('', {
        params: {
          function: 'SMA',
          symbol: symbol.toUpperCase(),
          interval,
          time_period: timePeriod,
          series_type: seriesType,
          apikey: this.apiKey,
        },
      });

      return response.data['Technical Analysis: SMA'];
    } catch (error) {
      this.logger.error(`Failed to get SMA for ${symbol}`, error);
      throw new BadRequestException(`Failed to get SMA for ${symbol}`);
    }
  }

  /**
   * Obtém indicadores técnicos (RSI - Relative Strength Index)
   */
  async getRSI(
    symbol: string,
    interval: string = 'daily',
    timePeriod: number = 14,
    seriesType: string = 'close'
  ): Promise<any> {
    try {
      const response = await this.client.get('', {
        params: {
          function: 'RSI',
          symbol: symbol.toUpperCase(),
          interval,
          time_period: timePeriod,
          series_type: seriesType,
          apikey: this.apiKey,
        },
      });

      return response.data['Technical Analysis: RSI'];
    } catch (error) {
      this.logger.error(`Failed to get RSI for ${symbol}`, error);
      throw new BadRequestException(`Failed to get RSI for ${symbol}`);
    }
  }

  /**
   * Obtém taxas de câmbio
   */
  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    try {
      const response = await this.client.get('', {
        params: {
          function: 'CURRENCY_EXCHANGE_RATE',
          from_currency: fromCurrency.toUpperCase(),
          to_currency: toCurrency.toUpperCase(),
          apikey: this.apiKey,
        },
      });

      const data = response.data['Realtime Currency Exchange Rate'];

      if (!data) {
        throw new Error('Exchange rate not found');
      }

      return parseFloat(data['5. Exchange Rate']);
    } catch (error) {
      this.logger.error(`Failed to get exchange rate from ${fromCurrency} to ${toCurrency}`, error);
      throw new BadRequestException('Failed to get exchange rate');
    }
  }
}
