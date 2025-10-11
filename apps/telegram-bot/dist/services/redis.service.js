"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisService = exports.RedisService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = require("../config");
class RedisService {
    client;
    isConnected = false;
    constructor() {
        this.client = new ioredis_1.default({
            host: config_1.config.redis.host,
            port: config_1.config.redis.port,
            password: config_1.config.redis.password,
            db: config_1.config.redis.db || 0,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3,
        });
        this.client.on('connect', () => {
            console.log('✅ Redis connected');
            this.isConnected = true;
        });
        this.client.on('error', (err) => {
            console.error('❌ Redis error:', err);
            this.isConnected = false;
        });
        this.client.on('close', () => {
            console.log('🔌 Redis connection closed');
            this.isConnected = false;
        });
    }
    async set(key, value, ttl) {
        const serialized = JSON.stringify(value);
        if (ttl) {
            await this.client.setex(key, ttl, serialized);
        }
        else {
            await this.client.set(key, serialized);
        }
    }
    async get(key) {
        const value = await this.client.get(key);
        if (!value)
            return null;
        return JSON.parse(value);
    }
    async delete(key) {
        await this.client.del(key);
    }
    async exists(key) {
        const result = await this.client.exists(key);
        return result === 1;
    }
    async keys(pattern) {
        return this.client.keys(pattern);
    }
    async expire(key, ttl) {
        await this.client.expire(key, ttl);
    }
    async ttl(key) {
        return this.client.ttl(key);
    }
    getClient() {
        return this.client;
    }
    async disconnect() {
        await this.client.quit();
        this.isConnected = false;
    }
    isReady() {
        return this.isConnected;
    }
    async ping() {
        try {
            const result = await this.client.ping();
            return result === 'PONG';
        }
        catch {
            return false;
        }
    }
}
exports.RedisService = RedisService;
exports.redisService = new RedisService();
//# sourceMappingURL=redis.service.js.map