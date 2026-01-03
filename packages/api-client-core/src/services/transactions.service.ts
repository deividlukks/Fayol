import { BaseService } from './base.service';
import { ApiResponse, Transaction } from '@fayol/shared-types';
import { IStorageAdapter } from '../storage.interface';

/**
 * Transactions Service
 *
 * Gerencia transações financeiras (income, expense, transfer)
 */
export class TransactionsService extends BaseService<Transaction> {
  constructor(storage: IStorageAdapter, baseURL: string = 'http://localhost:3333/api/transactions') {
    super(storage, baseURL, true); // Com cache
  }

  /**
   * Exporta transações para CSV
   */
  async exportCSV(params?: Record<string, unknown>): Promise<Blob> {
    return this.get<Blob>('/export/csv', {
      params,
      responseType: 'blob',
    });
  }

  /**
   * Exporta transações para Excel
   */
  async exportExcel(params?: Record<string, unknown>): Promise<Blob> {
    return this.get<Blob>('/export/excel', {
      params,
      responseType: 'blob',
    });
  }

  /**
   * Obtém resumo de transações
   */
  async getSummary(params?: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>('/summary', { params });
  }

  /**
   * Categoriza transação automaticamente (IA)
   */
  async autoCategorizeby(id: string): Promise<ApiResponse<Transaction>> {
    return this.post<ApiResponse<Transaction>>(`/${id}/auto-categorize`, {});
  }

  /**
   * Duplica uma transação
   */
  async duplicate(id: string): Promise<ApiResponse<Transaction>> {
    return this.post<ApiResponse<Transaction>>(`/${id}/duplicate`, {});
  }
}
