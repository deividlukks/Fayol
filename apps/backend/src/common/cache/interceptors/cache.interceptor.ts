import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../cache.service';
import { CACHEABLE_KEY, CacheableOptions } from '../decorators/cacheable.decorator';
import { createHash } from 'crypto';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private cacheService: CacheService,
    private reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const options = this.reflector.get<CacheableOptions>(CACHEABLE_KEY, context.getHandler());

    // Se não tiver o decorator @Cacheable, pula o cache
    if (!options) {
      return next.handle();
    }

    // Se Redis não estiver disponível, pula o cache
    if (!this.cacheService.isReady()) {
      return next.handle();
    }

    // Gera a chave de cache
    const cacheKey = this.generateCacheKey(context, options);

    // Tenta buscar do cache
    const cachedValue = await this.cacheService.get(cacheKey);

    if (cachedValue !== null) {
      // Retorna valor do cache
      return of(cachedValue);
    }

    // Se não existir no cache, executa o método e cacheia o resultado
    return next.handle().pipe(
      tap(async (response) => {
        await this.cacheService.set(cacheKey, response, options.ttl);
      }),
    );
  }

  /**
   * Gera a chave de cache baseada no contexto e opções
   */
  private generateCacheKey(context: ExecutionContext, options: CacheableOptions): string {
    const request = context.switchToHttp().getRequest();
    const className = context.getClass().name;
    const methodName = context.getHandler().name;

    // Se tiver keyGenerator customizado, usa ele
    if (options.keyGenerator) {
      const args = context.getArgs();
      return options.keyGenerator(...args);
    }

    // Pega parâmetros da requisição para incluir na chave
    const params = {
      params: request.params,
      query: request.query,
      user: request.user ? { id: request.user.id } : null,
    };

    // Gera hash dos parâmetros
    const paramsHash = createHash('md5')
      .update(JSON.stringify(params))
      .digest('hex')
      .substring(0, 8);

    // Monta a chave: prefix:className:methodName:hash
    const prefix = options.prefix || 'cache';
    return `${prefix}:${className}:${methodName}:${paramsHash}`;
  }
}
