import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CacheService } from '../cache/cache.service';

export const RATE_LIMIT_KEY = 'rateLimit';

export interface RateLimitOptions {
  /**
   * Número máximo de requisições
   */
  max: number;

  /**
   * Janela de tempo em segundos
   */
  windowInSeconds: number;

  /**
   * Mensagem customizada (opcional)
   */
  message?: string;

  /**
   * Chave de identificação (padrão: IP do cliente)
   */
  keyGenerator?: (req: any) => string;
}

/**
 * Decorator para aplicar rate limiting em rotas
 *
 * @example
 * ```typescript
 * @RateLimit({ max: 10, windowInSeconds: 60 })
 * @Get('endpoint')
 * async sensitiveEndpoint() {
 *   // ...
 * }
 * ```
 */
export const RateLimit = (options: RateLimitOptions): MethodDecorator => {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(RATE_LIMIT_KEY, options, descriptor.value);
    return descriptor;
  };
};

/**
 * Guard para implementar rate limiting
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private cacheService: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<RateLimitOptions>(RATE_LIMIT_KEY, context.getHandler());

    // Se não tiver o decorator @RateLimit, permite
    if (!options) {
      return true;
    }

    // Se Redis não estiver disponível, permite (fail open)
    if (!this.cacheService.isReady()) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // Gera a chave de rate limit
    const key = options.keyGenerator ? options.keyGenerator(request) : this.getDefaultKey(request);

    const rateLimitKey = `rate-limit:${key}`;

    // Incrementa contador
    const current = await this.cacheService.incr(rateLimitKey);

    // Se é a primeira requisição, define o TTL
    if (current === 1) {
      await this.cacheService.expire(rateLimitKey, options.windowInSeconds);
    }

    // Verifica se excedeu o limite
    if (current > options.max) {
      const message =
        options.message ||
        `Você excedeu o limite de ${options.max} requisições por ${options.windowInSeconds} segundos. Tente novamente mais tarde.`;

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Adiciona headers de rate limit na resposta
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', options.max);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, options.max - current));
    response.setHeader('X-RateLimit-Reset', options.windowInSeconds);

    return true;
  }

  /**
   * Gera chave padrão baseada no IP e user ID (se autenticado)
   */
  private getDefaultKey(request: any): string {
    const ip = request.ip || request.connection.remoteAddress;
    const userId = request.user?.id || 'anonymous';
    return `${ip}:${userId}`;
  }
}
