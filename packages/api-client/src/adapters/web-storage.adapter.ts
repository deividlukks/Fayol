import { IStorageAdapter } from '@fayol/api-client-core';
import { STORAGE_KEYS } from '@fayol/shared-constants';

/**
 * Web Storage Adapter
 *
 * Implementação de storage para web usando localStorage
 * Métodos síncronos compatíveis com browser
 */
export class WebStorageAdapter implements IStorageAdapter {
  /**
   * Obtém token de autenticação
   */
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.AUTH.TOKEN);
  }

  /**
   * Armazena token de autenticação
   */
  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.AUTH.TOKEN, token);
    }
  }

  /**
   * Remove token de autenticação
   */
  clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.AUTH.TOKEN);
    }
  }

  /**
   * Obtém dados do usuário
   */
  getUser<T = unknown>(): T | null {
    if (typeof window === 'undefined') return null;

    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTH.USER);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[WebStorage] Error parsing user data:', error);
      return null;
    }
  }

  /**
   * Armazena dados do usuário
   */
  setUser(user: unknown): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.AUTH.USER, JSON.stringify(user));
      } catch (error) {
        console.error('[WebStorage] Error storing user data:', error);
      }
    }
  }

  /**
   * Obtém refresh token
   */
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.AUTH.REFRESH_TOKEN);
  }

  /**
   * Armazena refresh token
   */
  setRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.AUTH.REFRESH_TOKEN, token);
    }
  }

  /**
   * Limpa todos os dados
   */
  clearAll(): void {
    if (typeof window !== 'undefined') {
      // Remove apenas dados relacionados à autenticação
      localStorage.removeItem(STORAGE_KEYS.AUTH.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.AUTH.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.AUTH.USER);
    }
  }

  /**
   * Obtém item genérico
   */
  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  }

  /**
   * Armazena item genérico
   */
  setItem(key: string, value: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  }

  /**
   * Remove item genérico
   */
  removeItem(key: string): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  }
}

/**
 * Singleton instance para uso global
 */
export const webStorage = new WebStorageAdapter();
