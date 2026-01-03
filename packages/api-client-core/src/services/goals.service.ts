import { BaseService } from './base.service';
import { ApiResponse } from '@fayol/shared-types';
import { IStorageAdapter } from '../storage.interface';

/**
 * Goals Service
 *
 * Gerencia metas financeiras
 */
export class GoalsService extends BaseService {
  constructor(storage: IStorageAdapter, baseURL: string = 'http://localhost:3333/api/goals') {
    super(storage, baseURL, true); // Com cache
  }

  /**
   * Atualiza valor acumulado em meta
   */
  async updateAmount(id: string, amount: number): Promise<ApiResponse<unknown>> {
    return this.patch<ApiResponse<unknown>>(`/${id}/amount`, { amount });
  }

  /**
   * Adiciona valor à meta
   */
  async addAmount(id: string, amount: number): Promise<ApiResponse<unknown>> {
    return this.post<ApiResponse<unknown>>(`/${id}/add`, { amount });
  }
}
