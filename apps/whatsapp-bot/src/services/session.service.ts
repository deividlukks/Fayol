import { UserSession, UserState } from '../types/session.types';

class SessionService {
  private sessions: Map<string, UserSession> = new Map();
  private userStates: Map<string, UserState> = new Map();

  // Session management
  setSession(phoneNumber: string, session: UserSession) {
    this.sessions.set(phoneNumber, session);
  }

  getSession(phoneNumber: string): UserSession | undefined {
    return this.sessions.get(phoneNumber);
  }

  clearSession(phoneNumber: string) {
    this.sessions.delete(phoneNumber);
    this.userStates.delete(phoneNumber);
  }

  hasSession(phoneNumber: string): boolean {
    return this.sessions.has(phoneNumber);
  }

  // User state management (for conversation flows)
  setUserState(phoneNumber: string, state: UserState) {
    this.userStates.set(phoneNumber, state);
  }

  getUserState(phoneNumber: string): UserState | undefined {
    return this.userStates.get(phoneNumber);
  }

  clearUserState(phoneNumber: string) {
    this.userStates.delete(phoneNumber);
  }

  updateUserState(phoneNumber: string, updates: Partial<UserState>) {
    const current = this.userStates.get(phoneNumber) || {};
    this.userStates.set(phoneNumber, { ...current, ...updates });
  }
}

export const sessionService = new SessionService();
