/**
 * Mock para os serviços de API
 */

import { LaunchType } from '@fayol/shared-types';

export const mockApiService = {
  checkUser: jest.fn(),
  login: jest.fn(),
  updateOnboarding: jest.fn(),
  createAccount: jest.fn(),
  createTransaction: jest.fn(),
  getDashboardSummary: jest.fn(),
  getLastTransactions: jest.fn(),
  getInsights: jest.fn(),
  getExpensesByCategory: jest.fn(),
  downloadReport: jest.fn(),
};

export const mockBotApiService = {
  checkUser: jest.fn(),
  login: jest.fn(),
  updateOnboarding: jest.fn(),
  createAccount: jest.fn(),
  getAccounts: jest.fn(),
  getFirstAccountId: jest.fn(),
  createTransaction: jest.fn(),
  getLastTransactions: jest.fn(),
  getDashboardSummary: jest.fn(),
  getInsights: jest.fn(),
  getExpensesByCategory: jest.fn(),
  downloadReport: jest.fn(),
};

// Dados de mock para respostas
export const mockUser = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  onboardingStep: 5,
  investorProfile: 'MODERATE',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockLoginResponse = {
  access_token: 'mock-jwt-token-12345',
  user: mockUser,
};

export const mockAccount = {
  id: 'account-123',
  name: 'Nubank',
  type: 'CHECKING',
  balance: 1000,
  currency: 'BRL',
  userId: 'user-123',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockTransaction = {
  id: 'transaction-123',
  description: 'Almoço',
  amount: 45.0,
  date: new Date('2024-01-15'),
  type: LaunchType.EXPENSE,
  isPaid: true,
  accountId: 'account-123',
  categoryId: 'category-food',
  userId: 'user-123',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
};

export const mockDashboardSummary = {
  totalBalance: 5000,
  periodSummary: {
    income: 8000,
    expense: 3000,
    result: 5000,
  },
};

export const mockTransactions = [
  {
    id: 'transaction-1',
    description: 'Salário',
    amount: 5000,
    date: new Date('2024-01-01'),
    type: LaunchType.INCOME,
    isPaid: true,
    accountId: 'account-123',
    categoryId: null,
  },
  {
    id: 'transaction-2',
    description: 'Almoço',
    amount: 45,
    date: new Date('2024-01-02'),
    type: LaunchType.EXPENSE,
    isPaid: true,
    accountId: 'account-123',
    categoryId: 'category-food',
  },
  {
    id: 'transaction-3',
    description: 'Uber',
    amount: 25,
    date: new Date('2024-01-03'),
    type: LaunchType.EXPENSE,
    isPaid: true,
    accountId: 'account-123',
    categoryId: 'category-transport',
  },
];

export const mockCategories = [
  {
    name: 'Alimentação',
    icon: '🍔',
    amount: 500,
  },
  {
    name: 'Transporte',
    icon: '🚗',
    amount: 300,
  },
  {
    name: 'Lazer',
    icon: '🎮',
    amount: 200,
  },
];

export const mockInsights = [
  {
    type: 'warning' as const,
    text: 'Seus gastos com alimentação aumentaram 20% este mês.',
  },
  {
    type: 'success' as const,
    text: 'Parabéns! Você economizou 15% em transporte.',
  },
  {
    type: 'info' as const,
    text: 'Você tem R$ 500 disponíveis para investir este mês.',
  },
];

// Funções helper para resetar mocks
export const resetApiMocks = () => {
  Object.values(mockApiService).forEach((fn) => {
    if (jest.isMockFunction(fn)) {
      fn.mockReset();
    }
  });
};

export const resetBotApiMocks = () => {
  Object.values(mockBotApiService).forEach((fn) => {
    if (jest.isMockFunction(fn)) {
      fn.mockReset();
    }
  });
};

// Configurações padrão de mock
export const setupSuccessfulApiMocks = () => {
  mockBotApiService.checkUser.mockResolvedValue(true);
  mockBotApiService.login.mockResolvedValue(mockLoginResponse);
  mockBotApiService.updateOnboarding.mockResolvedValue(mockUser);
  mockBotApiService.createAccount.mockResolvedValue(mockAccount);
  mockBotApiService.getAccounts.mockResolvedValue([mockAccount]);
  mockBotApiService.getFirstAccountId.mockResolvedValue('account-123');
  mockBotApiService.createTransaction.mockResolvedValue(mockTransaction);
  mockBotApiService.getLastTransactions.mockResolvedValue(mockTransactions);
  mockBotApiService.getDashboardSummary.mockResolvedValue(mockDashboardSummary);
  mockBotApiService.getInsights.mockResolvedValue(mockInsights);
  mockBotApiService.getExpensesByCategory.mockResolvedValue(mockCategories);
  mockBotApiService.downloadReport.mockResolvedValue(Buffer.from('PDF content'));
};
