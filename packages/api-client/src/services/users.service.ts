import { HttpClient } from '../http-client';
import { ApiResponse, User } from '@fayol/shared-types';
import { UpdateUserInput } from '@fayol/validation-schemas';

// DTO específico para o passo de onboarding
interface UpdateOnboardingInput {
  step: number;
  name?: string;
  investorProfile?: string;
  phoneNumber?: string;
}

export class UsersService extends HttpClient {
  constructor() {
    super({ baseURL: 'http://localhost:3333/api/users', enableRetry: true, enableCache: true });
  }

  async findOne(id: string): Promise<ApiResponse<User>> {
    return this.get<ApiResponse<User>>(`/${id}`);
  }

  async update(id: string, data: UpdateUserInput): Promise<ApiResponse<User>> {
    return this.patch<ApiResponse<User>>(`/${id}`, data);
  }

  async updateOnboarding(data: UpdateOnboardingInput): Promise<ApiResponse<User>> {
    return this.patch<ApiResponse<User>>('/onboarding/step', data);
  }
}

export const usersService = new UsersService();
