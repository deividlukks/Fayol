import { HttpClient } from '../http-client';
import { ApiResponse, Transaction } from '@fayol/shared-types';
import { CreateTransactionInput, UpdateTransactionInput } from '@fayol/validation-schemas';

export class TransactionsService extends HttpClient {
  constructor() {
    super({ baseURL: 'http://localhost:3333/api/transactions', enableRetry: true, enableCache: true });
  }

  async findAll(): Promise<ApiResponse<Transaction[]>> {
    return this.get<ApiResponse<Transaction[]>>('/');
  }

  async findOne(id: string): Promise<ApiResponse<Transaction>> {
    return this.get<ApiResponse<Transaction>>(`/${id}`);
  }

  async create(data: CreateTransactionInput): Promise<ApiResponse<Transaction>> {
    return this.post<ApiResponse<Transaction>>('/', data);
  }

  async update(id: string, data: UpdateTransactionInput): Promise<ApiResponse<Transaction>> {
    return this.patch<ApiResponse<Transaction>>(`/${id}`, data);
  }

  async remove(id: string): Promise<ApiResponse<void>> {
    return this.delete<ApiResponse<void>>(`/${id}`);
  }
}

export const transactionsService = new TransactionsService();
