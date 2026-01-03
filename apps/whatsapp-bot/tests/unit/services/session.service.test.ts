/**
 * Testes unitários do SessionService
 */

import { SessionService } from '../../../src/services/session.service';

describe('SessionService', () => {
  let sessionService: SessionService;
  const testPhone = '5511999999999@s.whatsapp.net';

  beforeEach(() => {
    sessionService = new SessionService();
  });

  describe('getSession', () => {
    it('deve criar nova sessão se não existir', () => {
      const session = sessionService.getSession(testPhone);
      expect(session).toBeDefined();
      expect(session.token).toBeUndefined();
    });

    it('deve retornar sessão existente', () => {
      const session1 = sessionService.getSession(testPhone);
      session1.token = 'test-token';

      const session2 = sessionService.getSession(testPhone);
      expect(session2.token).toBe('test-token');
    });
  });

  describe('setSession', () => {
    it('deve atualizar sessão parcialmente', () => {
      sessionService.setSession(testPhone, { token: 'new-token' });
      const session = sessionService.getSession(testPhone);
      expect(session.token).toBe('new-token');
    });

    it('deve fazer merge com dados existentes', () => {
      sessionService.setSession(testPhone, { token: 'token1' });
      sessionService.setSession(testPhone, { user: { name: 'João' } });

      const session = sessionService.getSession(testPhone);
      expect(session.token).toBe('token1');
      expect(session.user?.name).toBe('João');
    });
  });

  describe('clearSession', () => {
    it('deve limpar sessão completamente', () => {
      sessionService.setSession(testPhone, { token: 'test' });
      sessionService.clearSession(testPhone);

      const session = sessionService.getSession(testPhone);
      expect(session.token).toBeUndefined();
    });
  });

  describe('isAuthenticated', () => {
    it('deve retornar false se não tiver token', () => {
      expect(sessionService.isAuthenticated(testPhone)).toBe(false);
    });

    it('deve retornar true se tiver token', () => {
      sessionService.setSession(testPhone, { token: 'valid-token' });
      expect(sessionService.isAuthenticated(testPhone)).toBe(true);
    });
  });

  describe('isOnboarding', () => {
    it('deve retornar false se onboardingStep >= 5', () => {
      sessionService.setSession(testPhone, {
        user: { name: 'João', onboardingStep: 5 }
      });
      expect(sessionService.isOnboarding(testPhone)).toBe(false);
    });

    it('deve retornar true se onboardingStep < 5', () => {
      sessionService.setSession(testPhone, {
        user: { name: 'João', onboardingStep: 2 }
      });
      expect(sessionService.isOnboarding(testPhone)).toBe(true);
    });

    it('deve retornar false se não tiver onboardingStep', () => {
      sessionService.setSession(testPhone, {
        user: { name: 'João' }
      });
      expect(sessionService.isOnboarding(testPhone)).toBe(false);
    });
  });

  describe('getToken', () => {
    it('deve retornar token se existir', () => {
      sessionService.setSession(testPhone, { token: 'my-token' });
      expect(sessionService.getToken(testPhone)).toBe('my-token');
    });

    it('deve retornar undefined se não tiver token', () => {
      expect(sessionService.getToken(testPhone)).toBeUndefined();
    });
  });

  describe('getStats', () => {
    it('deve retornar estatísticas corretas', () => {
      // 2 usuários autenticados, 1 em onboarding
      sessionService.setSession('user1@s.whatsapp.net', { token: 'token1' });
      sessionService.setSession('user2@s.whatsapp.net', {
        token: 'token2',
        user: { name: 'User2', onboardingStep: 3 }
      });
      sessionService.setSession('user3@s.whatsapp.net', { token: 'token3' });

      const stats = sessionService.getStats();
      expect(stats.totalSessions).toBe(3);
      expect(stats.authenticated).toBe(3);
      expect(stats.onboarding).toBe(1);
    });

    it('deve retornar zeros se não houver sessões', () => {
      const stats = sessionService.getStats();
      expect(stats.totalSessions).toBe(0);
      expect(stats.authenticated).toBe(0);
      expect(stats.onboarding).toBe(0);
    });
  });
});
