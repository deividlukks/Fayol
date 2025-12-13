/**
 * Testes unitários para onboarding.scene
 */

import { Scenes } from 'telegraf';
import { BotApiService } from '../../../src/services/bot-api.service';
import { createMockContext } from '../../mocks/telegraf.mock';

// Mock do BotApiService
jest.mock('../../../src/services/bot-api.service');

describe('Onboarding Scene', () => {
  let mockApiService: jest.Mocked<BotApiService>;
  let onboardingWizard: Scenes.WizardScene<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    mockApiService = {
      updateOnboarding: jest.fn(),
      createAccount: jest.fn(),
    } as any;

    (BotApiService as jest.Mock).mockImplementation(() => mockApiService);

    const { onboardingWizard: wizard } = require('../../../src/scenes/onboarding.scene');
    onboardingWizard = wizard;
  });

  describe('Step 1: Welcome and ask for name', () => {
    it('should welcome user and ask for name', async () => {
      const ctx = createMockContext();
      const handler = onboardingWizard.steps[0] as Function;

      await handler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Bem-vindo'),
        expect.any(Object)
      );
      expect(ctx.wizard.next).toHaveBeenCalled();
    });
  });

  describe('Step 2: Save name and ask for account', () => {
    it('should save name and ask for account name', async () => {
      mockApiService.updateOnboarding.mockResolvedValue({
        id: 'user-1',
        name: 'João Silva',
        onboardingStep: 2,
      } as any);

      const ctx = createMockContext({
        message: { text: 'João Silva' },
        session: {
          token: 'jwt-token-123',
          user: {},
        },
        wizard: { state: {} },
      });

      const handler = onboardingWizard.steps[1] as Function;
      await handler(ctx);

      expect(mockApiService.updateOnboarding).toHaveBeenCalledWith('jwt-token-123', {
        step: 2,
        name: 'João Silva',
      });
      expect(ctx.session.user.name).toBe('João Silva');
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Conta Principal')
      );
      expect(ctx.wizard.next).toHaveBeenCalled();
    });

    it('should reject name with less than 2 characters', async () => {
      const ctx = createMockContext({
        message: { text: 'J' },
        wizard: { state: {} },
      });

      const handler = onboardingWizard.steps[1] as Function;
      await handler(ctx);

      expect(mockApiService.updateOnboarding).not.toHaveBeenCalled();
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('nome válido')
      );
      expect(ctx.wizard.next).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      mockApiService.updateOnboarding.mockRejectedValue(new Error('API Error'));

      const ctx = createMockContext({
        message: { text: 'João Silva' },
        session: { token: 'jwt-token-123', user: {} },
        wizard: { state: {} },
      });

      const handler = onboardingWizard.steps[1] as Function;
      await handler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Erro ao salvar nome')
      );
    });
  });

  describe('Step 3: Save account name and ask for balance', () => {
    it('should save account name and ask for balance', async () => {
      const ctx = createMockContext({
        message: { text: 'Nubank' },
        wizard: { state: {} },
      });

      const handler = onboardingWizard.steps[2] as Function;
      await handler(ctx);

      expect(ctx.wizard.state.accountName).toBe('Nubank');
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('saldo atual')
      );
      expect(ctx.wizard.next).toHaveBeenCalled();
    });

    it('should handle empty account name', async () => {
      const ctx = createMockContext({
        message: {},
        wizard: { state: {} },
      });

      const handler = onboardingWizard.steps[2] as Function;
      await handler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('digite o nome da conta')
      );
      expect(ctx.wizard.next).not.toHaveBeenCalled();
    });
  });

  describe('Step 4: Create account and ask for investor profile', () => {
    it('should create account successfully', async () => {
      mockApiService.createAccount.mockResolvedValue({
        id: 'account-1',
        name: 'Nubank',
        balance: 1500,
        type: 'CHECKING',
      } as any);

      mockApiService.updateOnboarding.mockResolvedValue({} as any);

      const ctx = createMockContext({
        message: { text: '1500.00' },
        session: { token: 'jwt-token-123' },
        wizard: {
          state: { accountName: 'Nubank' },
        },
      });

      const handler = onboardingWizard.steps[3] as Function;
      await handler(ctx);

      expect(mockApiService.createAccount).toHaveBeenCalledWith('jwt-token-123', {
        name: 'Nubank',
        type: 'CHECKING',
        balance: 1500,
      });
      expect(mockApiService.updateOnboarding).toHaveBeenCalledWith('jwt-token-123', {
        step: 3,
      });
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Conta criada'),
        expect.any(Object)
      );
      expect(ctx.wizard.next).toHaveBeenCalled();
    });

    it('should accept balance with comma', async () => {
      mockApiService.createAccount.mockResolvedValue({} as any);
      mockApiService.updateOnboarding.mockResolvedValue({} as any);

      const ctx = createMockContext({
        message: { text: '1500,50' },
        session: { token: 'jwt-token-123' },
        wizard: { state: { accountName: 'Nubank' } },
      });

      const handler = onboardingWizard.steps[3] as Function;
      await handler(ctx);

      expect(mockApiService.createAccount).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          balance: 1500.5,
        })
      );
    });

    it('should accept zero balance', async () => {
      mockApiService.createAccount.mockResolvedValue({} as any);
      mockApiService.updateOnboarding.mockResolvedValue({} as any);

      const ctx = createMockContext({
        message: { text: '0' },
        session: { token: 'jwt-token-123' },
        wizard: { state: { accountName: 'Nubank' } },
      });

      const handler = onboardingWizard.steps[3] as Function;
      await handler(ctx);

      expect(mockApiService.createAccount).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          balance: 0,
        })
      );
    });

    it('should reject invalid balance', async () => {
      const ctx = createMockContext({
        message: { text: 'abc' },
        wizard: { state: { accountName: 'Nubank' } },
      });

      const handler = onboardingWizard.steps[3] as Function;
      await handler(ctx);

      expect(mockApiService.createAccount).not.toHaveBeenCalled();
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('valor numérico válido')
      );
      expect(ctx.wizard.next).not.toHaveBeenCalled();
    });

    it('should handle API errors when creating account', async () => {
      mockApiService.createAccount.mockRejectedValue(new Error('API Error'));

      const ctx = createMockContext({
        message: { text: '1500' },
        session: { token: 'jwt-token-123' },
        wizard: { state: { accountName: 'Nubank' } },
      });

      const handler = onboardingWizard.steps[3] as Function;
      await handler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Erro ao criar conta')
      );
    });
  });

  describe('Step 5: Save investor profile and finish', () => {
    it('should save CONSERVATIVE profile', async () => {
      mockApiService.updateOnboarding.mockResolvedValue({
        id: 'user-1',
        onboardingStep: 5,
      } as any);

      const ctx = createMockContext({
        callbackQuery: { data: 'profile_CONSERVATIVE' },
        session: {
          token: 'jwt-token-123',
          user: {},
        },
      });

      const handler = onboardingWizard.steps[4] as Function;
      await handler(ctx);

      expect(ctx.answerCbQuery).toHaveBeenCalled();
      expect(mockApiService.updateOnboarding).toHaveBeenCalledWith('jwt-token-123', {
        step: 5,
        investorProfile: 'CONSERVATIVE',
      });
      expect(ctx.session.user.onboardingStep).toBe(5);
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Tudo Pronto'),
        expect.any(Object)
      );
      expect(ctx.scene.leave).toHaveBeenCalled();
    });

    it('should save MODERATE profile', async () => {
      mockApiService.updateOnboarding.mockResolvedValue({
        id: 'user-1',
        onboardingStep: 5,
      } as any);

      const ctx = createMockContext({
        callbackQuery: { data: 'profile_MODERATE' },
        session: {
          token: 'jwt-token-123',
          user: {},
        },
      });

      const handler = onboardingWizard.steps[4] as Function;
      await handler(ctx);

      expect(mockApiService.updateOnboarding).toHaveBeenCalledWith('jwt-token-123', {
        step: 5,
        investorProfile: 'MODERATE',
      });
    });

    it('should save AGGRESSIVE profile', async () => {
      mockApiService.updateOnboarding.mockResolvedValue({
        id: 'user-1',
        onboardingStep: 5,
      } as any);

      const ctx = createMockContext({
        callbackQuery: { data: 'profile_AGGRESSIVE' },
        session: {
          token: 'jwt-token-123',
          user: {},
        },
      });

      const handler = onboardingWizard.steps[4] as Function;
      await handler(ctx);

      expect(mockApiService.updateOnboarding).toHaveBeenCalledWith('jwt-token-123', {
        step: 5,
        investorProfile: 'AGGRESSIVE',
      });
    });

    it('should handle missing callback query', async () => {
      const ctx = createMockContext({
        callbackQuery: null,
      });

      const handler = onboardingWizard.steps[4] as Function;
      await handler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('selecione uma das opções')
      );
      expect(mockApiService.updateOnboarding).not.toHaveBeenCalled();
    });

    it('should handle API errors when saving profile', async () => {
      mockApiService.updateOnboarding.mockRejectedValue(new Error('API Error'));

      const ctx = createMockContext({
        callbackQuery: { data: 'profile_MODERATE' },
        session: { token: 'jwt-token-123', user: {} },
      });

      const handler = onboardingWizard.steps[4] as Function;
      await handler(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Erro ao salvar perfil')
      );
    });
  });

  describe('Complete flow', () => {
    it('should complete full onboarding flow', async () => {
      mockApiService.updateOnboarding.mockResolvedValue({
        id: 'user-1',
        name: 'João Silva',
        onboardingStep: 5,
      } as any);

      mockApiService.createAccount.mockResolvedValue({
        id: 'account-1',
        name: 'Nubank',
        balance: 1000,
      } as any);

      // Step 1: Welcome
      const ctx1 = createMockContext();
      await (onboardingWizard.steps[0] as Function)(ctx1);
      expect(ctx1.wizard.next).toHaveBeenCalled();

      // Step 2: Name
      const ctx2 = createMockContext({
        message: { text: 'João Silva' },
        session: { token: 'jwt-token-123', user: {} },
        wizard: { state: {} },
      });
      await (onboardingWizard.steps[1] as Function)(ctx2);
      expect(ctx2.wizard.next).toHaveBeenCalled();

      // Step 3: Account name
      const ctx3 = createMockContext({
        message: { text: 'Nubank' },
        wizard: { state: {} },
      });
      await (onboardingWizard.steps[2] as Function)(ctx3);
      expect(ctx3.wizard.next).toHaveBeenCalled();

      // Step 4: Balance
      const ctx4 = createMockContext({
        message: { text: '1000' },
        session: { token: 'jwt-token-123' },
        wizard: { state: { accountName: 'Nubank' } },
      });
      await (onboardingWizard.steps[3] as Function)(ctx4);
      expect(ctx4.wizard.next).toHaveBeenCalled();

      // Step 5: Profile
      const ctx5 = createMockContext({
        callbackQuery: { data: 'profile_MODERATE' },
        session: { token: 'jwt-token-123', user: {} },
      });
      await (onboardingWizard.steps[4] as Function)(ctx5);
      expect(ctx5.scene.leave).toHaveBeenCalled();
    });
  });
});
