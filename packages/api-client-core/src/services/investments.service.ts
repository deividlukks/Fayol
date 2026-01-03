import { BaseService } from './base.service';
import { ApiResponse } from '@fayol/shared-types';
import { IStorageAdapter } from '../storage.interface';

/**
 * Investments Service
 *
 * Gerencia carteira de investimentos
 */
export class InvestmentsService extends BaseService {
  constructor(storage: IStorageAdapter, baseURL: string = 'http://localhost:3333/api/investments') {
    super(storage, baseURL, true); // Com cache
  }

  /**
   * Obtém rentabilidade do portfólio
   */
  async getPortfolioProfitability(): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>('/profitability/portfolio');
  }

  /**
   * Obtém rentabilidade de investimento específico
   */
  async getInvestmentProfitability(id: string): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>(`/profitability/${id}`);
  }

  /**
   * Busca informações de ativo (ticker)
   */
  async lookupAsset(ticker: string): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>(`/lookup/${ticker}`);
  }
}
