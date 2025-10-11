import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

/**
 * Serviço de Cache Redis
 * Fornece métodos para operações de cache
 */
@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private isConnected = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';

      this.client = createClient({
        url: redisUrl,
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.client && this.isConnected) {
      await this.client.quit();
    }
  }

  /**
   * Verifica se o Redis está conectado
   */
  isReady(): boolean {
    return this.isConnected;
  }

  /**
   * Define um valor no cache
   * @param key Chave
   * @param value Valor (será serializado em JSON)
   * @param ttl Time to live em segundos (opcional)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.isConnected) {
      return; // Fail silently se Redis não estiver disponível
    }

    try {
      const serialized = JSON.stringify(value);

      if (ttl) {
        await this.client.setEx(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Obtém um valor do cache
   * @param key Chave
   * @returns Valor deserializado ou null
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) {
      return null;
    }

    try {
      const value = await this.client.get(key);

      if (!value || typeof value !== 'string') {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Deleta uma chave do cache
   * @param key Chave
   */
  async del(key: string): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Deleta múltiplas chaves que correspondem ao padrão
   * @param pattern Padrão (ex: "user:*")
   */
  async delPattern(pattern: string): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      const keys = await this.client.keys(pattern);

      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error);
    }
  }

  /**
   * Verifica se uma chave existe
   * @param key Chave
   * @returns true se existe
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Define TTL para uma chave existente
   * @param key Chave
   * @param ttl Time to live em segundos
   */
  async expire(key: string, ttl: number): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.client.expire(key, ttl);
    } catch (error) {
      console.error(`Cache expire error for key ${key}:`, error);
    }
  }

  /**
   * Incrementa um valor numérico
   * @param key Chave
   * @param increment Valor a incrementar (padrão: 1)
   * @returns Novo valor
   */
  async incr(key: string, increment = 1): Promise<number> {
    if (!this.isConnected) {
      return 0;
    }

    try {
      return await this.client.incrBy(key, increment);
    } catch (error) {
      console.error(`Cache incr error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Limpa todo o cache (use com cuidado!)
   */
  async flush(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.client.flushDb();
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }

  /**
   * Helper para cache com fallback
   * Se não existir no cache, executa a função e cacheia o resultado
   * @param key Chave
   * @param fn Função para obter o valor
   * @param ttl Time to live em segundos
   * @returns Valor (do cache ou da função)
   */
  async remember<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    // Tenta buscar do cache
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    // Se não existir, executa a função
    const value = await fn();

    // Cacheia o resultado
    await this.set(key, value, ttl);

    return value;
  }
}
