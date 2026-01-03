/**
 * Middleware de Rate Limiting para WhatsApp Bot
 * Previne spam e abuso de mensagens
 *
 * Implementação: Sliding Window com Map em memória
 * Produção: Migrar para Redis com TTL automático
 */

interface RateLimitEntry {
  timestamps: number[]; // Array de timestamps de mensagens
  blockedUntil?: number; // Timestamp até quando está bloqueado
}

export class RateLimitMiddleware {
  private rateLimits: Map<string, RateLimitEntry> = new Map();
  private readonly maxMessagesPerMinute: number;
  private readonly blockDurationMs: number;

  constructor() {
    this.maxMessagesPerMinute = parseInt(
      process.env.RATE_LIMIT_MESSAGES_PER_MINUTE || '30',
      10
    );
    this.blockDurationMs = 60 * 1000; // 1 minuto de bloqueio
  }

  /**
   * Verifica se o usuário está rate limited
   */
  isRateLimited(phoneNumber: string): boolean {
    const now = Date.now();
    const entry = this.getEntry(phoneNumber);

    // Se está bloqueado, verifica se ainda está no período de bloqueio
    if (entry.blockedUntil && entry.blockedUntil > now) {
      return true;
    }

    // Remove timestamps antigos (fora da janela de 1 minuto)
    entry.timestamps = entry.timestamps.filter(
      (ts) => now - ts < 60 * 1000
    );

    // Adiciona timestamp atual
    entry.timestamps.push(now);

    // Verifica se excedeu o limite
    if (entry.timestamps.length > this.maxMessagesPerMinute) {
      entry.blockedUntil = now + this.blockDurationMs;
      this.rateLimits.set(phoneNumber, entry);

      console.warn(
        `⚠️ Rate limit excedido: ${phoneNumber} (${entry.timestamps.length} msgs/min)`
      );

      return true;
    }

    this.rateLimits.set(phoneNumber, entry);
    return false;
  }

  /**
   * Retorna tempo restante de bloqueio em milissegundos
   */
  getRemainingTime(phoneNumber: string): number {
    const entry = this.getEntry(phoneNumber);

    if (!entry.blockedUntil) {
      return 0;
    }

    const remaining = entry.blockedUntil - Date.now();
    return remaining > 0 ? remaining : 0;
  }

  /**
   * Obtém ou cria entrada de rate limit
   */
  private getEntry(phoneNumber: string): RateLimitEntry {
    if (!this.rateLimits.has(phoneNumber)) {
      this.rateLimits.set(phoneNumber, { timestamps: [] });
    }
    return this.rateLimits.get(phoneNumber)!;
  }

  /**
   * Limpa rate limit de um usuário (útil para testes ou admin override)
   */
  clearRateLimit(phoneNumber: string): void {
    this.rateLimits.delete(phoneNumber);
  }

  /**
   * Limpa entries antigas (executar periodicamente)
   */
  cleanup(): void {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    for (const [phoneNumber, entry] of this.rateLimits.entries()) {
      // Remove se não tem timestamps recentes e não está bloqueado
      const hasRecentActivity = entry.timestamps.some((ts) => ts > oneHourAgo);
      const isBlocked = entry.blockedUntil && entry.blockedUntil > now;

      if (!hasRecentActivity && !isBlocked) {
        this.rateLimits.delete(phoneNumber);
      }
    }
  }

  /**
   * Estatísticas de rate limiting (útil para monitoramento)
   */
  getStats(): {
    totalTracked: number;
    currentlyBlocked: number;
    activeUsers: number;
  } {
    const now = Date.now();
    let blocked = 0;
    let active = 0;

    for (const entry of this.rateLimits.values()) {
      if (entry.blockedUntil && entry.blockedUntil > now) {
        blocked++;
      }
      if (entry.timestamps.length > 0) {
        active++;
      }
    }

    return {
      totalTracked: this.rateLimits.size,
      currentlyBlocked: blocked,
      activeUsers: active,
    };
  }
}
