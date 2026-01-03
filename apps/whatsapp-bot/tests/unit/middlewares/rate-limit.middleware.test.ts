/**
 * Testes unitários do RateLimitMiddleware
 */

import { RateLimitMiddleware } from '../../../src/middlewares/rate-limit.middleware';

describe('RateLimitMiddleware', () => {
  let rateLimiter: RateLimitMiddleware;
  const testPhone = '5511999999999@s.whatsapp.net';

  beforeEach(() => {
    // Reseta variável de ambiente para testes
    process.env.RATE_LIMIT_MESSAGES_PER_MINUTE = '5'; // Limita a 5 para testes rápidos
    rateLimiter = new RateLimitMiddleware();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('isRateLimited', () => {
    it('deve permitir primeira mensagem', () => {
      expect(rateLimiter.isRateLimited(testPhone)).toBe(false);
    });

    it('deve permitir mensagens dentro do limite', () => {
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.isRateLimited(testPhone)).toBe(false);
      }
    });

    it('deve bloquear quando exceder limite', () => {
      // Envia 5 mensagens (limite)
      for (let i = 0; i < 5; i++) {
        rateLimiter.isRateLimited(testPhone);
      }

      // 6ª mensagem deve ser bloqueada
      expect(rateLimiter.isRateLimited(testPhone)).toBe(true);
    });

    it('deve rastrear usuários separadamente', () => {
      const phone1 = 'user1@s.whatsapp.net';
      const phone2 = 'user2@s.whatsapp.net';

      // User1 envia 5 mensagens
      for (let i = 0; i < 5; i++) {
        rateLimiter.isRateLimited(phone1);
      }

      // User2 ainda pode enviar
      expect(rateLimiter.isRateLimited(phone2)).toBe(false);

      // User1 está bloqueado
      expect(rateLimiter.isRateLimited(phone1)).toBe(true);
    });

    it('deve desbloquear após período de bloqueio', () => {
      jest.useFakeTimers();

      // Envia 6 mensagens para bloquear
      for (let i = 0; i < 6; i++) {
        rateLimiter.isRateLimited(testPhone);
      }

      expect(rateLimiter.isRateLimited(testPhone)).toBe(true);

      // Avança 1 minuto + 1ms
      jest.advanceTimersByTime(60001);

      // Deve estar desbloqueado
      expect(rateLimiter.isRateLimited(testPhone)).toBe(false);

      jest.useRealTimers();
    });

    it('deve limpar timestamps antigos (sliding window)', () => {
      jest.useFakeTimers();

      // Envia 3 mensagens
      for (let i = 0; i < 3; i++) {
        rateLimiter.isRateLimited(testPhone);
      }

      // Avança 61 segundos (fora da janela de 1 minuto)
      jest.advanceTimersByTime(61000);

      // Envia mais 5 mensagens (deve permitir pois as antigas foram limpas)
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.isRateLimited(testPhone)).toBe(false);
      }

      jest.useRealTimers();
    });
  });

  describe('getRemainingTime', () => {
    it('deve retornar 0 se não estiver bloqueado', () => {
      expect(rateLimiter.getRemainingTime(testPhone)).toBe(0);
    });

    it('deve retornar tempo restante se bloqueado', () => {
      jest.useFakeTimers();

      // Bloqueia usuário
      for (let i = 0; i < 6; i++) {
        rateLimiter.isRateLimited(testPhone);
      }

      const remaining = rateLimiter.getRemainingTime(testPhone);
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(60000); // Máximo 1 minuto

      jest.useRealTimers();
    });

    it('deve retornar 0 após período de bloqueio expirar', () => {
      jest.useFakeTimers();

      // Bloqueia
      for (let i = 0; i < 6; i++) {
        rateLimiter.isRateLimited(testPhone);
      }

      // Avança 1 minuto
      jest.advanceTimersByTime(60001);

      expect(rateLimiter.getRemainingTime(testPhone)).toBe(0);

      jest.useRealTimers();
    });
  });

  describe('clearRateLimit', () => {
    it('deve limpar rate limit de usuário específico', () => {
      // Bloqueia usuário
      for (let i = 0; i < 6; i++) {
        rateLimiter.isRateLimited(testPhone);
      }

      expect(rateLimiter.isRateLimited(testPhone)).toBe(true);

      // Limpa
      rateLimiter.clearRateLimit(testPhone);

      // Deve estar desbloqueado
      expect(rateLimiter.isRateLimited(testPhone)).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('deve remover entries antigas', () => {
      jest.useFakeTimers();

      const phone1 = 'old@s.whatsapp.net';
      const phone2 = 'recent@s.whatsapp.net';

      // Cria entry antiga
      rateLimiter.isRateLimited(phone1);

      // Avança 2 horas
      jest.advanceTimersByTime(2 * 60 * 60 * 1000);

      // Cria entry recente
      rateLimiter.isRateLimited(phone2);

      // Executa cleanup
      rateLimiter.cleanup();

      // Verifica estatísticas (phone1 deve ter sido removido)
      const stats = rateLimiter.getStats();
      expect(stats.totalTracked).toBe(1); // Apenas phone2

      jest.useRealTimers();
    });

    it('não deve remover entries bloqueadas', () => {
      jest.useFakeTimers();

      // Bloqueia usuário
      for (let i = 0; i < 6; i++) {
        rateLimiter.isRateLimited(testPhone);
      }

      // Avança 2 horas (mas ainda está bloqueado por 1 minuto)
      jest.advanceTimersByTime(2000);

      rateLimiter.cleanup();

      const stats = rateLimiter.getStats();
      expect(stats.currentlyBlocked).toBe(1);

      jest.useRealTimers();
    });
  });

  describe('getStats', () => {
    it('deve retornar estatísticas corretas', () => {
      const phone1 = 'user1@s.whatsapp.net';
      const phone2 = 'user2@s.whatsapp.net';
      const phone3 = 'user3@s.whatsapp.net';

      // User1 e User2 enviam mensagens
      rateLimiter.isRateLimited(phone1);
      rateLimiter.isRateLimited(phone2);

      // User3 é bloqueado
      for (let i = 0; i < 6; i++) {
        rateLimiter.isRateLimited(phone3);
      }

      const stats = rateLimiter.getStats();
      expect(stats.totalTracked).toBe(3);
      expect(stats.activeUsers).toBe(3);
      expect(stats.currentlyBlocked).toBe(1);
    });

    it('deve retornar zeros quando vazio', () => {
      const stats = rateLimiter.getStats();
      expect(stats.totalTracked).toBe(0);
      expect(stats.activeUsers).toBe(0);
      expect(stats.currentlyBlocked).toBe(0);
    });
  });
});
