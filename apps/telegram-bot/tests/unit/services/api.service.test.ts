/**
 * Testes unitários para ApiService
 */

import { ApiService } from '../../../src/services/api.service';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

describe('ApiService', () => {
  let apiService: ApiService;
  let mockAxios: MockAdapter;

  const BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:3333/api';

  beforeEach(() => {
    apiService = new ApiService();
    mockAxios = new MockAdapter((apiService as any).api);
  });

  afterEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  describe('checkUser', () => {
    it('should return true when user exists', async () => {
      mockAxios.onPost(`${BASE_URL}/auth/check`).reply(200, {
        data: { exists: true },
      });

      const result = await apiService.checkUser('test@example.com');
      expect(result).toBe(true);
    });

    it('should return false when user does not exist', async () => {
      mockAxios.onPost(`${BASE_URL}/auth/check`).reply(200, {
        data: { exists: false },
      });

      const result = await apiService.checkUser('nonexistent@example.com');
      expect(result).toBe(false);
    });

    it('should handle response with exists at root level', async () => {
      mockAxios.onPost(`${BASE_URL}/auth/check`).reply(200, {
        exists: true,
      });

      const result = await apiService.checkUser('test@example.com');
      expect(result).toBe(true);
    });

    it('should throw error on network failure', async () => {
      mockAxios.onPost(`${BASE_URL}/auth/check`).networkError();

      await expect(apiService.checkUser('test@example.com')).rejects.toThrow();
    });

    it('should throw error on 500 status', async () => {
      mockAxios.onPost(`${BASE_URL}/auth/check`).reply(500, {
        error: 'Internal Server Error',
      });

      await expect(apiService.checkUser('test@example.com')).rejects.toThrow();
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
        },
      },
    };

    it('should return login data on successful authentication', async () => {
      mockAxios.onPost(`${BASE_URL}/auth/login`).reply(200, mockLoginResponse);

      const result = await apiService.login('test@example.com', 'password123');
      expect(result).toEqual(mockLoginResponse.data);
    });

    it('should return null on invalid credentials', async () => {
      mockAxios.onPost(`${BASE_URL}/auth/login`).reply(401, {
        error: 'Invalid credentials',
      });

      const result = await apiService.login('test@example.com', 'wrongpassword');
      expect(result).toBeNull();
    });

    it('should return null on network error', async () => {
      mockAxios.onPost(`${BASE_URL}/auth/login`).networkError();

      const result = await apiService.login('test@example.com', 'password123');
      expect(result).toBeNull();
    });

    it('should handle response without data wrapper', async () => {
      mockAxios.onPost(`${BASE_URL}/auth/login`).reply(200, {
        access_token: 'jwt-token-123',
        user: { id: 'user-1' },
      });

      const result = await apiService.login('test@example.com', 'password123');
      expect(result).toBeTruthy();
      expect(result?.access_token).toBe('jwt-token-123');
    });
  });

  describe('updateOnboarding', () => {
    const token = 'jwt-token-123';
    const mockUser = {
      id: 'user-1',
      name: 'Updated User',
      onboardingStep: 3,
    };

    it('should update onboarding step successfully', async () => {
      mockAxios.onPatch(`${BASE_URL}/users/onboarding/step`).reply(200, {
        data: mockUser,
      });

      const result = await apiService.updateOnboarding(token, {
        step: 3,
        name: 'Updated User',
      });

      expect(result).toEqual(mockUser);
    });

    it('should send authorization header', async () => {
      mockAxios.onPatch(`${BASE_URL}/users/onboarding/step`).reply((config) => {
        expect(config.headers?.Authorization).toBe(`Bearer ${token}`);
        return [200, { data: mockUser }];
      });

      await apiService.updateOnboarding(token, { step: 3 });
    });

    it('should throw error on failure', async () => {
      mockAxios.onPatch(`${BASE_URL}/users/onboarding/step`).reply(500);

      await expect(
        apiService.updateOnboarding(token, { step: 3 })
      ).rejects.toThrow('Falha ao atualizar perfil.');
    });

    it('should handle unauthorized request', async () => {
      mockAxios.onPatch(`${BASE_URL}/users/onboarding/step`).reply(401);

      await expect(
        apiService.updateOnboarding('invalid-token', { step: 3 })
      ).rejects.toThrow();
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
    };

    it('should create account successfully', async () => {
      mockAxios.onPost(`${BASE_URL}/accounts`).reply(200, {
        data: mockAccount,
      });

      const result = await apiService.createAccount(token, accountData);
      expect(result).toEqual(mockAccount);
    });

    it('should add default currency BRL', async () => {
      mockAxios.onPost(`${BASE_URL}/accounts`).reply((config) => {
        const data = JSON.parse(config.data);
        expect(data.currency).toBe('BRL');
        return [200, { data: mockAccount }];
      });

      await apiService.createAccount(token, accountData);
    });

    it('should allow custom currency', async () => {
      mockAxios.onPost(`${BASE_URL}/accounts`).reply((config) => {
        const data = JSON.parse(config.data);
        expect(data.currency).toBe('USD');
        return [200, { data: { ...mockAccount, currency: 'USD' } }];
      });

      await apiService.createAccount(token, { ...accountData, currency: 'USD' });
    });

    it('should send authorization header', async () => {
      mockAxios.onPost(`${BASE_URL}/accounts`).reply((config) => {
        expect(config.headers?.Authorization).toBe(`Bearer ${token}`);
        return [200, { data: mockAccount }];
      });

      await apiService.createAccount(token, accountData);
    });

    it('should throw error on failure', async () => {
      mockAxios.onPost(`${BASE_URL}/accounts`).reply(500);

      await expect(
        apiService.createAccount(token, accountData)
      ).rejects.toThrow('Falha ao criar conta.');
    });
  });

  describe('createTransaction', () => {
    const token = 'jwt-token-123';
    const mockAccounts = [{ id: 'account-1', name: 'Nubank' }];
    const mockTransaction = {
      id: 'transaction-1',
      description: 'Almoço',
      amount: 45,
      type: 'EXPENSE',
    };

    beforeEach(() => {
      // Mock getFirstAccountId
      mockAxios.onGet(`${BASE_URL}/accounts`).reply(200, {
        data: mockAccounts,
      });
    });

    it('should create transaction successfully', async () => {
      mockAxios.onPost(`${BASE_URL}/transactions`).reply(200, {
        data: mockTransaction,
      });

      const result = await apiService.createTransaction(
        token,
        'Almoço',
        45,
        'EXPENSE'
      );

      expect(result).toEqual(mockTransaction);
    });

    it('should use default type EXPENSE', async () => {
      mockAxios.onPost(`${BASE_URL}/transactions`).reply((config) => {
        const data = JSON.parse(config.data);
        expect(data.type).toBe('EXPENSE');
        return [200, { data: mockTransaction }];
      });

      await apiService.createTransaction(token, 'Almoço', 45);
    });

    it('should get first account ID automatically', async () => {
      mockAxios.onPost(`${BASE_URL}/transactions`).reply((config) => {
        const data = JSON.parse(config.data);
        expect(data.accountId).toBe('account-1');
        return [200, { data: mockTransaction }];
      });

      await apiService.createTransaction(token, 'Almoço', 45);
    });

    it('should throw error when no accounts exist', async () => {
      mockAxios.onGet(`${BASE_URL}/accounts`).reply(200, { data: [] });

      await expect(
        apiService.createTransaction(token, 'Almoço', 45)
      ).rejects.toThrow('Nenhuma conta encontrada.');
    });

    it('should throw error with message from API', async () => {
      mockAxios.onPost(`${BASE_URL}/transactions`).reply(400, {
        message: 'Invalid transaction data',
      });

      await expect(
        apiService.createTransaction(token, 'Almoço', 45)
      ).rejects.toThrow('Invalid transaction data');
    });

    it('should send authorization header', async () => {
      mockAxios.onPost(`${BASE_URL}/transactions`).reply((config) => {
        expect(config.headers?.Authorization).toBe(`Bearer ${token}`);
        return [200, { data: mockTransaction }];
      });

      await apiService.createTransaction(token, 'Almoço', 45);
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
      mockAxios.onGet(`${BASE_URL}/reports/summary`).reply(200, {
        data: mockSummary,
      });

      const result = await apiService.getDashboardSummary(token);
      expect(result).toEqual(mockSummary);
    });

    it('should send authorization header', async () => {
      mockAxios.onGet(`${BASE_URL}/reports/summary`).reply((config) => {
        expect(config.headers?.Authorization).toBe(`Bearer ${token}`);
        return [200, { data: mockSummary }];
      });

      await apiService.getDashboardSummary(token);
    });

    it('should throw error on failure', async () => {
      mockAxios.onGet(`${BASE_URL}/reports/summary`).reply(500);

      await expect(apiService.getDashboardSummary(token)).rejects.toThrow(
        'Não foi possível buscar o saldo.'
      );
    });
  });

  describe('getLastTransactions', () => {
    const token = 'jwt-token-123';
    const mockTransactions = [
      { id: '1', description: 'Transação 1', amount: 100 },
      { id: '2', description: 'Transação 2', amount: 200 },
      { id: '3', description: 'Transação 3', amount: 300 },
      { id: '4', description: 'Transação 4', amount: 400 },
      { id: '5', description: 'Transação 5', amount: 500 },
      { id: '6', description: 'Transação 6', amount: 600 },
    ];

    it('should get last 5 transactions by default', async () => {
      mockAxios.onGet(`${BASE_URL}/transactions`).reply(200, {
        data: mockTransactions,
      });

      const result = await apiService.getLastTransactions(token);
      expect(result).toHaveLength(5);
      expect(result[0].id).toBe('1');
    });

    it('should respect custom limit', async () => {
      mockAxios.onGet(`${BASE_URL}/transactions`).reply(200, {
        data: mockTransactions,
      });

      const result = await apiService.getLastTransactions(token, 3);
      expect(result).toHaveLength(3);
    });

    it('should handle array response without data wrapper', async () => {
      mockAxios.onGet(`${BASE_URL}/transactions`).reply(200, mockTransactions);

      const result = await apiService.getLastTransactions(token);
      expect(result).toHaveLength(5);
    });

    it('should throw error on failure', async () => {
      mockAxios.onGet(`${BASE_URL}/transactions`).reply(500);

      await expect(apiService.getLastTransactions(token)).rejects.toThrow(
        'Não foi possível buscar o extrato.'
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
      mockAxios.onGet(`${BASE_URL}/reports/insights`).reply(200, {
        data: mockInsights,
      });

      const result = await apiService.getInsights(token);
      expect(result).toEqual(mockInsights);
    });

    it('should throw error on failure', async () => {
      mockAxios.onGet(`${BASE_URL}/reports/insights`).reply(500);

      await expect(apiService.getInsights(token)).rejects.toThrow(
        'Não foi possível buscar insights.'
      );
    });
  });

  describe('getExpensesByCategory', () => {
    const token = 'jwt-token-123';
    const mockCategories = [
      { name: 'Alimentação', amount: 500 },
      { name: 'Transporte', amount: 300 },
    ];

    it('should get expenses by category successfully', async () => {
      mockAxios.onGet(`${BASE_URL}/reports/expenses-by-category`).reply(200, {
        data: mockCategories,
      });

      const result = await apiService.getExpensesByCategory(token);
      expect(result).toEqual(mockCategories);
    });

    it('should throw error on failure', async () => {
      mockAxios.onGet(`${BASE_URL}/reports/expenses-by-category`).reply(500);

      await expect(apiService.getExpensesByCategory(token)).rejects.toThrow(
        'Não foi possível buscar o relatório de categorias.'
      );
    });
  });

  describe('downloadReport', () => {
    const token = 'jwt-token-123';
    const mockBuffer = Buffer.from('PDF content');

    it('should download PDF report successfully', async () => {
      mockAxios.onGet(`${BASE_URL}/reports/export`).reply(200, mockBuffer);

      const result = await apiService.downloadReport(token, 'PDF');
      expect(result).toBeInstanceOf(ArrayBuffer);
    });

    it('should download EXCEL report successfully', async () => {
      mockAxios.onGet(`${BASE_URL}/reports/export`).reply(200, mockBuffer);

      const result = await apiService.downloadReport(token, 'EXCEL');
      expect(result).toBeInstanceOf(ArrayBuffer);
    });

    it('should send correct type parameter', async () => {
      mockAxios.onGet(`${BASE_URL}/reports/export`).reply((config) => {
        expect(config.params?.type).toBe('PDF');
        return [200, mockBuffer];
      });

      await apiService.downloadReport(token, 'PDF');
    });

    it('should throw error on failure', async () => {
      mockAxios.onGet(`${BASE_URL}/reports/export`).reply(500);

      await expect(apiService.downloadReport(token, 'PDF')).rejects.toThrow(
        'Falha ao baixar o relatório.'
      );
    });
  });

  describe('Error handling', () => {
    const token = 'jwt-token-123';

    it('should handle ECONNREFUSED error', async () => {
      mockAxios.onGet(`${BASE_URL}/reports/summary`).networkError();

      await expect(apiService.getDashboardSummary(token)).rejects.toThrow();
    });

    it('should handle timeout', async () => {
      mockAxios.onGet(`${BASE_URL}/reports/summary`).timeout();

      await expect(apiService.getDashboardSummary(token)).rejects.toThrow();
    });

    it('should handle 401 unauthorized', async () => {
      mockAxios.onGet(`${BASE_URL}/reports/summary`).reply(401, {
        error: 'Unauthorized',
      });

      await expect(apiService.getDashboardSummary(token)).rejects.toThrow();
    });

    it('should handle 404 not found', async () => {
      mockAxios.onGet(`${BASE_URL}/reports/summary`).reply(404, {
        error: 'Not found',
      });

      await expect(apiService.getDashboardSummary(token)).rejects.toThrow();
    });
  });
});
