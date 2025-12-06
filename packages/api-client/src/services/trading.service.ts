import { HttpClient } from '../http-client';
import { ApiResponse } from '@fayol/shared-types';
import { CreateTradeInput } from '@fayol/validation-schemas';

export class TradingService extends HttpClient {
  constructor() {
    super('http://localhost:3333/api/trading');
  }

  async createOrder(data: CreateTradeInput): Promise<ApiResponse<any>> {
    return this.post<ApiResponse<any>>('/order', data);
  }
}

export const tradingService = new TradingService();
