import { HttpClient } from '../http-client';
import { ApiResponse, TradeType } from '@fayol/shared-types';

export interface CreateTradeInput {
  symbol: string;
  type: TradeType;
  quantity: number;
  price: number;
  date: Date | string;
  fees?: number;
  accountId: string;
}

export interface PortfolioItem {
  id: string;
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  currentTotal: number;
  costTotal: number;
  unrealizedPnl: number; // Lucro/Prejuízo não realizado (R$)
  unrealizedPnlPercent: number; // Lucro/Prejuízo não realizado (%)
}

export interface Trade {
  id: string;
  symbol: string;
  type: TradeType;
  quantity: number;
  price: number;
  totalAmount: number;
  date: string;
  realizedPnl?: number;
}

export class TradingService extends HttpClient {
  constructor() {
    super({ baseURL: 'http://localhost:3333/api/trading' });
  }

  async getPortfolio(): Promise<ApiResponse<PortfolioItem[]>> {
    return this.get<ApiResponse<PortfolioItem[]>>('/portfolio');
  }

  async getHistory(): Promise<ApiResponse<Trade[]>> {
    return this.get<ApiResponse<Trade[]>>('/history');
  }

  async createTrade(data: CreateTradeInput): Promise<ApiResponse<Trade>> {
    return this.post<ApiResponse<Trade>>('/trades', data);
  }
}

export const tradingService = new TradingService();