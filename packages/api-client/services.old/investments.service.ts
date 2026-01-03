import { HttpClient } from '../http-client';
import { ApiResponse, Investment } from '@fayol/shared-types';
import { CreateInvestmentInput, UpdateInvestmentInput } from '@fayol/validation-schemas';

export class InvestmentsService extends HttpClient {
  constructor() {
    super({ baseURL: 'http://localhost:3333/api/investments', enableRetry: true, enableCache: true });
  }

  async findAll(): Promise<ApiResponse<Investment[]>> {
    return this.get<ApiResponse<Investment[]>>('/');
  }

  async findOne(id: string): Promise<ApiResponse<Investment>> {
    return this.get<ApiResponse<Investment>>(`/${id}`);
  }

  async create(data: CreateInvestmentInput): Promise<ApiResponse<Investment>> {
    return this.post<ApiResponse<Investment>>('/', data);
  }

  async update(id: string, data: UpdateInvestmentInput): Promise<ApiResponse<Investment>> {
    return this.patch<ApiResponse<Investment>>(`/${id}`, data);
  }

  async remove(id: string): Promise<ApiResponse<void>> {
    return this.delete<ApiResponse<void>>(`/${id}`);
  }

  async lookup(ticker: string): Promise<ApiResponse<any>> {
    return this.get<ApiResponse<any>>(`/lookup/${ticker}`);
  }
}

export const investmentsService = new InvestmentsService();
