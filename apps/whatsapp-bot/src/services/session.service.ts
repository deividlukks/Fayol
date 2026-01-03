/**
 * Gerenciamento de sessões de usuários
 * Substitui o middleware de sessão do Telegraf
 *
 * Para MVP: Armazenamento em memória (Map)
 * Para produção: Migrar para Redis
 */

import { ISessionService, UserSession, SessionStats } from './ISessionService';

export class SessionService implements ISessionService {
  public sessions: Map<string, UserSession> = new Map();

  /**
   * Obtém sessão do usuário (cria se não existir)
   */
  getSession(phoneNumber: string): UserSession {
    if (!this.sessions.has(phoneNumber)) {
      this.sessions.set(phoneNumber, {});
    }
    return this.sessions.get(phoneNumber)!;
  }

  /**
   * Atualiza sessão do usuário (merge parcial)
   */
  setSession(phoneNumber: string, session: Partial<UserSession>): void {
    const current = this.getSession(phoneNumber);
    this.sessions.set(phoneNumber, { ...current, ...session });
  }

  /**
   * Limpa sessão do usuário (logout)
   */
  clearSession(phoneNumber: string): void {
    this.sessions.delete(phoneNumber);
  }

  /**
   * Verifica se usuário está autenticado
   */
  isAuthenticated(phoneNumber: string): boolean {
    const session = this.getSession(phoneNumber);
    return !!session.token;
  }

  /**
   * Verifica se usuário está em onboarding
   */
  isOnboarding(phoneNumber: string): boolean {
    const session = this.getSession(phoneNumber);
    return (
      session.user?.onboardingStep !== undefined &&
      session.user.onboardingStep < 5
    );
  }

  /**
   * Obtém token JWT do usuário
   */
  getToken(phoneNumber: string): string | null {
    return this.getSession(phoneNumber).token || null;
  }

  /**
   * Estatísticas (útil para monitoramento)
   */
  getStats(): SessionStats {
    let authenticated = 0;
    let onboarding = 0;

    for (const [phone, session] of this.sessions.entries()) {
      if (session.token) authenticated++;
      if (session.user?.onboardingStep !== undefined && session.user.onboardingStep < 5) {
        onboarding++;
      }
    }

    return {
      totalSessions: this.sessions.size,
      authenticated,
      onboarding,
    };
  }
}
