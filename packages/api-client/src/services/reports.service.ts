import { HttpClient } from '../http-client';
import { ApiResponse } from '@fayol/shared-types';
import { GetReportInput } from '@fayol/validation-schemas';

export class ReportsService extends HttpClient {
  constructor() {
    super({ baseURL: 'http://localhost:3333/api/reports', enableRetry: true, enableCache: true });
  }

  async getSummary(params?: GetReportInput): Promise<ApiResponse<any>> {
    return this.get<ApiResponse<any>>('/summary', { params });
  }

  async getExpensesByCategory(params?: GetReportInput): Promise<ApiResponse<any>> {
    return this.get<ApiResponse<any>>('/expenses-by-category', { params });
  }

  async getCashFlow(params?: GetReportInput): Promise<ApiResponse<any>> {
    return this.get<ApiResponse<any>>('/cash-flow', { params });
  }

  async getInsights(): Promise<ApiResponse<any>> {
    return this.get<ApiResponse<any>>('/insights');
  }

  // Retorna Blob para download
  async exportReport(params: any): Promise<Blob> {
    const response = await this.api.get('/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  }
}

export const reportsService = new ReportsService();
