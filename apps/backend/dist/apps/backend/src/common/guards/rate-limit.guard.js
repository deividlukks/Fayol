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
exports.RateLimitGuard = exports.RateLimit = exports.RATE_LIMIT_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const cache_service_1 = require("../cache/cache.service");
exports.RATE_LIMIT_KEY = 'rateLimit';
const RateLimit = (options) => {
    return (target, propertyKey, descriptor) => {
        Reflect.defineMetadata(exports.RATE_LIMIT_KEY, options, descriptor.value);
        return descriptor;
    };
};
exports.RateLimit = RateLimit;
let RateLimitGuard = class RateLimitGuard {
    constructor(reflector, cacheService) {
        this.reflector = reflector;
        this.cacheService = cacheService;
    }
    async canActivate(context) {
        const options = this.reflector.get(exports.RATE_LIMIT_KEY, context.getHandler());
        if (!options) {
            return true;
        }
        if (!this.cacheService.isReady()) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const key = options.keyGenerator ? options.keyGenerator(request) : this.getDefaultKey(request);
        const rateLimitKey = `rate-limit:${key}`;
        const current = await this.cacheService.incr(rateLimitKey);
        if (current === 1) {
            await this.cacheService.expire(rateLimitKey, options.windowInSeconds);
        }
        if (current > options.max) {
            const message = options.message ||
                `Você excedeu o limite de ${options.max} requisições por ${options.windowInSeconds} segundos. Tente novamente mais tarde.`;
            throw new common_1.HttpException({
                statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
                error: 'Too Many Requests',
                message,
            }, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        const response = context.switchToHttp().getResponse();
        response.setHeader('X-RateLimit-Limit', options.max);
        response.setHeader('X-RateLimit-Remaining', Math.max(0, options.max - current));
        response.setHeader('X-RateLimit-Reset', options.windowInSeconds);
        return true;
    }
    getDefaultKey(request) {
        const ip = request.ip || request.connection.remoteAddress;
        const userId = request.user?.id || 'anonymous';
        return `${ip}:${userId}`;
    }
};
exports.RateLimitGuard = RateLimitGuard;
exports.RateLimitGuard = RateLimitGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        cache_service_1.CacheService])
], RateLimitGuard);
//# sourceMappingURL=rate-limit.guard.js.map