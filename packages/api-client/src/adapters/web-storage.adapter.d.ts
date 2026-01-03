import { IStorageAdapter } from '@fayol/api-client-core';
/**
 * Web Storage Adapter
 *
 * Implementação de storage para web usando localStorage
 * Métodos síncronos compatíveis com browser
 */
export declare class WebStorageAdapter implements IStorageAdapter {
  /**
   * Obtém token de autenticação
   */
  getToken(): string | null;
  /**
   * Armazena token de autenticação
   */
  setToken(token: string): void;
  /**
   * Remove token de autenticação
   */
  clearToken(): void;
  /**
   * Obtém dados do usuário
   */
  getUser<T = unknown>(): T | null;
  /**
   * Armazena dados do usuário
   */
  setUser(user: unknown): void;
  /**
   * Obtém refresh token
   */
  getRefreshToken(): string | null;
  /**
   * Armazena refresh token
   */
  setRefreshToken(token: string): void;
  /**
   * Limpa todos os dados
   */
  clearAll(): void;
  /**
   * Obtém item genérico
   */
  getItem(key: string): string | null;
  /**
   * Armazena item genérico
   */
  setItem(key: string, value: string): void;
  /**
   * Remove item genérico
   */
  removeItem(key: string): void;
}
/**
 * Singleton instance para uso global
 */
export declare const webStorage: WebStorageAdapter;
//# sourceMappingURL=web-storage.adapter.d.ts.map
