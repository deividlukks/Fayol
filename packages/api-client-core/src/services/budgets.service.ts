import { BaseService } from './base.service';
import { ApiResponse } from '@fayol/shared-types';
import { IStorageAdapter } from '../storage.interface';

/**
 * Budgets Service
 *
 * Gerencia orçamentos e alertas de limite
 */
export class BudgetsService extends BaseService {
  constructor(storage: IStorageAdapter, baseURL: string = 'http://localhost:3333/api/budgets') {
    super(storage, baseURL, true); // Com cache
  }

  /**
   * Obtém progresso de todos os orçamentos
   */
  async getProgress(): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>('/progress/all');
  }

  /**
   * Obtém alertas ativos
   */
  async getAlerts(): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>('/alerts/active');
  }
}
