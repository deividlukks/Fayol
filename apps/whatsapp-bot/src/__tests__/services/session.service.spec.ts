import { sessionService } from '../../services/session.service';
import { UserSession } from '../../types/session.types';

describe('SessionService', () => {
  const mockPhoneNumber = '5534999999999';
  const mockSession: UserSession = {
    userId: 'user-123',
    accessToken: 'token-abc',
    refreshToken: 'refresh-xyz',
  };

  beforeEach(() => {
    // Clear all sessions before each test
    (sessionService as any).sessions.clear();
    (sessionService as any).userStates.clear();
  });

  describe('Session Management', () => {
    it('deve armazenar uma sessão', () => {
      sessionService.setSession(mockPhoneNumber, mockSession);

      expect(sessionService.hasSession(mockPhoneNumber)).toBe(true);
    });

    it('deve recuperar uma sessão armazenada', () => {
      sessionService.setSession(mockPhoneNumber, mockSession);

      const session = sessionService.getSession(mockPhoneNumber);

      expect(session).toEqual(mockSession);
    });

    it('deve retornar undefined para sessão inexistente', () => {
      const session = sessionService.getSession('non-existent');

      expect(session).toBeUndefined();
    });

    it('deve verificar se sessão existe', () => {
      expect(sessionService.hasSession(mockPhoneNumber)).toBe(false);

      sessionService.setSession(mockPhoneNumber, mockSession);

      expect(sessionService.hasSession(mockPhoneNumber)).toBe(true);
    });

    it('deve limpar uma sessão', () => {
      sessionService.setSession(mockPhoneNumber, mockSession);
      expect(sessionService.hasSession(mockPhoneNumber)).toBe(true);

      sessionService.clearSession(mockPhoneNumber);

      expect(sessionService.hasSession(mockPhoneNumber)).toBe(false);
      expect(sessionService.getSession(mockPhoneNumber)).toBeUndefined();
    });

    it('deve limpar estado do usuário ao limpar sessão', () => {
      sessionService.setSession(mockPhoneNumber, mockSession);
      sessionService.setUserState(mockPhoneNumber, { step: 'test', data: {} });

      sessionService.clearSession(mockPhoneNumber);

      expect(sessionService.getUserState(mockPhoneNumber)).toBeUndefined();
    });
  });

  describe('User State Management', () => {
    it('deve armazenar estado do usuário', () => {
      const state = { step: 'awaiting_amount', data: { category: 'food' } };

      sessionService.setUserState(mockPhoneNumber, state);

      expect(sessionService.getUserState(mockPhoneNumber)).toEqual(state);
    });

    it('deve retornar undefined para estado inexistente', () => {
      const state = sessionService.getUserState('non-existent');

      expect(state).toBeUndefined();
    });

    it('deve limpar estado do usuário', () => {
      sessionService.setUserState(mockPhoneNumber, { step: 'test' });

      sessionService.clearUserState(mockPhoneNumber);

      expect(sessionService.getUserState(mockPhoneNumber)).toBeUndefined();
    });

    it('deve atualizar estado do usuário parcialmente', () => {
      const initialState = { step: 'step1', data: { value: 100 } };
      sessionService.setUserState(mockPhoneNumber, initialState);

      sessionService.updateUserState(mockPhoneNumber, { step: 'step2' });

      const updatedState = sessionService.getUserState(mockPhoneNumber);
      expect(updatedState).toEqual({
        step: 'step2',
        data: { value: 100 },
      });
    });

    it('deve criar novo estado se não existir ao atualizar', () => {
      sessionService.updateUserState(mockPhoneNumber, { step: 'new_step' });

      const state = sessionService.getUserState(mockPhoneNumber);
      expect(state).toEqual({ step: 'new_step' });
    });

    it('deve mesclar dados corretamente ao atualizar', () => {
      sessionService.setUserState(mockPhoneNumber, {
        step: 'step1',
        data: { a: 1, b: 2 },
      });

      sessionService.updateUserState(mockPhoneNumber, {
        data: { b: 3, c: 4 },
      });

      const state = sessionService.getUserState(mockPhoneNumber);
      expect(state).toEqual({
        step: 'step1',
        data: { b: 3, c: 4 },
      });
    });
  });

  describe('Múltiplas Sessões', () => {
    it('deve gerenciar múltiplas sessões independentemente', () => {
      const phone1 = '5534999999999';
      const phone2 = '5534888888888';
      const session1: UserSession = {
        userId: 'user-1',
        accessToken: 'token-1',
        refreshToken: 'refresh-1',
      };
      const session2: UserSession = {
        userId: 'user-2',
        accessToken: 'token-2',
        refreshToken: 'refresh-2',
      };

      sessionService.setSession(phone1, session1);
      sessionService.setSession(phone2, session2);

      expect(sessionService.getSession(phone1)).toEqual(session1);
      expect(sessionService.getSession(phone2)).toEqual(session2);
    });

    it('deve limpar apenas a sessão especificada', () => {
      const phone1 = '5534999999999';
      const phone2 = '5534888888888';

      sessionService.setSession(phone1, mockSession);
      sessionService.setSession(phone2, mockSession);

      sessionService.clearSession(phone1);

      expect(sessionService.hasSession(phone1)).toBe(false);
      expect(sessionService.hasSession(phone2)).toBe(true);
    });
  });
});
