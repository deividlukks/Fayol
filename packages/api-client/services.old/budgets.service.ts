import { HttpClient } from '../http-client';
import { ApiResponse, Budget } from '@fayol/shared-types';
import { CreateBudgetInput, UpdateBudgetInput } from '@fayol/validation-schemas';

export class BudgetsService extends HttpClient {
  constructor() {
    super({ baseURL: 'http://localhost:3333/api/budgets', enableRetry: true, enableCache: true });
  }

  async findAll(): Promise<ApiResponse<Budget[]>> {
    return this.get<ApiResponse<Budget[]>>('/');
  }

  async findOne(id: string): Promise<ApiResponse<Budget>> {
    return this.get<ApiResponse<Budget>>(`/${id}`);
  }

  async create(data: CreateBudgetInput): Promise<ApiResponse<Budget>> {
    return this.post<ApiResponse<Budget>>('/', data);
  }

  async update(id: string, data: UpdateBudgetInput): Promise<ApiResponse<Budget>> {
    return this.patch<ApiResponse<Budget>>(`/${id}`, data);
  }

  async remove(id: string): Promise<ApiResponse<void>> {
    return this.delete<ApiResponse<void>>(`/${id}`);
  }
}

export const budgetsService = new BudgetsService();
