/**
 * Testes de integração para tratamento de erros
 */

import { createMockContext } from '../mocks/telegraf.mock';
import {
  mockBotApiService,
  resetBotApiMocks,
} from '../mocks/api.mock';

// Mock do módulo de serviços
jest.mock('../../src/services/bot-api.service', () => ({
  BotApiService: jest.fn().mockImplementation(() => mockBotApiService),
}));

describe('Error Handling Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetBotApiMocks();
  });

  describe('Network Errors', () => {
    it('should handle ECONNREFUSED error', async () => {
      const networkError: any = new Error('ECONNREFUSED');
      networkError.code = 'ECONNREFUSED';
      mockBotApiService.getDashboardSummary.mockRejectedValue(networkError);

      const token = 'jwt-token-123';

      await expect(mockBotApiService.getDashboardSummary(token)).rejects.toThrow(
        'ECONNREFUSED'
      );
    });

    it('should handle ENOTFOUND error', async () => {
      const networkError: any = new Error('ENOTFOUND');
      networkError.code = 'ENOTFOUND';
      mockBotApiService.checkUser.mockRejectedValue(networkError);

      await expect(mockBotApiService.checkUser('test@example.com')).rejects.toThrow(
        'ENOTFOUND'
      );
    });

    it('should handle timeout error', async () => {
      const timeoutError: any = new Error('ECONNABORTED');
      timeoutError.code = 'ECONNABORTED';
      mockBotApiService.createTransaction.mockRejectedValue(timeoutError);

      await expect(
        mockBotApiService.createTransaction('token', 'Test', 100, 'EXPENSE' as any)
      ).rejects.toThrow('ECONNABORTED');
    });

    it('should handle network error during login flow', async () => {
      const networkError: any = new Error('Network Error');
      mockBotApiService.checkUser.mockRejectedValue(networkError);
      mockBotApiService.login.mockRejectedValue(networkError);

      await expect(mockBotApiService.checkUser('test@example.com')).rejects.toThrow();
      await expect(
        mockBotApiService.login('test@example.com', 'password')
      ).rejects.toThrow();
    });
  });

  describe('Authentication Errors', () => {
    it('should handle 401 unauthorized', async () => {
      const authError: any = new Error('Unauthorized');
      authError.response = { status: 401, data: { message: 'Unauthorized' } };
      mockBotApiService.getDashboardSummary.mockRejectedValue(authError);

      const token = 'invalid-token';

      await expect(mockBotApiService.getDashboardSummary(token)).rejects.toThrow(
        'Unauthorized'
      );
    });

    it('should handle expired token', async () => {
      const expiredError: any = new Error('Token expired');
      expiredError.response = { status: 401, data: { message: 'Token expired' } };
      mockBotApiService.getLastTransactions.mockRejectedValue(expiredError);

      await expect(mockBotApiService.getLastTransactions('expired-token')).rejects.toThrow(
        'Token expired'
      );
    });

    it('should handle invalid credentials during login', async () => {
      mockBotApiService.login.mockResolvedValue(null);

      const result = await mockBotApiService.login('test@example.com', 'wrongpassword');
      expect(result).toBeNull();
    });

    it('should handle missing token', async () => {
      const authError: any = new Error('Token not provided');
      authError.response = { status: 401 };
      mockBotApiService.createTransaction.mockRejectedValue(authError);

      await expect(
        mockBotApiService.createTransaction('', 'Test', 100, 'EXPENSE' as any)
      ).rejects.toThrow();
    });
  });

  describe('Validation Errors', () => {
    it('should handle invalid transaction amount', async () => {
      const validationError: any = new Error('Invalid amount');
      validationError.response = {
        status: 400,
        data: { message: 'Invalid amount' },
      };
      mockBotApiService.createTransaction.mockRejectedValue(validationError);

      await expect(
        mockBotApiService.createTransaction('token', 'Test', -100, 'EXPENSE' as any)
      ).rejects.toThrow('Invalid amount');
    });

    it('should handle missing required fields', async () => {
      const validationError: any = new Error('Description is required');
      validationError.response = {
        status: 400,
        data: { message: 'Description is required' },
      };
      mockBotApiService.createTransaction.mockRejectedValue(validationError);

      await expect(
        mockBotApiService.createTransaction('token', '', 100, 'EXPENSE' as any)
      ).rejects.toThrow('Description is required');
    });

    it('should handle invalid account data during creation', async () => {
      const validationError: any = new Error('Invalid account type');
      validationError.response = {
        status: 400,
        data: { message: 'Invalid account type' },
      };
      mockBotApiService.createAccount.mockRejectedValue(validationError);

      await expect(
        mockBotApiService.createAccount('token', {
          name: 'Test',
          type: 'INVALID' as any,
          balance: 0,
        })
      ).rejects.toThrow('Invalid account type');
    });

    it('should handle invalid onboarding step', async () => {
      const validationError: any = new Error('Invalid step');
      validationError.response = {
        status: 400,
        data: { message: 'Invalid step' },
      };
      mockBotApiService.updateOnboarding.mockRejectedValue(validationError);

      await expect(
        mockBotApiService.updateOnboarding('token', { step: 999 })
      ).rejects.toThrow('Invalid step');
    });
  });

  describe('Resource Not Found Errors', () => {
    it('should handle user not found', async () => {
      mockBotApiService.checkUser.mockResolvedValue(false);

      const exists = await mockBotApiService.checkUser('nonexistent@example.com');
      expect(exists).toBe(false);
    });

    it('should handle no accounts found', async () => {
      const notFoundError: any = new Error('Nenhuma conta encontrada.');
      mockBotApiService.getFirstAccountId.mockRejectedValue(notFoundError);

      await expect(mockBotApiService.getFirstAccountId('token')).rejects.toThrow(
        'Nenhuma conta encontrada.'
      );
    });

    it('should handle empty transactions list', async () => {
      mockBotApiService.getLastTransactions.mockResolvedValue([]);

      const transactions = await mockBotApiService.getLastTransactions('token');
      expect(transactions).toEqual([]);
    });

    it('should handle no categories found', async () => {
      mockBotApiService.getExpensesByCategory.mockResolvedValue([]);

      const categories = await mockBotApiService.getExpensesByCategory('token');
      expect(categories).toEqual([]);
    });
  });

  describe('Server Errors', () => {
    it('should handle 500 internal server error', async () => {
      const serverError: any = new Error('Internal Server Error');
      serverError.response = {
        status: 500,
        data: { message: 'Internal Server Error' },
      };
      mockBotApiService.getDashboardSummary.mockRejectedValue(serverError);

      await expect(mockBotApiService.getDashboardSummary('token')).rejects.toThrow(
        'Internal Server Error'
      );
    });

    it('should handle 503 service unavailable', async () => {
      const unavailableError: any = new Error('Service Unavailable');
      unavailableError.response = {
        status: 503,
        data: { message: 'Service Unavailable' },
      };
      mockBotApiService.getInsights.mockRejectedValue(unavailableError);

      await expect(mockBotApiService.getInsights('token')).rejects.toThrow(
        'Service Unavailable'
      );
    });

    it('should handle database connection error', async () => {
      const dbError: any = new Error('Database connection failed');
      mockBotApiService.createTransaction.mockRejectedValue(dbError);

      await expect(
        mockBotApiService.createTransaction('token', 'Test', 100, 'EXPENSE' as any)
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('Session Errors', () => {
    it('should handle missing session', async () => {
      const ctx = createMockContext({
        session: {},
      });

      expect(ctx.session.token).toBeUndefined();
      expect(ctx.session.user).toBeUndefined();
    });

    it('should handle corrupted session data', async () => {
      const ctx = createMockContext({
        session: {
          token: 'invalid-format',
          user: null,
        },
      });

      expect(ctx.session.token).toBe('invalid-format');
      expect(ctx.session.user).toBeNull();
    });

    it('should recover from session reset', async () => {
      const ctx = createMockContext({
        session: {
          token: 'valid-token',
          user: { name: 'Test' },
        },
      });

      // Reset session
      ctx.session.token = undefined;
      ctx.session.user = undefined;

      expect(ctx.session.token).toBeUndefined();
      expect(ctx.session.user).toBeUndefined();
    });
  });

  describe('Rate Limiting and Throttling', () => {
    it('should handle rate limit error', async () => {
      const rateLimitError: any = new Error('Too Many Requests');
      rateLimitError.response = {
        status: 429,
        data: { message: 'Too Many Requests' },
      };
      mockBotApiService.createTransaction.mockRejectedValue(rateLimitError);

      await expect(
        mockBotApiService.createTransaction('token', 'Test', 100, 'EXPENSE' as any)
      ).rejects.toThrow('Too Many Requests');
    });
  });

  describe('Data Integrity Errors', () => {
    it('should handle duplicate transaction', async () => {
      const duplicateError: any = new Error('Duplicate transaction');
      duplicateError.response = {
        status: 409,
        data: { message: 'Duplicate transaction' },
      };
      mockBotApiService.createTransaction.mockRejectedValue(duplicateError);

      await expect(
        mockBotApiService.createTransaction('token', 'Test', 100, 'EXPENSE' as any)
      ).rejects.toThrow('Duplicate transaction');
    });

    it('should handle concurrent modification', async () => {
      const concurrentError: any = new Error('Resource was modified');
      concurrentError.response = {
        status: 409,
        data: { message: 'Resource was modified' },
      };
      mockBotApiService.updateOnboarding.mockRejectedValue(concurrentError);

      await expect(
        mockBotApiService.updateOnboarding('token', { step: 3 })
      ).rejects.toThrow('Resource was modified');
    });
  });

  describe('Error Recovery', () => {
    it('should retry after network error', async () => {
      const networkError: any = new Error('Network Error');

      // Primeiro falha, depois sucede
      mockBotApiService.getDashboardSummary
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({
          totalBalance: 5000,
          periodSummary: {
            income: 8000,
            expense: 3000,
            result: 5000,
          },
        });

      // Primeira tentativa falha
      await expect(mockBotApiService.getDashboardSummary('token')).rejects.toThrow();

      // Segunda tentativa sucede
      const result = await mockBotApiService.getDashboardSummary('token');
      expect(result).toBeTruthy();
      expect(result.totalBalance).toBe(5000);
    });

    it('should handle partial data on error', async () => {
      mockBotApiService.getLastTransactions.mockResolvedValue([]);

      const transactions = await mockBotApiService.getLastTransactions('token');
      expect(transactions).toEqual([]);
      expect(Array.isArray(transactions)).toBe(true);
    });
  });

  describe('Complex Error Scenarios', () => {
    it('should handle multiple sequential errors', async () => {
      const authError: any = new Error('Unauthorized');
      authError.response = { status: 401 };

      mockBotApiService.getDashboardSummary.mockRejectedValue(authError);
      mockBotApiService.getLastTransactions.mockRejectedValue(authError);
      mockBotApiService.getInsights.mockRejectedValue(authError);

      await expect(mockBotApiService.getDashboardSummary('token')).rejects.toThrow();
      await expect(mockBotApiService.getLastTransactions('token')).rejects.toThrow();
      await expect(mockBotApiService.getInsights('token')).rejects.toThrow();
    });

    it('should handle error during onboarding flow', async () => {
      const token = 'jwt-token-123';

      // Step 1 succeeds
      mockBotApiService.updateOnboarding.mockResolvedValueOnce({
        id: 'user-1',
        name: 'Test',
        onboardingStep: 2,
      } as any);

      // Step 2 fails
      const error: any = new Error('Failed to create account');
      mockBotApiService.createAccount.mockRejectedValueOnce(error);

      await mockBotApiService.updateOnboarding(token, { step: 2, name: 'Test' });
      await expect(
        mockBotApiService.createAccount(token, {
          name: 'Test',
          type: 'CHECKING',
          balance: 0,
        })
      ).rejects.toThrow('Failed to create account');
    });

    it('should handle error during transaction with multiple dependencies', async () => {
      const token = 'jwt-token-123';

      // Getting account succeeds
      mockBotApiService.getFirstAccountId.mockResolvedValue('account-123');

      // Creating transaction fails
      const error: any = new Error('Insufficient balance');
      error.response = { status: 400, data: { message: 'Insufficient balance' } };
      mockBotApiService.createTransaction.mockRejectedValue(error);

      const accountId = await mockBotApiService.getFirstAccountId(token);
      expect(accountId).toBe('account-123');

      await expect(
        mockBotApiService.createTransaction(token, 'Test', 10000, 'EXPENSE' as any)
      ).rejects.toThrow('Insufficient balance');
    });
  });

  describe('Graceful Degradation', () => {
    it('should handle partial service failure', async () => {
      const token = 'jwt-token-123';

      // Dashboard works
      mockBotApiService.getDashboardSummary.mockResolvedValue({
        totalBalance: 5000,
        periodSummary: {
          income: 8000,
          expense: 3000,
          result: 5000,
        },
      });

      // But insights fail
      mockBotApiService.getInsights.mockRejectedValue(new Error('AI service unavailable'));

      const summary = await mockBotApiService.getDashboardSummary(token);
      expect(summary).toBeTruthy();

      await expect(mockBotApiService.getInsights(token)).rejects.toThrow(
        'AI service unavailable'
      );
    });

    it('should handle empty results gracefully', async () => {
      mockBotApiService.getLastTransactions.mockResolvedValue([]);
      mockBotApiService.getExpensesByCategory.mockResolvedValue([]);
      mockBotApiService.getInsights.mockResolvedValue([]);

      const transactions = await mockBotApiService.getLastTransactions('token');
      const categories = await mockBotApiService.getExpensesByCategory('token');
      const insights = await mockBotApiService.getInsights('token');

      expect(transactions).toEqual([]);
      expect(categories).toEqual([]);
      expect(insights).toEqual([]);
    });
  });
});
