import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Create a test QueryClient with disabled retries for faster tests
 */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {
        // Suppress errors in tests
      },
    },
  });

/**
 * Custom render with all providers
 */
interface AllTheProvidersProps {
  children: React.ReactNode;
}

export const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

/**
 * Custom render function that wraps components with providers
 */
export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  return render(ui, { wrapper: AllTheProviders, ...options });
};

/**
 * Re-export everything from testing-library
 */
export * from '@testing-library/react';
export { renderWithProviders as render };

// ==================== MOCK API CLIENT ====================

/**
 * Mock API client for all endpoints
 */
export const mockApiClient = {
  auth: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
    resetPassword: jest.fn(),
    verifyEmail: jest.fn(),
    enable2FA: jest.fn(),
    disable2FA: jest.fn(),
    verify2FA: jest.fn(),
  },
  accounts: {
    list: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getBalance: jest.fn(),
  },
  transactions: {
    list: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    import: jest.fn(),
    export: jest.fn(),
  },
  categories: {
    list: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  budgets: {
    list: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getProgress: jest.fn(),
  },
  goals: {
    list: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getProgress: jest.fn(),
  },
  investments: {
    list: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getPortfolio: jest.fn(),
    getPerformance: jest.fn(),
  },
  trades: {
    list: jest.fn(),
    create: jest.fn(),
    get: jest.fn(),
  },
  reports: {
    generate: jest.fn(),
    export: jest.fn(),
    getInsights: jest.fn(),
  },
  insights: {
    getFinancialInsights: jest.fn(),
    getCategorization: jest.fn(),
    getForecasting: jest.fn(),
    getAnomalies: jest.fn(),
  },
};

/**
 * Reset all API client mocks
 */
export const resetMockApiClient = () => {
  Object.values(mockApiClient).forEach((endpoint) => {
    Object.values(endpoint).forEach((fn) => {
      if (jest.isMockFunction(fn)) {
        fn.mockReset();
      }
    });
  });
};

// ==================== MOCK DATA FACTORIES ====================

/**
 * Create mock user data
 */
export const createMockUser = (overrides: any = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  phone: '11999999999',
  roles: ['USER'],
  isActive: true,
  emailVerified: true,
  twoFactorEnabled: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Create mock account data
 */
export const createMockAccount = (overrides: any = {}) => ({
  id: 'account-123',
  userId: 'user-123',
  name: 'Test Account',
  type: 'CHECKING',
  balance: 1000,
  currency: 'BRL',
  isArchived: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Create mock transaction data
 */
export const createMockTransaction = (overrides: any = {}) => ({
  id: 'transaction-123',
  userId: 'user-123',
  accountId: 'account-123',
  categoryId: 'category-123',
  type: 'EXPENSE',
  amount: 100,
  description: 'Test Transaction',
  date: new Date().toISOString(),
  isRecurring: false,
  isPending: false,
  tags: [],
  category: createMockCategory(),
  account: createMockAccount(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Create mock category data
 */
export const createMockCategory = (overrides: any = {}) => ({
  id: 'category-123',
  userId: 'user-123',
  name: 'Test Category',
  type: 'EXPENSE',
  icon: '💰',
  color: '#FF5733',
  isDefault: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Create mock budget data
 */
export const createMockBudget = (overrides: any = {}) => ({
  id: 'budget-123',
  userId: 'user-123',
  categoryId: 'category-123',
  name: 'Test Budget',
  amount: 1000,
  period: 'MONTHLY',
  alertThreshold: 80,
  isActive: true,
  spent: 500,
  remaining: 500,
  progress: 50,
  category: createMockCategory(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Create mock goal data
 */
export const createMockGoal = (overrides: any = {}) => ({
  id: 'goal-123',
  userId: 'user-123',
  accountId: 'account-123',
  name: 'Test Goal',
  targetAmount: 10000,
  currentAmount: 5000,
  deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'IN_PROGRESS',
  progress: 50,
  account: createMockAccount(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Create mock investment data
 */
export const createMockInvestment = (overrides: any = {}) => ({
  id: 'investment-123',
  userId: 'user-123',
  accountId: 'account-123',
  symbol: 'AAPL',
  name: 'Apple Inc.',
  type: 'STOCK_US',
  quantity: 10,
  averagePrice: 150,
  currentPrice: 155,
  currency: 'USD',
  totalValue: 1550,
  totalCost: 1500,
  profitLoss: 50,
  profitLossPercentage: 3.33,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Create mock paginated response
 */
export const createMockPaginatedResponse = <T>(
  data: T[],
  page: number = 1,
  limit: number = 10,
  total?: number,
) => ({
  data,
  meta: {
    total: total || data.length,
    page,
    limit,
    totalPages: Math.ceil((total || data.length) / limit),
  },
});

// ==================== UTILITY FUNCTIONS ====================

/**
 * Wait for async operations to complete
 */
export const waitFor = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Mock successful API response
 */
export const mockSuccessResponse = <T>(data: T) => {
  return Promise.resolve({ data });
};

/**
 * Mock API error response
 */
export const mockErrorResponse = (
  message: string,
  statusCode: number = 400,
) => {
  return Promise.reject({
    response: {
      status: statusCode,
      data: {
        error: message,
        statusCode,
      },
    },
  });
};

/**
 * Generate array of mock data
 */
export const generateMockArray = <T>(
  factory: (index: number) => T,
  count: number,
): T[] => {
  return Array.from({ length: count }, (_, index) => factory(index));
};

/**
 * Mock localStorage
 */
export const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

/**
 * Mock window.matchMedia
 */
export const mockMatchMedia = (matches: boolean = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

/**
 * Mock IntersectionObserver
 */
export const mockIntersectionObserver = () => {
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() {
      return [];
    }
    unobserve() {}
  } as any;
};

/**
 * Setup common global mocks for tests
 */
export const setupGlobalMocks = () => {
  mockMatchMedia();
  mockIntersectionObserver();
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
  });
};
