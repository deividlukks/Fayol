import { logger } from '../utils/logger';
import { config } from '../config/app.config';

/**
 * Rate Limiter para prevenir spam
 * 
 * Limites:
 * - Máximo de mensagens por minuto
 * - Máximo de mensagens por hora
 * 
 * Para produção, considere usar Redis
 */
export class RateLimiter {
  private static messageCountPerMinute: Map<string, number[]> = new Map();
  private static messageCountPerHour: Map<string, number[]> = new Map();

  /**
   * Verifica se usuário excedeu limite de mensagens
   */
  static checkLimit(phone: string): {
    allowed: boolean;
    reason?: string;
  } {
    const now = Date.now();

    // Limpa contadores antigos
    this.cleanOldCounters(phone, now);

    // Verifica limite por minuto
    const countPerMinute = this.messageCountPerMinute.get(phone)?.length || 0;
    if (countPerMinute >= config.rateLimit.maxMessagesPerMinute) {
      logger.warn(`[RateLimiter] ${phone} excedeu limite por minuto (${countPerMinute})`);
      return {
        allowed: false,
        reason: `Você está enviando mensagens muito rápido. Aguarde um momento.`,
      };
    }

    // Verifica limite por hora
    const countPerHour = this.messageCountPerHour.get(phone)?.length || 0;
    if (countPerHour >= config.rateLimit.maxMessagesPerHour) {
      logger.warn(`[RateLimiter] ${phone} excedeu limite por hora (${countPerHour})`);
      return {
        allowed: false,
        reason: `Você atingiu o limite de mensagens por hora. Tente novamente mais tarde.`,
      };
    }

    // Registra nova mensagem
    this.registerMessage(phone, now);

    return { allowed: true };
  }

  /**
   * Registra nova mensagem
   */
  private static registerMessage(phone: string, timestamp: number): void {
    // Por minuto
    if (!this.messageCountPerMinute.has(phone)) {
      this.messageCountPerMinute.set(phone, []);
    }
    this.messageCountPerMinute.get(phone)!.push(timestamp);

    // Por hora
    if (!this.messageCountPerHour.has(phone)) {
      this.messageCountPerHour.set(phone, []);
    }
    this.messageCountPerHour.get(phone)!.push(timestamp);
  }

  /**
   * Remove contadores antigos
   */
  private static cleanOldCounters(phone: string, now: number): void {
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    // Limpa contadores por minuto
    if (this.messageCountPerMinute.has(phone)) {
      const filtered = this.messageCountPerMinute
        .get(phone)!
        .filter((timestamp) => timestamp > oneMinuteAgo);
      
      if (filtered.length > 0) {
        this.messageCountPerMinute.set(phone, filtered);
      } else {
        this.messageCountPerMinute.delete(phone);
      }
    }

    // Limpa contadores por hora
    if (this.messageCountPerHour.has(phone)) {
      const filtered = this.messageCountPerHour
        .get(phone)!
        .filter((timestamp) => timestamp > oneHourAgo);
      
      if (filtered.length > 0) {
        this.messageCountPerHour.set(phone, filtered);
      } else {
        this.messageCountPerHour.delete(phone);
      }
    }
  }

  /**
   * Limpa todos os contadores (útil para testes)
   */
  static reset(): void {
    this.messageCountPerMinute.clear();
    this.messageCountPerHour.clear();
    logger.info('[RateLimiter] Contadores resetados');
  }

  /**
   * Obtém estatísticas de uso
   */
  static getStatistics(phone: string): {
    perMinute: number;
    perHour: number;
    limits: {
      perMinute: number;
      perHour: number;
    };
  } {
    const now = Date.now();
    this.cleanOldCounters(phone, now);

    return {
      perMinute: this.messageCountPerMinute.get(phone)?.length || 0,
      perHour: this.messageCountPerHour.get(phone)?.length || 0,
      limits: {
        perMinute: config.rateLimit.maxMessagesPerMinute,
        perHour: config.rateLimit.maxMessagesPerHour,
      },
    };
  }
}
