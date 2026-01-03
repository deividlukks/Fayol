import { HttpClient } from '../http-client';
import { ApiResponse, Account } from '@fayol/shared-types';
import { CreateAccountInput, UpdateAccountInput } from '@fayol/validation-schemas';

export class AccountsService extends HttpClient {
  constructor() {
    super({
      baseURL: 'http://localhost:3333/api/accounts',
      enableRetry: true,
      enableCache: true, // Habilita cache para accounts
    });
  }

  async findAll(): Promise<ApiResponse<Account[]>> {
    return this.get<ApiResponse<Account[]>>('/');
  }

  async findOne(id: string): Promise<ApiResponse<Account>> {
    return this.get<ApiResponse<Account>>(`/${id}`);
  }

  async create(data: CreateAccountInput): Promise<ApiResponse<Account>> {
    return this.post<ApiResponse<Account>>('/', data);
  }

  async update(id: string, data: UpdateAccountInput): Promise<ApiResponse<Account>> {
    return this.patch<ApiResponse<Account>>(`/${id}`, data);
  }

  async remove(id: string): Promise<ApiResponse<void>> {
    return this.delete<ApiResponse<void>>(`/${id}`);
  }
}

export const accountsService = new AccountsService();
