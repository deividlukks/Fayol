import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { APP_CONFIG } from '@fayol/shared-constants';
import { handleAxiosError } from '@fayol/api-client/src/errors';
import { setupRetry, RetryConfig } from '@fayol/api-client/src/retry';
import { HttpCache } from '@fayol/api-client/src/cache';
import { mobileStorage } from './storage.adapter';

export interface HttpClientMobileConfig {
  baseURL?: string;
  timeout?: number;
  enableRetry?: boolean;
  retryConfig?: RetryConfig;
  enableCache?: boolean;
}

/**
 * HttpClient adaptado para React Native
 *
 * Diferenças do HttpClient web:
 * - Usa expo-secure-store para tokens (Keychain/Keystore)
 * - Usa AsyncStorage para cache
 * - Métodos assíncronos para storage (não sincronos como localStorage)
 */
export class HttpClientMobile {
  protected api: AxiosInstance;
  private cache: HttpCache;
  private enableCache: boolean;
  private tokenInitialized: boolean = false;

  constructor(config: HttpClientMobileConfig = {}) {
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
      // Mobile-specific: habilita cookies para httpOnly token se necessário
      withCredentials: true,
    });

    this.initializeInterceptors();

    if (enableRetry) {
      setupRetry(this.api, retryConfig);
    }
  }

  private initializeInterceptors() {
    // Request Interceptor: Injeta o Token (async)
    this.api.interceptors.request.use(
      async (config) => {
        try {
          const token = await mobileStorage.getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('[HttpClientMobile] Error loading token:', error);
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
   * Define token de autenticação (async)
   */
  public async setToken(token: string): Promise<void> {
    await mobileStorage.setToken(token);
    this.tokenInitialized = true;
  }

  /**
   * Obtém token atual (async)
   */
  public async getToken(): Promise<string | null> {
    return await mobileStorage.getToken();
  }

  /**
   * Remove token (logout)
   */
  public async clearToken(): Promise<void> {
    await mobileStorage.clearAll();
    this.cache.clear();
    this.tokenInitialized = false;
  }

  /**
   * Define refresh token
   */
  public async setRefreshToken(token: string): Promise<void> {
    await mobileStorage.setRefreshToken(token);
  }

  /**
   * Obtém refresh token
   */
  public async getRefreshToken(): Promise<string | null> {
    return await mobileStorage.getRefreshToken();
  }

  /**
   * Armazena dados do usuário
   */
  public async setUser(user: unknown): Promise<void> {
    await mobileStorage.setUser(user);
  }

  /**
   * Obtém dados do usuário
   */
  public async getUser<T>(): Promise<T | null> {
    return await mobileStorage.getUser<T>();
  }

  /**
   * Verifica se o usuário está autenticado
   */
  public async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null && token !== '';
  }

  /**
   * Invalida cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Invalida cache por padrão de URL
   */
  public invalidateCachePattern(pattern: string): void {
    this.cache.invalidatePattern(pattern);
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

    const response = await this.api.get<T>(url, config);

    // Armazena em cache (5 minutos por padrão)
    if (this.enableCache && !config?.headers?.['Cache-Control']) {
      this.cache.set(url, response.data, 5 * 60 * 1000, config?.params);
    }

    return response.data;
  }

  /**
   * POST
   */
  protected async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.post<T>(url, data, config);

    // Invalida cache relacionado
    if (this.enableCache) {
      this.cache.invalidatePattern(url.split('/')[1]); // Invalida por recurso
    }

    return response.data;
  }

  /**
   * PATCH
   */
  protected async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.patch<T>(url, data, config);

    // Invalida cache relacionado
    if (this.enableCache) {
      this.cache.invalidatePattern(url.split('/')[1]);
    }

    return response.data;
  }

  /**
   * PUT
   */
  protected async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.put<T>(url, data, config);

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
    const response = await this.api.delete<T>(url, config);

    // Invalida cache relacionado
    if (this.enableCache) {
      this.cache.invalidatePattern(url.split('/')[1]);
    }

    return response.data;
  }

  /**
   * Acesso direto à instância Axios (para casos avançados)
   */
  public getAxiosInstance(): AxiosInstance {
    return this.api;
  }
}
