import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class CacheService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private client;
    private isConnected;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    isReady(): boolean;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    get<T>(key: string): Promise<T | null>;
    del(key: string): Promise<void>;
    delPattern(pattern: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    expire(key: string, ttl: number): Promise<void>;
    incr(key: string, increment?: number): Promise<number>;
    flush(): Promise<void>;
    remember<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T>;
}
