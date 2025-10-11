"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheInterceptor = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const cache_service_1 = require("../cache.service");
const cacheable_decorator_1 = require("../decorators/cacheable.decorator");
const crypto_1 = require("crypto");
let CacheInterceptor = class CacheInterceptor {
    constructor(cacheService, reflector) {
        this.cacheService = cacheService;
        this.reflector = reflector;
    }
    async intercept(context, next) {
        const options = this.reflector.get(cacheable_decorator_1.CACHEABLE_KEY, context.getHandler());
        if (!options) {
            return next.handle();
        }
        if (!this.cacheService.isReady()) {
            return next.handle();
        }
        const cacheKey = this.generateCacheKey(context, options);
        const cachedValue = await this.cacheService.get(cacheKey);
        if (cachedValue !== null) {
            return (0, rxjs_1.of)(cachedValue);
        }
        return next.handle().pipe((0, operators_1.tap)(async (response) => {
            await this.cacheService.set(cacheKey, response, options.ttl);
        }));
    }
    generateCacheKey(context, options) {
        const request = context.switchToHttp().getRequest();
        const className = context.getClass().name;
        const methodName = context.getHandler().name;
        if (options.keyGenerator) {
            const args = context.getArgs();
            return options.keyGenerator(...args);
        }
        const params = {
            params: request.params,
            query: request.query,
            user: request.user ? { id: request.user.id } : null,
        };
        const paramsHash = (0, crypto_1.createHash)('md5')
            .update(JSON.stringify(params))
            .digest('hex')
            .substring(0, 8);
        const prefix = options.prefix || 'cache';
        return `${prefix}:${className}:${methodName}:${paramsHash}`;
    }
};
exports.CacheInterceptor = CacheInterceptor;
exports.CacheInterceptor = CacheInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cache_service_1.CacheService,
        core_1.Reflector])
], CacheInterceptor);
//# sourceMappingURL=cache.interceptor.js.map