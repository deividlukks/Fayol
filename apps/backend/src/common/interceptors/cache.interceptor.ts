import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../services/cache.service';
import {
  CACHE_KEY_METADATA,
  CACHE_TTL_METADATA,
  CACHE_TAGS_METADATA,
  CACHE_INVALIDATE_METADATA,
  CACHE_INVALIDATE_PATTERN_METADATA,
} from '../decorators/cacheable.decorator';

/**
 * Interceptor for automatic caching based on @Cacheable decorator
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const handler = context.getHandler();

    // Check for cache invalidation decorators first
    const invalidateTags = this.reflector.get<string[]>(CACHE_INVALIDATE_METADATA, handler);

    const invalidatePattern = this.reflector.get<string>(
      CACHE_INVALIDATE_PATTERN_METADATA,
      handler
    );

    if (invalidateTags || invalidatePattern) {
      // Invalidate cache after method execution
      return next.handle().pipe(
        tap(async () => {
          if (invalidateTags) {
            for (const tag of invalidateTags) {
              await this.cacheService.invalidateByTag(tag);
            }
          }

          if (invalidatePattern) {
            await this.cacheService.invalidateByPattern(invalidatePattern);
          }
        })
      );
    }

    // Check for @Cacheable decorator
    const cacheKeyTemplate = this.reflector.get<string>(CACHE_KEY_METADATA, handler);

    if (!cacheKeyTemplate) {
      // No caching configured, proceed normally
      return next.handle();
    }

    // Get cache configuration
    const ttl = this.reflector.get<number>(CACHE_TTL_METADATA, handler);
    const tags = this.reflector.get<string[]>(CACHE_TAGS_METADATA, handler);

    // Build cache key from template and method arguments
    const args = this.getMethodArguments(context);
    const cacheKey = this.buildCacheKey(cacheKeyTemplate, args);

    // Try to get from cache
    const cachedResult = await this.cacheService.get(cacheKey);

    if (cachedResult !== null) {
      this.logger.debug(`Cache hit: ${cacheKey}`);
      return of(cachedResult);
    }

    this.logger.debug(`Cache miss: ${cacheKey}`);

    // Execute method and cache result
    return next.handle().pipe(
      tap(async (result) => {
        if (result !== null && result !== undefined) {
          await this.cacheService.set(cacheKey, result, { ttl, tags });
        }
      })
    );
  }

  /**
   * Extract method arguments from execution context
   */
  private getMethodArguments(context: ExecutionContext): Record<string, any> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const args = context.getArgs();

    // Get parameter names from function
    const paramNames = this.getParamNames(handler);

    // Build argument map
    const argMap: Record<string, any> = {};

    paramNames.forEach((name, index) => {
      argMap[name] = args[index];
    });

    // Add common request properties
    if (request) {
      argMap['userId'] = request.user?.id || request.user?.userId;
      argMap['user'] = request.user;
    }

    return argMap;
  }

  /**
   * Get parameter names from function
   */
  private getParamNames(func: Function): string[] {
    const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;
    const ARGUMENT_NAMES = /([^\s,]+)/g;

    const fnStr = func.toString().replace(STRIP_COMMENTS, '');
    const result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);

    return result || [];
  }

  /**
   * Build cache key from template and arguments
   * Replaces {paramName} with actual values
   */
  private buildCacheKey(template: string, args: Record<string, any>): string {
    let key = template;

    // Replace all {paramName} occurrences
    const matches = template.match(/\{([^}]+)\}/g);

    if (matches) {
      for (const match of matches) {
        const paramName = match.slice(1, -1); // Remove { }
        const value = this.getNestedValue(args, paramName);

        if (value !== undefined) {
          key = key.replace(match, String(value));
        } else {
          this.logger.warn(`Cache key parameter not found: ${paramName} in template: ${template}`);
        }
      }
    }

    return key;
  }

  /**
   * Get nested value from object using dot notation
   * Example: 'user.id' -> args.user.id
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
