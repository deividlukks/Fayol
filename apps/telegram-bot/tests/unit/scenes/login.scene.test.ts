/**
 * Testes unitários para login.scene
 */

import { Scenes } from 'telegraf';
import { BotApiService } from '../../../src/services/bot-api.service';
import { createMockContext } from '../../mocks/telegraf.mock';

// Mock do BotApiService
jest.mock('../../../src/services/bot-api.service');

describe('Login Scene', () => {
  let mockApiService: jest.Mocked<BotApiService>;
  let loginWizard: Scenes.WizardScene<any>;

  beforeEach(() => {
    // Limpa o cache de módulos para reimportar a cena
    jest.clearAllMocks();
    jest.resetModules();

    mockApiService = {
      checkUser: jest.fn(),
      login: jest.fn(),
    } as any;

    (BotApiService as jest.Mock).mockImplementation(() => mockApiService);

    // Importa a cena após o mock
    const { loginWizard: wizard } = require('../../../src/scenes/login.scene');
    loginWizard = wizard;
  });

  describe('Step 1: Request identifier', () => {
    it('should ask for email or phone', async () => {
      const ctx = createMockContext();
      const handler = loginWizard.steps[0] as Function;

      await handler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('E-mail'),
        expect.any(Object)
      );
      expect(ctx.wizard.next).toHaveBeenCalled();
    });

    it('should handle callback query for restart', async () => {
      const ctx = createMockContext({
        callbackQuery: { data: 'restart' },
      });
      const handler = loginWizard.steps[0] as Function;

      await handler(ctx);

      expect(ctx.answerCbQuery).toHaveBeenCalled();
    });
  });

  describe('Step 2: Validate identifier', () => {
    it('should validate existing user', async () => {
      mockApiService.checkUser.mockResolvedValue(true);

      const ctx = createMockContext({
        message: { text: 'test@example.com' },
        wizard: {
          state: {},
          next: jest.fn(),
        },
      });

      const handler = loginWizard.steps[1] as Function;
      await handler(ctx);

      expect(mockApiService.checkUser).toHaveBeenCalledWith('test@example.com');
      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Verificando'));
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('senha'),
        undefined
      );
      expect(ctx.wizard.state.identifier).toBe('test@example.com');
      expect(ctx.wizard.next).toHaveBeenCalled();
    });

    it('should handle non-existent user', async () => {
      mockApiService.checkUser.mockResolvedValue(false);

      const ctx = createMockContext({
        message: { text: 'nonexistent@example.com' },
        wizard: { state: {} },
      });

      const handler = loginWizard.steps[1] as Function;
      await handler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('não encontrado'),
        expect.objectContaining({
          reply_markup: expect.any(Object),
        })
      );
      expect(ctx.wizard.next).not.toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      const networkError = new Error('ECONNREFUSED');
      (networkError as any).message = 'ECONN';
      mockApiService.checkUser.mockRejectedValue(networkError);

      const ctx = createMockContext({
        message: { text: 'test@example.com' },
        wizard: { state: {} },
      });

      const handler = loginWizard.steps[1] as Function;
      await handler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('offline'),
        expect.any(Object)
      );
    });

    it('should handle general errors', async () => {
      mockApiService.checkUser.mockRejectedValue(new Error('Unknown error'));

      const ctx = createMockContext({
        message: { text: 'test@example.com' },
        wizard: { state: {} },
      });

      const handler = loginWizard.steps[1] as Function;
      await handler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Erro técnico'),
        expect.any(Object)
      );
    });

    it('should handle missing text', async () => {
      const ctx = createMockContext({
        message: {},
        wizard: { state: {} },
      });

      const handler = loginWizard.steps[1] as Function;
      await handler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('envie um texto')
      );
    });

    it('should handle retry callback', async () => {
      const ctx = createMockContext({
        callbackQuery: { data: 'retry_login' },
        wizard: { selectStep: jest.fn() },
      });

      const handler = loginWizard.steps[1] as Function;
      await handler(ctx);

      expect(ctx.answerCbQuery).toHaveBeenCalled();
      expect(ctx.wizard.selectStep).toHaveBeenCalledWith(0);
    });
  });

  describe('Step 3: Authenticate', () => {
    it('should authenticate successfully and complete onboarding', async () => {
      mockApiService.login.mockResolvedValue({
        access_token: 'jwt-token-123',
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
          onboardingStep: 5,
        },
      } as any);

      const ctx = createMockContext({
        message: { text: 'password123' },
        wizard: {
          state: { identifier: 'test@example.com' },
        },
        session: {},
      });

      const handler = loginWizard.steps[2] as Function;
      await handler(ctx);

      expect(mockApiService.login).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
      expect(ctx.session.token).toBe('jwt-token-123');
      expect(ctx.session.user.name).toBe('Test User');
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Olá de volta'),
        expect.any(Object)
      );
      expect(ctx.scene.leave).toHaveBeenCalled();
    });

    it('should redirect to onboarding if incomplete', async () => {
      mockApiService.login.mockResolvedValue({
        access_token: 'jwt-token-123',
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
          onboardingStep: 2,
        },
      } as any);

      const ctx = createMockContext({
        message: { text: 'password123' },
        wizard: {
          state: { identifier: 'test@example.com' },
        },
        session: {},
      });

      const handler = loginWizard.steps[2] as Function;
      await handler(ctx);

      expect(ctx.scene.leave).toHaveBeenCalled();
      expect(ctx.scene.enter).toHaveBeenCalledWith('onboarding-wizard');
    });

    it('should handle incorrect password', async () => {
      mockApiService.login.mockResolvedValue(null);

      const ctx = createMockContext({
        message: { text: 'wrongpassword' },
        wizard: {
          state: { identifier: 'test@example.com' },
        },
        session: {},
      });

      const handler = loginWizard.steps[2] as Function;
      await handler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Senha incorreta'),
        expect.any(Object)
      );
      expect(ctx.scene.leave).not.toHaveBeenCalled();
    });

    it('should handle missing password', async () => {
      const ctx = createMockContext({
        message: {},
        wizard: {
          state: { identifier: 'test@example.com' },
        },
      });

      const handler = loginWizard.steps[2] as Function;
      await handler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('digite sua senha')
      );
    });

    it('should handle retry callback in step 3', async () => {
      const ctx = createMockContext({
        callbackQuery: { data: 'retry_login' },
        scene: {
          reenter: jest.fn(),
        },
      });

      const handler = loginWizard.steps[2] as Function;
      await handler(ctx);

      expect(ctx.answerCbQuery).toHaveBeenCalled();
      expect(ctx.scene.reenter).toHaveBeenCalled();
    });
  });

  describe('Retry action handler', () => {
    it('should handle retry action', async () => {
      const ctx = createMockContext({
        scene: {
          reenter: jest.fn(),
        },
      });

      // Simula a ação de retry
      const actionHandlers = (loginWizard as any).handlers || [];
      const retryHandler = actionHandlers.find(
        (h: any) => h.triggers && h.triggers.includes('retry_login')
      );

      if (retryHandler) {
        await retryHandler.middleware(ctx);
        expect(ctx.answerCbQuery).toHaveBeenCalled();
        expect(ctx.scene.reenter).toHaveBeenCalled();
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle onboardingStep as undefined', async () => {
      mockApiService.login.mockResolvedValue({
        access_token: 'jwt-token-123',
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
          onboardingStep: undefined,
        },
      } as any);

      const ctx = createMockContext({
        message: { text: 'password123' },
        wizard: {
          state: { identifier: 'test@example.com' },
        },
        session: {},
      });

      const handler = loginWizard.steps[2] as Function;
      await handler(ctx);

      expect(ctx.scene.leave).toHaveBeenCalled();
    });

    it('should handle onboardingStep as 0', async () => {
      mockApiService.login.mockResolvedValue({
        access_token: 'jwt-token-123',
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
          onboardingStep: 0,
        },
      } as any);

      const ctx = createMockContext({
        message: { text: 'password123' },
        wizard: {
          state: { identifier: 'test@example.com' },
        },
        session: {},
      });

      const handler = loginWizard.steps[2] as Function;
      await handler(ctx);

      expect(ctx.scene.enter).toHaveBeenCalledWith('onboarding-wizard');
    });
  });
});
