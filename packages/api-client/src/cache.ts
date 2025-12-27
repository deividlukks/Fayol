/**
 * Sistema simples de cache em memória para requisições HTTP
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class HttpCache {
  private cache: Map<string, CacheEntry<any>>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Gera chave de cache baseada em URL e params
   */
  private generateKey(url: string, params?: Record<string, unknown>): string {
    const paramsStr = params ? JSON.stringify(params) : '';
    return url + ':' + paramsStr;
  }

  /**
   * Verifica se cache está válido
   */
  private isValid(entry: CacheEntry<any>): boolean {
    const now = Date.now();
    return now - entry.timestamp < entry.ttl;
  }

  /**
   * Obtém dados do cache
   */
  get<T>(url: string, params?: Record<string, unknown>): T | null {
    const key = this.generateKey(url, params);
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    if (!this.isValid(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Armazena dados no cache
   */
  set<T>(url: string, data: T, ttl: number = 60000, params?: Record<string, unknown>): void {
    const key = this.generateKey(url, params);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Remove item específico do cache
   */
  delete(url: string, params?: Record<string, unknown>): void {
    const key = this.generateKey(url, params);
    this.cache.delete(key);
  }

  /**
   * Invalida cache por padrão de URL
   */
  invalidatePattern(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove entradas expiradas
   */
  cleanup(): void {
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (!this.isValid(entry)) {
        this.cache.delete(key);
      }
    }
  }
}

// Instância singleton
export const httpCache = new HttpCache();

// Cleanup automático a cada 5 minutos (apenas no browser)
if (typeof window !== 'undefined') {
  setInterval(() => {
    httpCache.cleanup();
  }, 5 * 60 * 1000);
}
