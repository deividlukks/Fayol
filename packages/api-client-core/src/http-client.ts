import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { APP_CONFIG } from '@fayol/shared-constants';
import { handleAxiosError } from './errors';
import { setupRetry, RetryConfig } from './retry';
import { HttpCache } from './cache';
import { IStorageAdapter, AsyncStorageWrapper } from './storage.interface';

export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  enableRetry?: boolean;
  retryConfig?: RetryConfig;
  enableCache?: boolean;
  storage: IStorageAdapter; // INJEÇÃO DE DEPENDÊNCIA
}

/**
 * HttpClient Core - Base para web e mobile
 *
 * Utiliza Dependency Injection para storage adapter,
 * permitindo uso tanto com localStorage (web) quanto SecureStore (mobile)
 */
export class HttpClient {
  protected api: AxiosInstance;
  private cache: HttpCache;
  private enableCache: boolean;
  private storage: AsyncStorageWrapper; // Wrapper async

  constructor(config: HttpClientConfig) {
    const {
      baseURL = 'http://localhost:3333/api',
      timeout = APP_CONFIG.API_TIMEOUT_MS || 30000,
      enableRetry = true,
      retryConfig,
      enableCache = false,
      storage,
    } = config;

    // Wrapper para garantir interface assíncrona
    this.storage = new AsyncStorageWrapper(storage);
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

  /**
   * Inicializa interceptors do Axios
   */
  private initializeInterceptors() {
    // Request Interceptor: Injeta o Token
    this.api.interceptors.request.use(
      async (config) => {
        try {
          const token = await this.storage.getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('[HttpClient] Error loading token:', error);
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
  public async setToken(token: string): Promise<void> {
    await this.storage.setToken(token);
  }

  /**
   * Obtém token atual
   */
  public async getToken(): Promise<string | null> {
    return await this.storage.getToken();
  }

  /**
   * Remove token (logout)
   */
  public async clearToken(): Promise<void> {
    await this.storage.clearToken();
    this.cache.clear();
  }

  /**
   * Define refresh token
   */
  public async setRefreshToken(token: string): Promise<void> {
    await this.storage.setRefreshToken(token);
  }

  /**
   * Obtém refresh token
   */
  public async getRefreshToken(): Promise<string | null> {
    return await this.storage.getRefreshToken();
  }

  /**
   * Armazena dados do usuário
   */
  public async setUser(user: unknown): Promise<void> {
    await this.storage.setUser(user);
  }

  /**
   * Obtém dados do usuário
   */
  public async getUser<T = unknown>(): Promise<T | null> {
    return await this.storage.getUser<T>();
  }

  /**
   * Verifica se o usuário está autenticado
   */
  public async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null && token !== '';
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
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Invalida cache por padrão
   */
  public invalidateCache(pattern: string): void {
    this.cache.invalidatePattern(pattern);
  }

  /**
   * Acesso direto à instância Axios (para casos avançados)
   */
  public getAxiosInstance(): AxiosInstance {
    return this.api;
  }
}
