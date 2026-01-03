import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';
export const CACHE_TAGS_METADATA = 'cache:tags';

export interface CacheableOptions {
  /**
   * Cache key template
   * Use {paramName} for parameter interpolation
   * Example: 'user:{userId}' will replace {userId} with actual parameter value
   */
  key: string;

  /**
   * Time to live in seconds
   * @default 300 (5 minutes)
   */
  ttl?: number;

  /**
   * Tags for cache invalidation
   * Example: ['user', 'profile']
   */
  tags?: string[];
}

/**
 * Decorator to enable automatic caching for method results
 *
 * @example
 * ```typescript
 * @Cacheable({
 *   key: 'user:{id}',
 *   ttl: 600,
 *   tags: ['user']
 * })
 * async findOne(id: string) {
 *   return this.prisma.user.findUnique({ where: { id } });
 * }
 * ```
 */
export function Cacheable(options: CacheableOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Store metadata for interceptor
    SetMetadata(CACHE_KEY_METADATA, options.key)(target, propertyKey, descriptor);

    if (options.ttl) {
      SetMetadata(CACHE_TTL_METADATA, options.ttl)(target, propertyKey, descriptor);
    }

    if (options.tags) {
      SetMetadata(CACHE_TAGS_METADATA, options.tags)(target, propertyKey, descriptor);
    }

    return descriptor;
  };
}

/**
 * Decorator to invalidate cache by tag when method is called
 *
 * @example
 * ```typescript
 * @CacheInvalidate(['user'])
 * async update(id: string, data: UpdateUserDto) {
 *   return this.prisma.user.update({ where: { id }, data });
 * }
 * ```
 */
export const CACHE_INVALIDATE_METADATA = 'cache:invalidate';

export function CacheInvalidate(tags: string[]) {
  return SetMetadata(CACHE_INVALIDATE_METADATA, tags);
}

/**
 * Decorator to invalidate cache by pattern when method is called
 *
 * @example
 * ```typescript
 * @CacheInvalidatePattern('user:*')
 * async deleteUser(id: string) {
 *   return this.prisma.user.delete({ where: { id } });
 * }
 * ```
 */
export const CACHE_INVALIDATE_PATTERN_METADATA = 'cache:invalidate:pattern';

export function CacheInvalidatePattern(pattern: string) {
  return SetMetadata(CACHE_INVALIDATE_PATTERN_METADATA, pattern);
}
