/**
 * Testes unitários para BotApiService
 */

import { BotApiService } from '../../../src/services/bot-api.service';
import { LaunchType } from '@fayol/shared-types';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

// Mock do CategorizerService
jest.mock('@fayol/ai-services', () => ({
  CategorizerService: jest.fn().mockImplementation(() => ({
    predictCategory: jest.fn().mockReturnValue('Alimentação'),
  })),
}));

describe('BotApiService', () => {
  let botApiService: BotApiService;
  let mockAxios: MockAdapter;

  const BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:3333/api';

  beforeEach(() => {
    botApiService = new BotApiService();
    mockAxios = new MockAdapter((botApiService as any).api);
  });

  afterEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  describe('checkUser', () => {
    it('should return true when user exists', async () => {
      mockAxios.onPost('/auth/check').reply(200, {
        data: { exists: true },
      });

      const result = await botApiService.checkUser('test@example.com');
      expect(result).toBe(true);
    });

    it('should return false when user does not exist', async () => {
      mockAxios.onPost('/auth/check').reply(200, {
        data: { exists: false },
      });

      const result = await botApiService.checkUser('nonexistent@example.com');
      expect(result).toBe(false);
    });

    it('should handle response without data wrapper', async () => {
      mockAxios.onPost('/auth/check').reply(200, {
        exists: true,
      });

      const result = await botApiService.checkUser('test@example.com');
      expect(result).toBe(true);
    });

    it('should throw error on network failure', async () => {
      mockAxios.onPost('/auth/check').networkError();

      await expect(botApiService.checkUser('test@example.com')).rejects.toThrow();
    });
  });

  describe('login', () => {
    const mockLoginResponse = {
      data: {
        access_token: 'jwt-token-123',
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
          onboardingStep: 5,
        },
      },
    };

    it('should return login data on success', async () => {
      mockAxios.onPost('/auth/login').reply(200, mockLoginResponse);

      const result = await botApiService.login('test@example.com', 'password123');
      expect(result).toEqual(mockLoginResponse.data);
      expect(result?.access_token).toBe('jwt-token-123');
    });

    it('should return null on invalid credentials', async () => {
      mockAxios.onPost('/auth/login').reply(401);

      const result = await botApiService.login('test@example.com', 'wrongpassword');
      expect(result).toBeNull();
    });

    it('should return null on network error', async () => {
      mockAxios.onPost('/auth/login').networkError();

      const result = await botApiService.login('test@example.com', 'password123');
      expect(result).toBeNull();
    });
  });

  describe('updateOnboarding', () => {
    const token = 'jwt-token-123';
    const mockUser = {
      id: 'user-1',
      name: 'Updated User',
      onboardingStep: 3,
      email: 'test@example.com',
    };

    it('should update onboarding successfully', async () => {
      mockAxios.onPatch('/users/onboarding/step').reply(200, {
        data: mockUser,
      });

      const result = await botApiService.updateOnboarding(token, {
        step: 3,
        name: 'Updated User',
      });

      expect(result).toEqual(mockUser);
    });

    it('should send authorization header', async () => {
      mockAxios.onPatch('/users/onboarding/step').reply((config) => {
        expect(config.headers?.Authorization).toBe(`Bearer ${token}`);
        return [200, { data: mockUser }];
      });

      await botApiService.updateOnboarding(token, { step: 3 });
    });

    it('should throw error on failure', async () => {
      mockAxios.onPatch('/users/onboarding/step').reply(500);

      await expect(
        botApiService.updateOnboarding(token, { step: 3 })
      ).rejects.toThrow('Falha ao atualizar perfil.');
    });
  });

  describe('createAccount', () => {
    const token = 'jwt-token-123';
    const accountData = {
      name: 'Nubank',
      type: 'CHECKING',
      balance: 1000,
    };

    const mockAccount = {
      id: 'account-1',
      ...accountData,
      currency: 'BRL',
      userId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create account successfully', async () => {
      mockAxios.onPost('/accounts').reply(200, {
        data: mockAccount,
      });

      const result = await botApiService.createAccount(token, accountData);
      expect(result.name).toBe('Nubank');
      expect(result.type).toBe('CHECKING');
    });

    it('should add default currency BRL', async () => {
      mockAxios.onPost('/accounts').reply((config) => {
        const data = JSON.parse(config.data);
        expect(data.currency).toBe('BRL');
        return [200, { data: mockAccount }];
      });

      await botApiService.createAccount(token, accountData);
    });

    it('should throw error on failure', async () => {
      mockAxios.onPost('/accounts').reply(500);

      await expect(
        botApiService.createAccount(token, accountData)
      ).rejects.toThrow('Falha ao criar conta.');
    });
  });

  describe('getAccounts', () => {
    const token = 'jwt-token-123';
    const mockAccounts = [
      { id: 'account-1', name: 'Nubank', balance: 1000 },
      { id: 'account-2', name: 'Inter', balance: 2000 },
    ];

    it('should get accounts successfully', async () => {
      mockAxios.onGet('/accounts').reply(200, {
        data: mockAccounts,
      });

      const result = await botApiService.getAccounts(token);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Nubank');
    });

    it('should return empty array when no accounts', async () => {
      mockAxios.onGet('/accounts').reply(200, {
        data: [],
      });

      const result = await botApiService.getAccounts(token);
      expect(result).toEqual([]);
    });

    it('should throw error on failure', async () => {
      mockAxios.onGet('/accounts').reply(500);

      await expect(botApiService.getAccounts(token)).rejects.toThrow();
    });
  });

  describe('getFirstAccountId', () => {
    const token = 'jwt-token-123';

    it('should return first account ID', async () => {
      mockAxios.onGet('/accounts').reply(200, {
        data: [
          { id: 'account-1', name: 'Nubank' },
          { id: 'account-2', name: 'Inter' },
        ],
      });

      const result = await botApiService.getFirstAccountId(token);
      expect(result).toBe('account-1');
    });

    it('should throw error when no accounts exist', async () => {
      mockAxios.onGet('/accounts').reply(200, {
        data: [],
      });

      await expect(botApiService.getFirstAccountId(token)).rejects.toThrow(
        'Nenhuma conta encontrada.'
      );
    });
  });

  describe('createTransaction', () => {
    const token = 'jwt-token-123';
    const mockAccount = { id: 'account-1', name: 'Nubank' };
    const mockTransaction = {
      id: 'transaction-1',
      description: 'Almoço',
      amount: 45,
      type: LaunchType.EXPENSE,
      accountId: 'account-1',
    };

    beforeEach(() => {
      mockAxios.onGet('/accounts').reply(200, {
        data: [mockAccount],
      });
    });

    it('should create transaction successfully', async () => {
      mockAxios.onPost('/transactions').reply(200, {
        data: mockTransaction,
      });

      const result = await botApiService.createTransaction(
        token,
        'Almoço',
        45,
        LaunchType.EXPENSE
      );

      expect(result.description).toBe('Almoço');
      expect(result.amount).toBe(45);
    });

    it('should use default type EXPENSE', async () => {
      mockAxios.onPost('/transactions').reply((config) => {
        const data = JSON.parse(config.data);
        expect(data.type).toBe(LaunchType.EXPENSE);
        return [200, { data: mockTransaction }];
      });

      await botApiService.createTransaction(token, 'Almoço', 45);
    });

    it('should set isPaid to true by default', async () => {
      mockAxios.onPost('/transactions').reply((config) => {
        const data = JSON.parse(config.data);
        expect(data.isPaid).toBe(true);
        return [200, { data: mockTransaction }];
      });

      await botApiService.createTransaction(token, 'Almoço', 45);
    });

    it('should include recurrence NONE', async () => {
      mockAxios.onPost('/transactions').reply((config) => {
        const data = JSON.parse(config.data);
        expect(data.recurrence).toBeDefined();
        return [200, { data: mockTransaction }];
      });

      await botApiService.createTransaction(token, 'Almoço', 45);
    });

    it('should create INCOME transaction', async () => {
      mockAxios.onPost('/transactions').reply((config) => {
        const data = JSON.parse(config.data);
        expect(data.type).toBe(LaunchType.INCOME);
        return [200, { data: { ...mockTransaction, type: LaunchType.INCOME } }];
      });

      await botApiService.createTransaction(
        token,
        'Salário',
        5000,
        LaunchType.INCOME
      );
    });

    it('should throw error with API message', async () => {
      mockAxios.onPost('/transactions').reply(400, {
        message: 'Invalid amount',
      });

      await expect(
        botApiService.createTransaction(token, 'Almoço', -45)
      ).rejects.toThrow('Invalid amount');
    });

    it('should throw error when no accounts exist', async () => {
      mockAxios.onGet('/accounts').reply(200, { data: [] });

      await expect(
        botApiService.createTransaction(token, 'Almoço', 45)
      ).rejects.toThrow('Nenhuma conta encontrada.');
    });
  });

  describe('getLastTransactions', () => {
    const token = 'jwt-token-123';
    const mockTransactions = [
      { id: '1', description: 'T1', amount: 100 },
      { id: '2', description: 'T2', amount: 200 },
      { id: '3', description: 'T3', amount: 300 },
      { id: '4', description: 'T4', amount: 400 },
      { id: '5', description: 'T5', amount: 500 },
      { id: '6', description: 'T6', amount: 600 },
    ];

    it('should get last 5 transactions by default', async () => {
      mockAxios.onGet('/transactions').reply(200, {
        data: mockTransactions,
      });

      const result = await botApiService.getLastTransactions(token);
      expect(result).toHaveLength(5);
    });

    it('should respect custom limit', async () => {
      mockAxios.onGet('/transactions').reply(200, {
        data: mockTransactions,
      });

      const result = await botApiService.getLastTransactions(token, 3);
      expect(result).toHaveLength(3);
    });

    it('should throw error on failure', async () => {
      mockAxios.onGet('/transactions').reply(500);

      await expect(botApiService.getLastTransactions(token)).rejects.toThrow(
        'Não foi possível buscar o extrato.'
      );
    });
  });

  describe('getDashboardSummary', () => {
    const token = 'jwt-token-123';
    const mockSummary = {
      totalBalance: 5000,
      periodSummary: {
        income: 8000,
        expense: 3000,
        result: 5000,
      },
    };

    it('should get dashboard summary successfully', async () => {
      mockAxios.onGet('/reports/summary').reply(200, {
        data: mockSummary,
      });

      const result = await botApiService.getDashboardSummary(token);
      expect(result.totalBalance).toBe(5000);
      expect(result.periodSummary.income).toBe(8000);
    });

    it('should throw error on failure', async () => {
      mockAxios.onGet('/reports/summary').reply(500);

      await expect(botApiService.getDashboardSummary(token)).rejects.toThrow(
        'Não foi possível buscar o saldo.'
      );
    });
  });

  describe('getInsights', () => {
    const token = 'jwt-token-123';
    const mockInsights = [
      { type: 'warning', text: 'Gastos altos' },
      { type: 'success', text: 'Economizou bem' },
    ];

    it('should get insights successfully', async () => {
      mockAxios.onGet('/reports/insights').reply(200, {
        data: mockInsights,
      });

      const result = await botApiService.getInsights(token);
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('warning');
    });

    it('should return empty array when no insights', async () => {
      mockAxios.onGet('/reports/insights').reply(200, {
        data: [],
      });

      const result = await botApiService.getInsights(token);
      expect(result).toEqual([]);
    });

    it('should throw error on failure', async () => {
      mockAxios.onGet('/reports/insights').reply(500);

      await expect(botApiService.getInsights(token)).rejects.toThrow(
        'Não foi possível buscar insights.'
      );
    });
  });

  describe('getExpensesByCategory', () => {
    const token = 'jwt-token-123';
    const mockCategories = [
      { name: 'Alimentação', icon: '🍔', amount: 500 },
      { name: 'Transporte', icon: '🚗', amount: 300 },
    ];

    it('should get expenses by category successfully', async () => {
      mockAxios.onGet('/reports/expenses-by-category').reply(200, {
        data: mockCategories,
      });

      const result = await botApiService.getExpensesByCategory(token);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Alimentação');
    });

    it('should return empty array when no categories', async () => {
      mockAxios.onGet('/reports/expenses-by-category').reply(200, {
        data: [],
      });

      const result = await botApiService.getExpensesByCategory(token);
      expect(result).toEqual([]);
    });

    it('should throw error on failure', async () => {
      mockAxios.onGet('/reports/expenses-by-category').reply(500);

      await expect(botApiService.getExpensesByCategory(token)).rejects.toThrow(
        'Não foi possível buscar o relatório de categorias.'
      );
    });
  });

  describe('downloadReport', () => {
    const token = 'jwt-token-123';
    const mockBuffer = new ArrayBuffer(8);

    it('should download PDF report successfully', async () => {
      mockAxios.onGet('/reports/export').reply(200, mockBuffer);

      const result = await botApiService.downloadReport(token, 'PDF');
      expect(result).toBeInstanceOf(ArrayBuffer);
    });

    it('should download EXCEL report successfully', async () => {
      mockAxios.onGet('/reports/export').reply(200, mockBuffer);

      const result = await botApiService.downloadReport(token, 'EXCEL');
      expect(result).toBeInstanceOf(ArrayBuffer);
    });

    it('should send correct type parameter', async () => {
      mockAxios.onGet('/reports/export').reply((config) => {
        expect(config.params?.type).toBe('PDF');
        return [200, mockBuffer];
      });

      await botApiService.downloadReport(token, 'PDF');
    });

    it('should use arraybuffer response type', async () => {
      mockAxios.onGet('/reports/export').reply((config) => {
        expect(config.responseType).toBe('arraybuffer');
        return [200, mockBuffer];
      });

      await botApiService.downloadReport(token, 'PDF');
    });

    it('should throw error on failure', async () => {
      mockAxios.onGet('/reports/export').reply(500);

      await expect(botApiService.downloadReport(token, 'PDF')).rejects.toThrow(
        'Falha ao baixar o relatório.'
      );
    });
  });

  describe('Error handling', () => {
    const token = 'jwt-token-123';

    it('should handle network errors', async () => {
      mockAxios.onGet('/reports/summary').networkError();

      await expect(botApiService.getDashboardSummary(token)).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      mockAxios.onGet('/reports/summary').timeout();

      await expect(botApiService.getDashboardSummary(token)).rejects.toThrow();
    });

    it('should handle 401 unauthorized', async () => {
      mockAxios.onGet('/reports/summary').reply(401);

      await expect(botApiService.getDashboardSummary(token)).rejects.toThrow();
    });
  });
});
