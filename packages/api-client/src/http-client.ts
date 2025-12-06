import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { APP_CONFIG } from '@fayol/shared-constants';

export class HttpClient {
  protected api: AxiosInstance;
  private token: string | null = null;

  constructor(baseURL: string = 'http://localhost:3333/api') {
    this.api = axios.create({
      baseURL,
      timeout: APP_CONFIG.API_TIMEOUT_MS || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.initializeInterceptors();
  }

  private initializeInterceptors() {
    // Request Interceptor: Injeta o Token
    this.api.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Response Interceptor: Tratamento Global de Erros
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        // Aqui poderíamos adicionar lógica de Refresh Token no futuro
        return Promise.reject(error);
      }
    );
  }

  public setToken(token: string) {
    this.token = token;
  }

  public getToken(): string | null {
    return this.token;
  }

  // Métodos Genéricos Tipados
  protected async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.get(url, config);
    return response.data;
  }

  protected async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.post(url, data, config);
    return response.data;
  }

  protected async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.patch(url, data, config);
    return response.data;
  }

  protected async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.delete(url, config);
    return response.data;
  }
}
