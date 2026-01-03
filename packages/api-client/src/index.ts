/**
 * @fayol/api-client
 *
 * API Client para Web (Next.js)
 * Usa localStorage para armazenamento de tokens
 */

// Re-export core functionality
export * from '@fayol/api-client-core';

// Export web storage adapter
export * from './adapters/web-storage.adapter';

// Import necessário para criar singletons
import {
  AuthService,
  UsersService,
  TransactionsService,
  AccountsService,
  BudgetsService,
  GoalsService,
  InvestmentsService,
  HttpClient,
} from '@fayol/api-client-core';
import { webStorage } from './adapters/web-storage.adapter';
import { AxiosRequestConfig } from 'axios';

// ==================== SINGLETON INSTANCES ====================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';

/**
 * Auth Service Singleton
 */
export const authService = new AuthService(webStorage, `${API_BASE_URL}/auth`);

/**
 * Users Service Singleton
 */
export const usersService = new UsersService(webStorage, `${API_BASE_URL}/users`);

/**
 * Transactions Service Singleton
 */
export const transactionsService = new TransactionsService(
  webStorage,
  `${API_BASE_URL}/transactions`
);

/**
 * Accounts Service Singleton
 */
export const accountsService = new AccountsService(webStorage, `${API_BASE_URL}/accounts`);

/**
 * Budgets Service Singleton
 */
export const budgetsService = new BudgetsService(webStorage, `${API_BASE_URL}/budgets`);

/**
 * Goals Service Singleton
 */
export const goalsService = new GoalsService(webStorage, `${API_BASE_URL}/goals`);

/**
 * Investments Service Singleton
 */
export const investmentsService = new InvestmentsService(webStorage, `${API_BASE_URL}/investments`);

/**
 * Generic HTTP Client
 * Expõe métodos HTTP básicos para chamadas personalizadas
 */
class ApiClient {
  private httpClient: HttpClient;

  constructor(storage: typeof webStorage, baseURL: string) {
    this.httpClient = new HttpClient({
      baseURL,
      storage,
      enableRetry: true,
      enableCache: false,
    });
  }

  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<{ data: T }> {
    const axiosInstance = this.httpClient.getAxiosInstance();
    const response = await axiosInstance.get<T>(url, config);
    return { data: response.data };
  }

  async post<T = unknown>(
    url: string,
    postData?: unknown,
    config?: AxiosRequestConfig
  ): Promise<{ data: T }> {
    const axiosInstance = this.httpClient.getAxiosInstance();
    const response = await axiosInstance.post<T>(url, postData, config);
    return { data: response.data };
  }

  async put<T = unknown>(
    url: string,
    putData?: unknown,
    config?: AxiosRequestConfig
  ): Promise<{ data: T }> {
    const axiosInstance = this.httpClient.getAxiosInstance();
    const response = await axiosInstance.put<T>(url, putData, config);
    return { data: response.data };
  }

  async patch<T = unknown>(
    url: string,
    patchData?: unknown,
    config?: AxiosRequestConfig
  ): Promise<{ data: T }> {
    const axiosInstance = this.httpClient.getAxiosInstance();
    const response = await axiosInstance.patch<T>(url, patchData, config);
    return { data: response.data };
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<{ data: T }> {
    const axiosInstance = this.httpClient.getAxiosInstance();
    const response = await axiosInstance.delete<T>(url, config);
    return { data: response.data };
  }
}

/**
 * Generic API Client Instance
 */
export const apiClient = new ApiClient(webStorage, API_BASE_URL);
