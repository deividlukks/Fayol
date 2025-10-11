import { UserSession } from './api.service';
import { redisService } from './redis.service';
import { config } from '../config';

const SESSION_PREFIX = 'telegram:session:';
const STATE_PREFIX = 'telegram:state:';
const SESSION_TTL = config.redis.ttl;

export class SessionService {
  // Fallback to in-memory if Redis is not available
  private sessions: Map<number, UserSession> = new Map();
  private userStates: Map<number, any> = new Map();

  private getSessionKey(telegramId: number): string {
    return `${SESSION_PREFIX}${telegramId}`;
  }

  private getStateKey(telegramId: number): string {
    return `${STATE_PREFIX}${telegramId}`;
  }

  async saveSession(telegramId: number, session: UserSession): Promise<void> {
    try {
      const key = this.getSessionKey(telegramId);
      await redisService.set(key, session, SESSION_TTL);
    } catch (error) {
      console.warn('Redis unavailable, using in-memory session storage:', error);
      this.sessions.set(telegramId, session);
    }
  }

  async getSession(telegramId: number): Promise<UserSession | null> {
    try {
      const key = this.getSessionKey(telegramId);
      const session = await redisService.get<UserSession>(key);

      // Extend TTL on access
      if (session) {
        await redisService.expire(key, SESSION_TTL);
      }

      return session;
    } catch (error) {
      console.warn('Redis unavailable, using in-memory session storage:', error);
      return this.sessions.get(telegramId) || null;
    }
  }

  async deleteSession(telegramId: number): Promise<void> {
    try {
      await redisService.delete(this.getSessionKey(telegramId));
      await redisService.delete(this.getStateKey(telegramId));
    } catch (error) {
      console.warn('Redis unavailable, using in-memory session storage:', error);
      this.sessions.delete(telegramId);
      this.userStates.delete(telegramId);
    }
  }

  async isAuthenticated(telegramId: number): Promise<boolean> {
    try {
      const key = this.getSessionKey(telegramId);
      return await redisService.exists(key);
    } catch (error) {
      console.warn('Redis unavailable, using in-memory session storage:', error);
      return this.sessions.has(telegramId);
    }
  }

  async saveUserState(telegramId: number, state: any): Promise<void> {
    try {
      const key = this.getStateKey(telegramId);
      // User states expire after 30 minutes of inactivity
      await redisService.set(key, state, 1800);
    } catch (error) {
      console.warn('Redis unavailable, using in-memory state storage:', error);
      this.userStates.set(telegramId, state);
    }
  }

  async getUserState(telegramId: number): Promise<any> {
    try {
      const key = this.getStateKey(telegramId);
      const state = await redisService.get(key);

      // Extend TTL on access
      if (state) {
        await redisService.expire(key, 1800);
      }

      return state;
    } catch (error) {
      console.warn('Redis unavailable, using in-memory state storage:', error);
      return this.userStates.get(telegramId);
    }
  }

  async clearUserState(telegramId: number): Promise<void> {
    try {
      await redisService.delete(this.getStateKey(telegramId));
    } catch (error) {
      console.warn('Redis unavailable, using in-memory state storage:', error);
      this.userStates.delete(telegramId);
    }
  }

  async getAllSessions(): Promise<number[]> {
    try {
      const keys = await redisService.keys(`${SESSION_PREFIX}*`);
      return keys.map(key => parseInt(key.replace(SESSION_PREFIX, ''), 10));
    } catch (error) {
      console.warn('Redis unavailable, using in-memory session storage:', error);
      return Array.from(this.sessions.keys());
    }
  }
}

export const sessionService = new SessionService();
