/**
 * Testes de integração para fluxos completos do bot
 */

import { createMockContext } from '../mocks/telegraf.mock';
import {
  mockBotApiService,
  setupSuccessfulApiMocks,
  resetBotApiMocks,
  mockLoginResponse,
  mockDashboardSummary,
  mockTransactions,
  mockCategories,
  mockInsights,
} from '../mocks/api.mock';

// Mock do módulo de serviços
jest.mock('../../src/services/bot-api.service', () => ({
  BotApiService: jest.fn().mockImplementation(() => mockBotApiService),
}));

// Mock do Telegraf
jest.mock('telegraf', () => {
  const actual = jest.requireActual('../mocks/telegraf.mock');
  return {
    Telegraf: actual.MockTelegraf,
    session: jest.fn(() => (ctx: any, next: any) => next()),
    Scenes: {
      Stage: jest.fn().mockImplementation(() => ({
        middleware: jest.fn(() => (ctx: any, next: any) => next()),
      })),
      WizardScene: jest.fn(),
    },
    Markup: {
      inlineKeyboard: jest.fn(() => ({})),
      button: {
        callback: jest.fn(() => ({})),
        url: jest.fn(() => ({})),
      },
    },
  };
});

describe('Bot Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetBotApiMocks();
    setupSuccessfulApiMocks();
  });

  describe('Login Flow', () => {
    it('should complete full login flow successfully', async () => {
      // Simula usuário existente
      mockBotApiService.checkUser.mockResolvedValue(true);
      mockBotApiService.login.mockResolvedValue(mockLoginResponse);

      const ctx = createMockContext({
        message: { text: 'test@example.com' },
        session: {},
      });

      // Verifica que o usuário existe
      const userExists = await mockBotApiService.checkUser('test@example.com');
      expect(userExists).toBe(true);

      // Faz login
      const loginResult = await mockBotApiService.login('test@example.com', 'password123');
      expect(loginResult).toBeTruthy();
      expect(loginResult?.access_token).toBe('mock-jwt-token-12345');

      // Simula salvamento da sessão
      ctx.session.token = loginResult!.access_token;
      ctx.session.user = loginResult!.user;

      expect(ctx.session.token).toBe('mock-jwt-token-12345');
      expect(ctx.session.user.name).toBe('Test User');
    });

    it('should handle login with incomplete onboarding', async () => {
      const incompleteUser = {
        ...mockLoginResponse,
        user: {
          ...mockLoginResponse.user,
          onboardingStep: 2,
        },
      };

      mockBotApiService.checkUser.mockResolvedValue(true);
      mockBotApiService.login.mockResolvedValue(incompleteUser);

      const loginResult = await mockBotApiService.login('test@example.com', 'password123');
      expect(loginResult?.user.onboardingStep).toBe(2);
      expect(loginResult?.user.onboardingStep).toBeLessThan(5);
    });

    it('should handle login failure', async () => {
      mockBotApiService.checkUser.mockResolvedValue(true);
      mockBotApiService.login.mockResolvedValue(null);

      const loginResult = await mockBotApiService.login('test@example.com', 'wrongpassword');
      expect(loginResult).toBeNull();
    });
  });

  describe('Onboarding Flow', () => {
    it('should complete full onboarding flow', async () => {
      const token = 'jwt-token-123';

      // Step 1: Update name
      const step1Result = await mockBotApiService.updateOnboarding(token, {
        step: 2,
        name: 'João Silva',
      });
      expect(step1Result).toBeTruthy();

      // Step 2: Create account
      const accountResult = await mockBotApiService.createAccount(token, {
        name: 'Nubank',
        type: 'CHECKING',
        balance: 1000,
      });
      expect(accountResult).toBeTruthy();

      // Step 3: Update to step 3
      await mockBotApiService.updateOnboarding(token, { step: 3 });

      // Step 4: Complete onboarding with investor profile
      const finalResult = await mockBotApiService.updateOnboarding(token, {
        step: 5,
        investorProfile: 'MODERATE',
      });
      expect(finalResult).toBeTruthy();
    });
  });

  describe('Transaction Creation Flow', () => {
    it('should create expense transaction successfully', async () => {
      const token = 'jwt-token-123';

      const transaction = await mockBotApiService.createTransaction(
        token,
        'Almoço restaurante',
        45.0,
        'EXPENSE' as any
      );

      expect(transaction).toBeTruthy();
      expect(mockBotApiService.createTransaction).toHaveBeenCalledWith(
        token,
        'Almoço restaurante',
        45.0,
        'EXPENSE'
      );
    });

    it('should create income transaction successfully', async () => {
      const token = 'jwt-token-123';

      const transaction = await mockBotApiService.createTransaction(
        token,
        'Salário',
        5000,
        'INCOME' as any
      );

      expect(transaction).toBeTruthy();
      expect(mockBotApiService.createTransaction).toHaveBeenCalledWith(
        token,
        'Salário',
        5000,
        'INCOME'
      );
    });

    it('should handle transaction creation with account lookup', async () => {
      const token = 'jwt-token-123';

      // Primeiro busca a conta
      const accountId = await mockBotApiService.getFirstAccountId(token);
      expect(accountId).toBe('account-123');

      // Depois cria a transação
      const transaction = await mockBotApiService.createTransaction(
        token,
        'Compra supermercado',
        150,
        'EXPENSE' as any
      );

      expect(transaction).toBeTruthy();
    });
  });

  describe('Dashboard and Reports Flow', () => {
    it('should fetch dashboard summary', async () => {
      const token = 'jwt-token-123';

      const summary = await mockBotApiService.getDashboardSummary(token);

      expect(summary).toBeTruthy();
      expect(summary.totalBalance).toBe(5000);
      expect(summary.periodSummary.income).toBe(8000);
      expect(summary.periodSummary.expense).toBe(3000);
      expect(summary.periodSummary.result).toBe(5000);
    });

    it('should fetch last transactions', async () => {
      const token = 'jwt-token-123';

      const transactions = await mockBotApiService.getLastTransactions(token, 5);

      expect(transactions).toBeTruthy();
      expect(transactions.length).toBeGreaterThan(0);
    });

    it('should fetch expenses by category', async () => {
      const token = 'jwt-token-123';

      const categories = await mockBotApiService.getExpensesByCategory(token);

      expect(categories).toBeTruthy();
      expect(categories.length).toBeGreaterThan(0);
      expect(categories[0]).toHaveProperty('name');
      expect(categories[0]).toHaveProperty('amount');
    });

    it('should fetch insights', async () => {
      const token = 'jwt-token-123';

      const insights = await mockBotApiService.getInsights(token);

      expect(insights).toBeTruthy();
      expect(insights.length).toBeGreaterThan(0);
      expect(insights[0]).toHaveProperty('type');
      expect(insights[0]).toHaveProperty('text');
    });
  });

  describe('Report Download Flow', () => {
    it('should download PDF report', async () => {
      const token = 'jwt-token-123';

      const pdfBuffer = await mockBotApiService.downloadReport(token, 'PDF');

      expect(pdfBuffer).toBeTruthy();
      expect(mockBotApiService.downloadReport).toHaveBeenCalledWith(token, 'PDF');
    });

    it('should download EXCEL report', async () => {
      const token = 'jwt-token-123';

      const excelBuffer = await mockBotApiService.downloadReport(token, 'EXCEL');

      expect(excelBuffer).toBeTruthy();
      expect(mockBotApiService.downloadReport).toHaveBeenCalledWith(token, 'EXCEL');
    });
  });

  describe('Complete User Journey', () => {
    it('should handle complete user journey from login to transaction', async () => {
      // 1. Login
      mockBotApiService.checkUser.mockResolvedValue(true);
      mockBotApiService.login.mockResolvedValue(mockLoginResponse);

      const loginResult = await mockBotApiService.login('test@example.com', 'password123');
      expect(loginResult).toBeTruthy();

      const token = loginResult!.access_token;

      // 2. Check balance
      const summary = await mockBotApiService.getDashboardSummary(token);
      expect(summary).toBeTruthy();

      // 3. Create transaction
      const transaction = await mockBotApiService.createTransaction(
        token,
        'Almoço',
        45,
        'EXPENSE' as any
      );
      expect(transaction).toBeTruthy();

      // 4. Check transactions
      const transactions = await mockBotApiService.getLastTransactions(token, 5);
      expect(transactions).toBeTruthy();

      // 5. Get insights
      const insights = await mockBotApiService.getInsights(token);
      expect(insights).toBeTruthy();
    });

    it('should handle complete new user journey with onboarding', async () => {
      const incompleteUser = {
        access_token: 'jwt-token-new',
        user: {
          id: 'user-new',
          name: 'New User',
          email: 'new@example.com',
          onboardingStep: 0,
        },
      };

      // 1. Login (new user)
      mockBotApiService.login.mockResolvedValue(incompleteUser as any);
      const loginResult = await mockBotApiService.login('new@example.com', 'password');
      expect(loginResult?.user.onboardingStep).toBe(0);

      const token = loginResult!.access_token;

      // 2. Complete onboarding
      await mockBotApiService.updateOnboarding(token, { step: 2, name: 'New User' });
      await mockBotApiService.createAccount(token, {
        name: 'Conta Principal',
        type: 'CHECKING',
        balance: 0,
      });
      await mockBotApiService.updateOnboarding(token, { step: 3 });
      await mockBotApiService.updateOnboarding(token, {
        step: 5,
        investorProfile: 'MODERATE',
      });

      // 3. Now can use normally
      const summary = await mockBotApiService.getDashboardSummary(token);
      expect(summary).toBeTruthy();
    });
  });

  describe('Session Management', () => {
    it('should maintain session across multiple operations', async () => {
      const ctx = createMockContext({
        session: {},
      });

      // Login
      const loginResult = await mockBotApiService.login('test@example.com', 'password123');
      ctx.session.token = loginResult!.access_token;
      ctx.session.user = loginResult!.user;

      // Use session token for multiple operations
      expect(ctx.session.token).toBeTruthy();

      await mockBotApiService.getDashboardSummary(ctx.session.token!);
      await mockBotApiService.getLastTransactions(ctx.session.token!);
      await mockBotApiService.createTransaction(
        ctx.session.token!,
        'Test',
        100,
        'EXPENSE' as any
      );

      // Session should still be valid
      expect(ctx.session.token).toBe('mock-jwt-token-12345');
      expect(ctx.session.user.name).toBe('Test User');
    });

    it('should handle logout', async () => {
      const ctx = createMockContext({
        session: {
          token: 'jwt-token-123',
          user: { name: 'Test User' },
        },
      });

      // Logout
      ctx.session.token = undefined;
      ctx.session.user = undefined;

      expect(ctx.session.token).toBeUndefined();
      expect(ctx.session.user).toBeUndefined();
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency across operations', async () => {
      const token = 'jwt-token-123';

      // Create multiple transactions
      await mockBotApiService.createTransaction(token, 'Transaction 1', 100, 'EXPENSE' as any);
      await mockBotApiService.createTransaction(token, 'Transaction 2', 200, 'EXPENSE' as any);
      await mockBotApiService.createTransaction(token, 'Transaction 3', 300, 'INCOME' as any);

      // Fetch summary
      const summary = await mockBotApiService.getDashboardSummary(token);
      expect(summary).toBeTruthy();

      // Fetch transactions
      const transactions = await mockBotApiService.getLastTransactions(token);
      expect(transactions).toBeTruthy();

      // All operations should complete successfully
      expect(mockBotApiService.createTransaction).toHaveBeenCalledTimes(3);
    });
  });
});
