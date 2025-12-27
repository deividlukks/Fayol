import { HttpClient } from '../http-client';
import { ApiResponse, User } from '@fayol/shared-types';
import { LoginInput, RegisterInput } from '@fayol/validation-schemas';

interface LoginResponse {
  access_token: string;
  user: User;
}

interface CheckUserResponse {
  exists: boolean;
  name?: string;
  email?: string;
}

export class AuthService extends HttpClient {
  constructor() {
    super({
      baseURL: 'http://localhost:3333/api/auth',
      enableRetry: true,
      enableCache: false, // Auth não usa cache
    });
  }

  async login(data: LoginInput): Promise<ApiResponse<LoginResponse>> {
    return this.post<ApiResponse<LoginResponse>>('/login', data);
  }

  async register(data: RegisterInput): Promise<ApiResponse<User>> {
    return this.post<ApiResponse<User>>('/register', data);
  }

  async checkUser(identifier: string): Promise<ApiResponse<CheckUserResponse>> {
    return this.post<ApiResponse<CheckUserResponse>>('/check', { identifier });
  }
}

export const authService = new AuthService();
