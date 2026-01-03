/**
 * Mobile Services
 *
 * Services adaptados para React Native que utilizam HttpClientMobile
 * para armazenamento seguro de tokens com expo-secure-store
 */

import { HttpClientMobile } from '../http-client.mobile';
import { ApiResponse, User } from '@fayol/shared-types';
import { LoginInput, RegisterInput } from '@fayol/validation-schemas';

// Re-export tipos e interfaces do api-client original
export * from '@fayol/api-client/src/errors';

// ==================== AUTH SERVICE ====================
interface LoginResponse {
  access_token: string;
  user: User;
}

interface CheckUserResponse {
  exists: boolean;
  name?: string;
  email?: string;
}

export class AuthServiceMobile extends HttpClientMobile {
  constructor(baseURL: string = 'http://localhost:3333/api/auth') {
    super({
      baseURL,
      enableRetry: true,
      enableCache: false,
    });
  }

  async login(data: LoginInput): Promise<ApiResponse<LoginResponse>> {
    const response = await this.post<ApiResponse<LoginResponse>>('/login', data);

    // Auto-armazena o token após login bem-sucedido
    if (response.success && response.data?.access_token) {
      await this.setToken(response.data.access_token);
      if (response.data.user) {
        await this.setUser(response.data.user);
      }
    }

    return response;
  }

  async register(data: RegisterInput): Promise<ApiResponse<User>> {
    return this.post<ApiResponse<User>>('/register', data);
  }

  async checkUser(identifier: string): Promise<ApiResponse<CheckUserResponse>> {
    return this.post<ApiResponse<CheckUserResponse>>('/check', { identifier });
  }

  async logout(): Promise<void> {
    try {
      await this.post('/logout', {});
    } catch (error) {
      console.warn('[AuthService] Logout request failed:', error);
    } finally {
      // Limpa dados locais independentemente do resultado da API
      await this.clearToken();
    }
  }

  async me(): Promise<ApiResponse<{ user: User }>> {
    return this.get<ApiResponse<{ user: User }>>('/me');
  }
}

// ==================== TRANSACTIONS SERVICE ====================
export class TransactionsServiceMobile extends HttpClientMobile {
  constructor(baseURL: string = 'http://localhost:3333/api/transactions') {
    super({
      baseURL,
      enableRetry: true,
      enableCache: true,
    });
  }

  async findAll(params?: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>('/', { params });
  }

  async findOne(id: string): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>(`/${id}`);
  }

  async create(data: unknown): Promise<ApiResponse<unknown>> {
    return this.post<ApiResponse<unknown>>('/', data);
  }

  async update(id: string, data: unknown): Promise<ApiResponse<unknown>> {
    return this.patch<ApiResponse<unknown>>(`/${id}`, data);
  }

  async remove(id: string): Promise<ApiResponse<unknown>> {
    return this.delete<ApiResponse<unknown>>(`/${id}`);
  }

  async exportCSV(): Promise<Blob> {
    return this.get<Blob>('/export/csv', {
      responseType: 'blob',
    });
  }
}

// ==================== ACCOUNTS SERVICE ====================
export class AccountsServiceMobile extends HttpClientMobile {
  constructor(baseURL: string = 'http://localhost:3333/api/accounts') {
    super({
      baseURL,
      enableRetry: true,
      enableCache: true,
    });
  }

  async findAll(): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>('/');
  }

  async findOne(id: string): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>(`/${id}`);
  }

  async create(data: unknown): Promise<ApiResponse<unknown>> {
    return this.post<ApiResponse<unknown>>('/', data);
  }

  async update(id: string, data: unknown): Promise<ApiResponse<unknown>> {
    return this.patch<ApiResponse<unknown>>(`/${id}`, data);
  }

  async remove(id: string): Promise<ApiResponse<unknown>> {
    return this.delete<ApiResponse<unknown>>(`/${id}`);
  }
}

// ==================== BUDGETS SERVICE ====================
export class BudgetsServiceMobile extends HttpClientMobile {
  constructor(baseURL: string = 'http://localhost:3333/api/budgets') {
    super({
      baseURL,
      enableRetry: true,
      enableCache: true,
    });
  }

  async findAll(): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>('/');
  }

  async findOne(id: string): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>(`/${id}`);
  }

  async create(data: unknown): Promise<ApiResponse<unknown>> {
    return this.post<ApiResponse<unknown>>('/', data);
  }

  async update(id: string, data: unknown): Promise<ApiResponse<unknown>> {
    return this.patch<ApiResponse<unknown>>(`/${id}`, data);
  }

  async remove(id: string): Promise<ApiResponse<unknown>> {
    return this.delete<ApiResponse<unknown>>(`/${id}`);
  }

  async getProgress(): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>('/progress/all');
  }

  async getAlerts(): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>('/alerts/active');
  }
}

// ==================== CATEGORIES SERVICE ====================
export class CategoriesServiceMobile extends HttpClientMobile {
  constructor(baseURL: string = 'http://localhost:3333/api/categories') {
    super({
      baseURL,
      enableRetry: true,
      enableCache: true,
    });
  }

