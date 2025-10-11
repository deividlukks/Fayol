import { SetMetadata } from '@nestjs/common';

export const CACHEABLE_KEY = 'cacheable';

export interface CacheableOptions {
  /**
   * Prefixo da chave de cache
   */
  prefix?: string;

  /**
   * Time to live em segundos
   */
  ttl?: number;

  /**
   * Função para gerar a chave de cache baseada nos parâmetros
   * Se não fornecida, usa: prefix:className:methodName:hash(args)
   */
  keyGenerator?: (...args: any[]) => string;
}

/**
 * Decorator para habilitar cache em métodos
 *
 * @example
 * ```typescript
 * @Cacheable({ prefix: 'dashboard', ttl: 300 })
 * async getDashboardData(userId: string) {
 *   // ...
 * }
 * ```
 */
export const Cacheable = (options: CacheableOptions = {}): MethodDecorator => {
  return SetMetadata(CACHEABLE_KEY, options);
};
