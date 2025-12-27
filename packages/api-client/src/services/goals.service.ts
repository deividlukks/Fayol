import { HttpClient } from '../http-client';
import { ApiResponse, Goal } from '@fayol/shared-types';
import { CreateGoalInput, UpdateGoalInput } from '@fayol/validation-schemas';

export class GoalsService extends HttpClient {
  constructor() {
    super({ baseURL: 'http://localhost:3333/api/goals', enableRetry: true, enableCache: true });
  }

  async findAll(): Promise<ApiResponse<Goal[]>> {
    return this.get<ApiResponse<Goal[]>>('/');
  }

  async create(data: CreateGoalInput): Promise<ApiResponse<Goal>> {
    return this.post<ApiResponse<Goal>>('/', data);
  }

  async updateAmount(id: string, amount: number): Promise<ApiResponse<Goal>> {
    return this.patch<ApiResponse<Goal>>(`/${id}/amount`, { amount });
  }

  async remove(id: string): Promise<ApiResponse<void>> {
    return this.delete<ApiResponse<void>>(`/${id}`);
  }
}

export const goalsService = new GoalsService();