  async findAll(): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>('/');
  }

  async findOne(id: string): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>(`/${id}`);
  }

  async create(data: unknown): Promise<ApiResponse<unknown>> {
    return this.post<ApiResponse<unknown>>('/', data);
  }

  async update(id: string, data: unknown): Promise<ApiResponse<unknown>> {
    return this.patch<ApiResponse<unknown>>(`/${id}`, data);
  }

  async remove(id: string): Promise<ApiResponse<unknown>> {
    return this.delete<ApiResponse<unknown>>(`/${id}`);
  }
}

// ==================== GOALS SERVICE ====================
export class GoalsServiceMobile extends HttpClientMobile {
  constructor(baseURL: string = 'http://localhost:3333/api/goals') {
    super({
      baseURL,
      enableRetry: true,
      enableCache: true,
    });
  }

  async findAll(): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>('/');
  }

  async findOne(id: string): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>(`/${id}`);
  }

  async create(data: unknown): Promise<ApiResponse<unknown>> {
    return this.post<ApiResponse<unknown>>('/', data);
  }

  async update(id: string, data: unknown): Promise<ApiResponse<unknown>> {
    return this.patch<ApiResponse<unknown>>(`/${id}`, data);
  }

  async remove(id: string): Promise<ApiResponse<unknown>> {
    return this.delete<ApiResponse<unknown>>(`/${id}`);
  }

  async updateAmount(id: string, amount: number): Promise<ApiResponse<unknown>> {
    return this.patch<ApiResponse<unknown>>(`/${id}/amount`, { amount });
  }
}

// ==================== REPORTS SERVICE ====================
export class ReportsServiceMobile extends HttpClientMobile {
  constructor(baseURL: string = 'http://localhost:3333/api/reports') {
    super({
      baseURL,
      enableRetry: true,
      enableCache: true,
    });
  }

  async getSummary(): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>('/summary');
  }

  async getExpensesByCategory(params?: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>('/expenses-by-category', { params });
  }

  async getCashFlow(params?: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>('/cash-flow', { params });
  }

  async getInsights(): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>('/insights');
  }

  async getMonthlyEvolution(): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>('/charts/monthly-evolution');
  }

  async getExpensesPie(): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>('/charts/expenses-pie');
  }
}

// ==================== INVESTMENTS SERVICE ====================
export class InvestmentsServiceMobile extends HttpClientMobile {
  constructor(baseURL: string = 'http://localhost:3333/api/investments') {
    super({
      baseURL,
      enableRetry: true,
      enableCache: true,
    });
  }

  async findAll(): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>('/');
  }

  async findOne(id: string): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>(`/${id}`);
  }

  async create(data: unknown): Promise<ApiResponse<unknown>> {
    return this.post<ApiResponse<unknown>>('/', data);
  }

  async update(id: string, data: unknown): Promise<ApiResponse<unknown>> {
    return this.patch<ApiResponse<unknown>>(`/${id}`, data);
  }

  async remove(id: string): Promise<ApiResponse<unknown>> {
    return this.delete<ApiResponse<unknown>>(`/${id}`);
  }

  async getPortfolioProfitability(): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>('/profitability/portfolio');
  }

  async getInvestmentProfitability(id: string): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>(`/profitability/${id}`);
  }

  async lookupAsset(ticker: string): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>(`/lookup/${ticker}`);
  }
}

// ==================== TRADING SERVICE ====================
export class TradingServiceMobile extends HttpClientMobile {
  constructor(baseURL: string = 'http://localhost:3333/api/trading') {
    super({
      baseURL,
      enableRetry: true,
      enableCache: true,
    });
  }

  async getPortfolio(): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>('/portfolio');
  }

  async getTrades(ticker?: string): Promise<ApiResponse<unknown>> {
    return this.get<ApiResponse<unknown>>(ticker ? `/trades/${ticker}` : '/trades');
  }

  async createTrade(data: unknown): Promise<ApiResponse<unknown>> {
    return this.post<ApiResponse<unknown>>('/trades', data);
  }
}

// ==================== USERS SERVICE ====================
export class UsersServiceMobile extends HttpClientMobile {
  constructor(baseURL: string = 'http://localhost:3333/api/users') {
    super({
      baseURL,
      enableRetry: true,
      enableCache: false,
    });
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.get<ApiResponse<User>>('/profile');
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return this.patch<ApiResponse<User>>('/profile', data);
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<unknown>> {
    return this.patch<ApiResponse<unknown>>('/password', data);
  }
}

// ==================== SINGLETON INSTANCES ====================
const API_BASE_URL = process.env.API_URL || 'http://localhost:3333/api';

export const authService = new AuthServiceMobile(`${API_BASE_URL}/auth`);
export const transactionsService = new TransactionsServiceMobile(`${API_BASE_URL}/transactions`);
export const accountsService = new AccountsServiceMobile(`${API_BASE_URL}/accounts`);
export const budgetsService = new BudgetsServiceMobile(`${API_BASE_URL}/budgets`);
export const categoriesService = new CategoriesServiceMobile(`${API_BASE_URL}/categories`);
export const goalsService = new GoalsServiceMobile(`${API_BASE_URL}/goals`);
export const reportsService = new ReportsServiceMobile(`${API_BASE_URL}/reports`);
export const investmentsService = new InvestmentsServiceMobile(`${API_BASE_URL}/investments`);
export const tradingService = new TradingServiceMobile(`${API_BASE_URL}/trading`);
export const usersService = new UsersServiceMobile(`${API_BASE_URL}/users`);
