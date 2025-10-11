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
exports.CacheService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const redis_1 = require("redis");
let CacheService = class CacheService {
    constructor(configService) {
        this.configService = configService;
        this.isConnected = false;
    }
    async onModuleInit() {
        try {
            const redisUrl = this.configService.get('REDIS_URL') || 'redis://localhost:6379';
            this.client = (0, redis_1.createClient)({
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
        }
        catch (error) {
            console.error('Failed to connect to Redis:', error);
            this.isConnected = false;
        }
    }
    async onModuleDestroy() {
        if (this.client && this.isConnected) {
            await this.client.quit();
        }
    }
    isReady() {
        return this.isConnected;
    }
    async set(key, value, ttl) {
        if (!this.isConnected) {
            return;
        }
        try {
            const serialized = JSON.stringify(value);
            if (ttl) {
                await this.client.setEx(key, ttl, serialized);
            }
            else {
                await this.client.set(key, serialized);
            }
        }
        catch (error) {
            console.error(`Cache set error for key ${key}:`, error);
        }
    }
    async get(key) {
        if (!this.isConnected) {
            return null;
        }
        try {
            const value = await this.client.get(key);
            if (!value || typeof value !== 'string') {
                return null;
            }
            return JSON.parse(value);
        }
        catch (error) {
            console.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    }
    async del(key) {
        if (!this.isConnected) {
            return;
        }
        try {
            await this.client.del(key);
        }
        catch (error) {
            console.error(`Cache delete error for key ${key}:`, error);
        }
    }
    async delPattern(pattern) {
        if (!this.isConnected) {
            return;
        }
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
            }
        }
        catch (error) {
            console.error(`Cache delete pattern error for ${pattern}:`, error);
        }
    }
    async exists(key) {
        if (!this.isConnected) {
            return false;
        }
        try {
            const result = await this.client.exists(key);
            return result === 1;
        }
        catch (error) {
            console.error(`Cache exists error for key ${key}:`, error);
            return false;
        }
    }
    async expire(key, ttl) {
        if (!this.isConnected) {
            return;
        }
        try {
            await this.client.expire(key, ttl);
        }
        catch (error) {
            console.error(`Cache expire error for key ${key}:`, error);
        }
    }
    async incr(key, increment = 1) {
        if (!this.isConnected) {
            return 0;
        }
        try {
            return await this.client.incrBy(key, increment);
        }
        catch (error) {
            console.error(`Cache incr error for key ${key}:`, error);
            return 0;
        }
    }
    async flush() {
        if (!this.isConnected) {
            return;
        }
        try {
            await this.client.flushDb();
        }
        catch (error) {
            console.error('Cache flush error:', error);
        }
    }
    async remember(key, fn, ttl) {
        const cached = await this.get(key);
        if (cached !== null) {
            return cached;
        }
        const value = await fn();
        await this.set(key, value, ttl);
        return value;
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CacheService);
//# sourceMappingURL=cache.service.js.map