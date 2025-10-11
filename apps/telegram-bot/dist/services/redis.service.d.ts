import Redis from 'ioredis';
export declare class RedisService {
    private client;
    private isConnected;
    constructor();
    set(key: string, value: any, ttl?: number): Promise<void>;
    get<T>(key: string): Promise<T | null>;
    delete(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    keys(pattern: string): Promise<string[]>;
    expire(key: string, ttl: number): Promise<void>;
    ttl(key: string): Promise<number>;
    getClient(): Redis;
    disconnect(): Promise<void>;
    isReady(): boolean;
    ping(): Promise<boolean>;
}
export declare const redisService: RedisService;
//# sourceMappingURL=redis.service.d.ts.map