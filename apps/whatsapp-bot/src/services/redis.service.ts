import Redis from 'ioredis';
import { config } from '../config/app.config';
import { logger } from '../utils/logger';

export class RedisService {
  private client: Redis;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Redis({
      host: config.redis?.host || 'localhost',
      port: config.redis?.port || 6379,
      password: config.redis?.password,
      db: config.redis?.db || 0,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => {
      logger.info('[Redis] ✅ Redis connected');
      this.isConnected = true;
    });

    this.client.on('error', (err) => {
      logger.error('[Redis] ❌ Redis error:', err);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      logger.info('[Redis] 🔌 Redis connection closed');
      this.isConnected = false;
    });
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await this.client.setex(key, ttl, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  async expire(key: string, ttl: number): Promise<void> {
    await this.client.expire(key, ttl);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  getClient(): Redis {
    return this.client;
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
    this.isConnected = false;
  }

  isReady(): boolean {
    return this.isConnected;
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
}

export const redisService = new RedisService();
