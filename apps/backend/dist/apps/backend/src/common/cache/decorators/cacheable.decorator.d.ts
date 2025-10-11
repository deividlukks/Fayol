export declare const CACHEABLE_KEY = "cacheable";
export interface CacheableOptions {
    prefix?: string;
    ttl?: number;
    keyGenerator?: (...args: any[]) => string;
}
export declare const Cacheable: (options?: CacheableOptions) => MethodDecorator;
