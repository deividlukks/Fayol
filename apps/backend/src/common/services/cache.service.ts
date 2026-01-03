import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalKeys: number;
}

export interface CacheOptions {
  ttl?: number; // seconds
  tags?: string[];
}

/**
 * Centralized caching service using Redis
 * Provides generic caching with TTL, tagging, and statistics
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis: Redis | null = null;
  private readonly defaultTTL = 300; // 5 minutes

  // Stats tracking
  private stats = {
    hits: 0,
    misses: 0,
  };

  // Tag mapping: tag -> Set<key>
  private tagMap = new Map<string, Set<string>>();

  constructor(private configService: ConfigService) {
    // CORREÇÃO: Lendo as variáveis separadas do .env para garantir a autenticação
    const host = this.configService.get<string>('REDIS_HOST');
    const port = this.configService.get<number>('REDIS_PORT') || 6379;
    const password = this.configService.get<string>('REDIS_PASSWORD');

    // Se tiver host configurado, inicia a conexão
    if (host) {
      this.redis = new Redis({
        host: host,
        port: port,
        password: password, // <--- AQUI ESTÁ A CORREÇÃO DO ERRO 'NOAUTH'
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true;
          }
          return false;
        },
      });

      this.redis.on('connect', () => {
        this.logger.log(`Redis connected successfully to ${host}:${port}`);
      });

      this.redis.on('error', (error) => {
        this.logger.error('Redis connection error:', error);
      });
    } else {
      this.logger.warn('REDIS_HOST not configured, cache disabled');
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;

    try {
      const value = await this.redis.get(key);

      if (value === null) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL and tags
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    if (!this.redis) return;

    try {
      const serialized = JSON.stringify(value);
      const ttl = options?.ttl || this.defaultTTL;

      await this.redis.setex(key, ttl, serialized);

      // Store tag mappings in memory (could be Redis SET for distributed)
      if (options?.tags) {
        for (const tag of options.tags) {
          if (!this.tagMap.has(tag)) {
            this.tagMap.set(tag, new Set());
          }
          this.tagMap.get(tag)!.add(key);
        }
      }

      this.logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete specific key from cache
   */
  async del(key: string): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.del(key);

      // Remove from tag maps
      for (const [tag, keys] of this.tagMap.entries()) {
        keys.delete(key);
        if (keys.size === 0) {
          this.tagMap.delete(tag);
        }
      }

      this.logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Invalidate all keys with a specific tag
   */
  async invalidateByTag(tag: string): Promise<void> {
    if (!this.redis) return;

    try {
      const keys = this.tagMap.get(tag);

      if (keys && keys.size > 0) {
        const keysArray = Array.from(keys);
        await this.redis.del(...keysArray);
        this.tagMap.delete(tag);

        this.logger.log(`Cache invalidated by tag: ${tag} (${keysArray.length} keys)`);
      }
    } catch (error) {
      this.logger.error(`Cache invalidate by tag error for ${tag}:`, error);
    }
  }

  /**
   * Invalidate keys matching a pattern
   */
  async invalidateByPattern(pattern: string): Promise<void> {
    if (!this.redis) return;

    try {
      const keys = await this.redis.keys(pattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.log(`Cache invalidated by pattern: ${pattern} (${keys.length} keys)`);
      }
    } catch (error) {
      this.logger.error(`Cache invalidate by pattern error for ${pattern}:`, error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.flushdb();
      this.tagMap.clear();
      this.logger.log('Cache cleared');
    } catch (error) {
      this.logger.error('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    let totalKeys = 0;

    if (this.redis) {
      try {
        totalKeys = await this.redis.dbsize();
      } catch (error) {
        this.logger.error('Error getting cache stats:', error);
      }
    }

    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      totalKeys,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  /**
   * Get or set pattern - fetch from cache or compute
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, options?: CacheOptions): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);

    return value;
  }

  /**
   * Warm cache with predefined data
   */
  async warmCache(
    entries: Array<{ key: string; value: any; options?: CacheOptions }>
  ): Promise<void> {
    this.logger.log(`Warming cache with ${entries.length} entries`);

    for (const entry of entries) {
      await this.set(entry.key, entry.value, entry.options);
    }

    this.logger.log('Cache warming completed');
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Cache exists check error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   */
  async ttl(key: string): Promise<number> {
    if (!this.redis) return -1;

    try {
      return await this.redis.ttl(key);
    } catch (error) {
      this.logger.error(`Cache TTL check error for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
      this.logger.log('Redis connection closed');
    }
  }
}
