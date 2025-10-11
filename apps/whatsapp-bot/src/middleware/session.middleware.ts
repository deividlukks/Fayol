import { logger } from '../utils/logger';

/**
 * Gerenciador de sessões de usuários
 * 
 * Armazena sessões ativas em memória
 * Para produção, considere usar Redis
 */
export class SessionManager {
  private static sessions: Map<string, {
    userId: string;
    phone: string;
    token: string;
    tier: 'free' | 'premium';
    createdAt: Date;
    lastActivity: Date;
  }> = new Map();

  /**
   * Cria ou atualiza sessão
   */
  static setSession(
    phone: string,
    data: {
      userId: string;
      token: string;
      tier: 'free' | 'premium';
    }
  ): void {
    this.sessions.set(phone, {
      ...data,
      phone,
      createdAt: new Date(),
      lastActivity: new Date(),
    });

    logger.info(`[SessionManager] Sessão criada para ${phone}`);
  }

  /**
   * Obtém sessão por telefone
   */
  static getSession(phone: string) {
    const session = this.sessions.get(phone);

    if (session) {
      // Atualiza última atividade
      session.lastActivity = new Date();
    }

    return session;
  }

  /**
   * Remove sessão (logout)
   */
  static removeSession(phone: string): void {
    this.sessions.delete(phone);
    logger.info(`[SessionManager] Sessão removida para ${phone}`);
  }

  /**
   * Verifica se usuário está autenticado
   */
  static isAuthenticated(phone: string): boolean {
    return this.sessions.has(phone);
  }

  /**
   * Limpa sessões expiradas (> 7 dias sem atividade)
   */
  static cleanExpiredSessions(): void {
    const now = new Date();
    const expirationTime = 7 * 24 * 60 * 60 * 1000; // 7 dias

    let cleaned = 0;

    for (const [phone, session] of this.sessions.entries()) {
      const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();

      if (timeSinceLastActivity > expirationTime) {
        this.sessions.delete(phone);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`[SessionManager] ${cleaned} sessões expiradas removidas`);
    }
  }

  /**
   * Obtém estatísticas de sessões
   */
  static getStatistics(): {
    total: number;
    byTier: { free: number; premium: number };
  } {
    const stats = {
      total: this.sessions.size,
      byTier: { free: 0, premium: 0 },
    };

    for (const session of this.sessions.values()) {
      stats.byTier[session.tier]++;
    }

    return stats;
  }
}
