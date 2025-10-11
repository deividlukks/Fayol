"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionService = exports.SessionService = void 0;
const redis_service_1 = require("./redis.service");
const config_1 = require("../config");
const SESSION_PREFIX = 'telegram:session:';
const STATE_PREFIX = 'telegram:state:';
const SESSION_TTL = config_1.config.redis.ttl;
class SessionService {
    // Fallback to in-memory if Redis is not available
    sessions = new Map();
    userStates = new Map();
    getSessionKey(telegramId) {
        return `${SESSION_PREFIX}${telegramId}`;
    }
    getStateKey(telegramId) {
        return `${STATE_PREFIX}${telegramId}`;
    }
    async saveSession(telegramId, session) {
        try {
            const key = this.getSessionKey(telegramId);
            await redis_service_1.redisService.set(key, session, SESSION_TTL);
        }
        catch (error) {
            console.warn('Redis unavailable, using in-memory session storage:', error);
            this.sessions.set(telegramId, session);
        }
    }
    async getSession(telegramId) {
        try {
            const key = this.getSessionKey(telegramId);
            const session = await redis_service_1.redisService.get(key);
            // Extend TTL on access
            if (session) {
                await redis_service_1.redisService.expire(key, SESSION_TTL);
            }
            return session;
        }
        catch (error) {
            console.warn('Redis unavailable, using in-memory session storage:', error);
            return this.sessions.get(telegramId) || null;
        }
    }
    async deleteSession(telegramId) {
        try {
            await redis_service_1.redisService.delete(this.getSessionKey(telegramId));
            await redis_service_1.redisService.delete(this.getStateKey(telegramId));
        }
        catch (error) {
            console.warn('Redis unavailable, using in-memory session storage:', error);
            this.sessions.delete(telegramId);
            this.userStates.delete(telegramId);
        }
    }
    async isAuthenticated(telegramId) {
        try {
            const key = this.getSessionKey(telegramId);
            return await redis_service_1.redisService.exists(key);
        }
        catch (error) {
            console.warn('Redis unavailable, using in-memory session storage:', error);
            return this.sessions.has(telegramId);
        }
    }
    async saveUserState(telegramId, state) {
        try {
            const key = this.getStateKey(telegramId);
            // User states expire after 30 minutes of inactivity
            await redis_service_1.redisService.set(key, state, 1800);
        }
        catch (error) {
            console.warn('Redis unavailable, using in-memory state storage:', error);
            this.userStates.set(telegramId, state);
        }
    }
    async getUserState(telegramId) {
        try {
            const key = this.getStateKey(telegramId);
            const state = await redis_service_1.redisService.get(key);
            // Extend TTL on access
            if (state) {
                await redis_service_1.redisService.expire(key, 1800);
            }
            return state;
        }
        catch (error) {
            console.warn('Redis unavailable, using in-memory state storage:', error);
            return this.userStates.get(telegramId);
        }
    }
    async clearUserState(telegramId) {
        try {
            await redis_service_1.redisService.delete(this.getStateKey(telegramId));
        }
        catch (error) {
            console.warn('Redis unavailable, using in-memory state storage:', error);
            this.userStates.delete(telegramId);
        }
    }
    async getAllSessions() {
        try {
            const keys = await redis_service_1.redisService.keys(`${SESSION_PREFIX}*`);
            return keys.map(key => parseInt(key.replace(SESSION_PREFIX, ''), 10));
        }
        catch (error) {
            console.warn('Redis unavailable, using in-memory session storage:', error);
            return Array.from(this.sessions.keys());
        }
    }
}
exports.SessionService = SessionService;
exports.sessionService = new SessionService();
//# sourceMappingURL=session.service.js.map