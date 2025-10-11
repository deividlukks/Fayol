import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilters,
  TransactionSummary,
  Account,
  CreateAccountInput,
  UpdateAccountInput,
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
  PaginatedResponse,
  PaginationParams,
} from '@fayol/shared-types';

export interface FayolApiClientConfig {
  baseURL: string;
  timeout?: number;
  onTokenExpired?: () => void;
}

export class FayolApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private onTokenExpired?: () => void;

  constructor(config: FayolApiClientConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.onTokenExpired = config.onTokenExpired;

    // Interceptor para adicionar token nas requisições
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Interceptor para tratar erros
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401 && this.onTokenExpired) {
          this.accessToken = null;
          this.onTokenExpired();
        }
        return Promise.reject(error);
      },
    );
  }

  // ==================== AUTH ====================

  async login(credentials: LoginInput): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/login', credentials);
    this.accessToken = response.data.accessToken;
    return response.data;
  }

  async register(data: RegisterInput): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/register', data);
    this.accessToken = response.data.accessToken;
    return response.data;
  }

  async refresh(): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/refresh');
    this.accessToken = response.data.accessToken;
    return response.data;
  }

  logout(): void {
    this.accessToken = null;
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  // ==================== TRANSACTIONS ====================

  async getTransactions(
    filters?: TransactionFilters,
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<Transaction>> {
    const response = await this.client.get<PaginatedResponse<Transaction>>('/transactions', {
      params: { ...filters, ...pagination },
    });
    return response.data;
  }

  async getTransaction(id: string): Promise<Transaction> {
    const response = await this.client.get<Transaction>(`/transactions/${id}`);
    return response.data;
  }

  async createTransaction(data: CreateTransactionInput): Promise<Transaction> {
    const response = await this.client.post<Transaction>('/transactions', data);
    return response.data;
  }

  async updateTransaction(id: string, data: UpdateTransactionInput): Promise<Transaction> {
    const response = await this.client.patch<Transaction>(`/transactions/${id}`, data);
    return response.data;
  }

  async deleteTransaction(id: string): Promise<void> {
    await this.client.delete(`/transactions/${id}`);
  }

  async getTransactionSummary(filters?: TransactionFilters): Promise<TransactionSummary> {
    const response = await this.client.get<TransactionSummary>('/transactions/summary', {
      params: filters,
    });
    return response.data;
  }

  // ==================== ACCOUNTS ====================

  async getAccounts(): Promise<Account[]> {
    const response = await this.client.get<Account[]>('/accounts');
    return response.data;
  }

  async getAccount(id: string): Promise<Account> {
    const response = await this.client.get<Account>(`/accounts/${id}`);
    return response.data;
  }

  async createAccount(data: CreateAccountInput): Promise<Account> {
    const response = await this.client.post<Account>('/accounts', data);
    return response.data;
  }

  async updateAccount(id: string, data: UpdateAccountInput): Promise<Account> {
    const response = await this.client.patch<Account>(`/accounts/${id}`, data);
    return response.data;
  }

  async deleteAccount(id: string): Promise<void> {
    await this.client.delete(`/accounts/${id}`);
  }

  // ==================== CATEGORIES ====================

  async getCategories(): Promise<Category[]> {
    const response = await this.client.get<Category[]>('/categories');
    return response.data;
  }

  async getCategory(id: string): Promise<Category> {
    const response = await this.client.get<Category>(`/categories/${id}`);
    return response.data;
  }

  async createCategory(data: CreateCategoryInput): Promise<Category> {
    const response = await this.client.post<Category>('/categories', data);
    return response.data;
  }

  async updateCategory(id: string, data: UpdateCategoryInput): Promise<Category> {
    const response = await this.client.patch<Category>(`/categories/${id}`, data);
    return response.data;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.client.delete(`/categories/${id}`);
  }

  // ==================== DASHBOARD ====================

  async getDashboardData(): Promise<any> {
    const response = await this.client.get('/dashboard');
    return response.data;
  }

  // ==================== REPORTS ====================

  async getMonthlyReport(year: number, month: number): Promise<any> {
    const response = await this.client.get('/reports/monthly', {
      params: { year, month },
    });
    return response.data;
  }

  async getYearlyReport(year: number): Promise<any> {
    const response = await this.client.get('/reports/yearly', {
      params: { year },
    });
    return response.data;
  }
}
