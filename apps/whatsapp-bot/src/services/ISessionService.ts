/**
 * Interface para serviços de sessão
 * Permite uso intercambiável de SessionService (memória) e RedisSessionService
 */

export interface UserSession {
  token?: string;
  isAuthenticated?: boolean;
  user?: {
    name: string;
    onboardingStep?: number;
  };
  currentScene?: 'login' | 'onboarding' | null;
  sceneStep?: number;
  sceneData?: any;
}

export interface SessionStats {
  totalSessions: number;
  authenticated: number;
  onboarding: number;
}

export interface ISessionService {
  getSession(phoneNumber: string): UserSession | Promise<UserSession>;
  setSession(phoneNumber: string, session: Partial<UserSession>): void | Promise<void>;
  clearSession(phoneNumber: string): void | Promise<void>;
  isAuthenticated(phoneNumber: string): boolean | Promise<boolean>;
  isOnboarding(phoneNumber: string): boolean | Promise<boolean>;
  getToken(phoneNumber: string): string | null | Promise<string | null>;
  getStats(): SessionStats | Promise<SessionStats>;
}
