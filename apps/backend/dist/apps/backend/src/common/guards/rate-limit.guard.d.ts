import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CacheService } from '../cache/cache.service';
export declare const RATE_LIMIT_KEY = "rateLimit";
export interface RateLimitOptions {
    max: number;
    windowInSeconds: number;
    message?: string;
    keyGenerator?: (req: any) => string;
}
export declare const RateLimit: (options: RateLimitOptions) => MethodDecorator;
export declare class RateLimitGuard implements CanActivate {
    private reflector;
    private cacheService;
    constructor(reflector: Reflector, cacheService: CacheService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private getDefaultKey;
}
