/**
 * Storage Adapter Interface
 *
 * Define o contrato para implementações de storage
 * que podem ser síncronas (localStorage) ou assíncronas (SecureStore)
 */

export interface IStorageAdapter {
  /**
   * Obtém o token de autenticação
   * @returns Token ou null se não existir
   */
  getToken(): Promise<string | null> | string | null;

  /**
   * Armazena o token de autenticação
   * @param token - Token JWT
   */
  setToken(token: string): Promise<void> | void;

  /**
   * Remove o token de autenticação
   */
  clearToken(): Promise<void> | void;

  /**
   * Obtém os dados do usuário autenticado
   * @returns Dados do usuário ou null
   */
  getUser<T = unknown>(): Promise<T | null> | T | null;

  /**
   * Armazena os dados do usuário autenticado
   * @param user - Dados do usuário
   */
  setUser(user: unknown): Promise<void> | void;

  /**
   * Obtém o refresh token
   * @returns Refresh token ou null
   */
  getRefreshToken(): Promise<string | null> | string | null;

  /**
   * Armazena o refresh token
   * @param token - Refresh token
   */
  setRefreshToken(token: string): Promise<void> | void;

  /**
   * Limpa todos os dados armazenados
   */
  clearAll(): Promise<void> | void;

  /**
   * Obtém um item genérico do storage
   * @param key - Chave do item
   * @returns Valor ou null
   */
  getItem(key: string): Promise<string | null> | string | null;

  /**
   * Armazena um item genérico no storage
   * @param key - Chave do item
   * @param value - Valor a ser armazenado
   */
  setItem(key: string, value: string): Promise<void> | void;

  /**
   * Remove um item do storage
   * @param key - Chave do item
   */
  removeItem(key: string): Promise<void> | void;
}

/**
 * Helper type para normalizar métodos assíncronos
 * Transforma métodos que podem ser síncronos ou assíncronos em sempre assíncronos
 */
export type AsyncStorageAdapter = {
  [K in keyof IStorageAdapter]: IStorageAdapter[K] extends (...args: infer A) => infer R
    ? (...args: A) => Promise<R extends Promise<infer U> ? U : R>
    : IStorageAdapter[K];
};

/**
 * Wrapper para tornar qualquer adapter assíncrono
 * Útil para padronizar uso em HttpClient
 */
export class AsyncStorageWrapper implements AsyncStorageAdapter {
  constructor(private adapter: IStorageAdapter) {}

  async getToken(): Promise<string | null> {
    return await this.adapter.getToken();
  }

  async setToken(token: string): Promise<void> {
    return await this.adapter.setToken(token);
  }

  async clearToken(): Promise<void> {
    return await this.adapter.clearToken();
  }

  async getUser<T = unknown>(): Promise<T | null> {
    return await this.adapter.getUser<T>();
  }

  async setUser(user: unknown): Promise<void> {
    return await this.adapter.setUser(user);
  }

  async getRefreshToken(): Promise<string | null> {
    return await this.adapter.getRefreshToken();
  }

  async setRefreshToken(token: string): Promise<void> {
    return await this.adapter.setRefreshToken(token);
  }

  async clearAll(): Promise<void> {
    return await this.adapter.clearAll();
  }

  async getItem(key: string): Promise<string | null> {
    return await this.adapter.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    return await this.adapter.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    return await this.adapter.removeItem(key);
  }
}
