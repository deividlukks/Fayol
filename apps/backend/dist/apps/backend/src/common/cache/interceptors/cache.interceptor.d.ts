import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { CacheService } from '../cache.service';
export declare class CacheInterceptor implements NestInterceptor {
    private cacheService;
    private reflector;
    constructor(cacheService: CacheService, reflector: Reflector);
    intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>>;
    private generateCacheKey;
}
