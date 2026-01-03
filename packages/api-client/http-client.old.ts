import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { APP_CONFIG, STORAGE_KEYS } from '@fayol/shared-constants';
import { handleAxiosError } from './errors';
import { setupRetry, RetryConfig } from './retry';
import { HttpCache } from './cache';

export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  enableRetry?: boolean;
  retryConfig?: RetryConfig;
  enableCache?: boolean;
}

export class HttpClient {
  protected api: AxiosInstance;
  private cache: HttpCache;
  private enableCache: boolean;

  constructor(config: HttpClientConfig = {}) {
    const {
      baseURL = 'http://localhost:3333/api',
      timeout = APP_CONFIG.API_TIMEOUT_MS || 30000,
      enableRetry = true,
      retryConfig,
      enableCache = false,
    } = config;

    this.enableCache = enableCache;
    this.cache = new HttpCache();

    this.api = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.initializeInterceptors();

    if (enableRetry) {
      setupRetry(this.api, retryConfig);
    }
  }

  private initializeInterceptors() {
    // Request Interceptor: Injeta o Token
    this.api.interceptors.request.use(
      (config) => {
        // Tenta obter token do localStorage
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem(STORAGE_KEYS.AUTH.TOKEN);
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response Interceptor: Tratamento Global de Erros
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Converte erro do Axios para erro customizado
        handleAxiosError(error);
      }
    );
  }

  /**
   * Define token de autenticação
   */
  public setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.AUTH.TOKEN, token);
    }
  }

  /**
   * Obtém token atual
   */
  public getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.AUTH.TOKEN);
    }
    return null;
  }

  /**
   * Remove token (logout)
   */
  public clearToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.AUTH.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.AUTH.USER);
    }
    this.cache.clear();
  }

  /**
   * GET com suporte a cache
   */
  protected async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    // Tenta cache primeiro
    if (this.enableCache && !config?.headers?.['Cache-Control']) {
      const cached = this.cache.get<T>(url, config?.params);
      if (cached) {
        return cached;
      }
    }

    const response: AxiosResponse<T> = await this.api.get(url, config);

    // Armazena em cache (5 minutos por padrão)
    if (this.enableCache && !config?.headers?.['Cache-Control']) {
      this.cache.set(url, response.data, 5 * 60 * 1000, config?.params);
    }

    return response.data;
  }

  /**
   * POST
   */
  protected async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.api.post(url, data, config);

    // Invalida cache relacionado
    if (this.enableCache) {
      this.cache.invalidatePattern(url.split('/')[1]); // Invalida por recurso
    }

    return response.data;
  }

  /**
   * PATCH
   */
  protected async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.api.patch(url, data, config);

    // Invalida cache relacionado
    if (this.enableCache) {
      this.cache.invalidatePattern(url.split('/')[1]);
    }

    return response.data;
  }

  /**
   * PUT
   */
  protected async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.api.put(url, data, config);

    // Invalida cache relacionado
    if (this.enableCache) {
      this.cache.invalidatePattern(url.split('/')[1]);
    }

    return response.data;
  }

  /**
   * DELETE
   */
  protected async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.delete(url, config);

    // Invalida cache relacionado
    if (this.enableCache) {
      this.cache.invalidatePattern(url.split('/')[1]);
    }

    return response.data;
  }

  /**
   * Limpa cache manualmente
   */
  public clearCache() {
    this.cache.clear();
  }

  /**
   * Invalida cache por padrão
   */
  public invalidateCache(pattern: string) {
    this.cache.invalidatePattern(pattern);
  }
}
