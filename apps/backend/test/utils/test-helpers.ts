import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@fayol/database-models';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

/**
 * Create a NestJS testing module with providers
 */
export const createTestingModule = async (providers: any[]) => {
  return await Test.createTestingModule({
    providers,
  }).compile();
};

/**
 * Factory to create a complete Prisma mock with all models
 */
export const mockPrismaFactory = () => ({
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  account: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  transaction: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    aggregate: jest.fn(),
    count: jest.fn(),
  },
  category: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  budget: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  goal: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  investment: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  trade: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  notification: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
  },
  consent: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((callback) => {
    // For callback-based transactions
    if (typeof callback === 'function') {
      return callback(mockPrismaFactory());
    }
    // For array-based transactions
    return Promise.resolve(callback);
  }),
  $disconnect: jest.fn(),
  $connect: jest.fn(),
});

/**
 * Create a deep mock Prisma client (using jest-mock-extended)
 */
export const createDeepMockPrisma = (): DeepMockProxy<PrismaClient> => {
  return mockDeep<PrismaClient>();
};

// ==================== MOCK DATA FACTORIES ====================

/**
 * Create a mock user with sensible defaults
 */
export const createMockUser = (overrides: any = {}) => ({
  id: 'user-' + Math.random().toString(36).substr(2, 9),
  email: `test${Math.random().toString(36).substr(2, 5)}@example.com`,
  name: 'Test User',
  password: '$2b$10$hashedpassword', // bcrypt hash
  phone: '11999999999',
  roles: ['USER'],
  isActive: true,
  emailVerified: true,
  twoFactorEnabled: false,
  twoFactorSecret: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Create a mock account
 */
export const createMockAccount = (overrides: any = {}) => ({
  id: 'account-' + Math.random().toString(36).substr(2, 9),
  userId: 'user-123',
  name: 'Test Account',
  type: 'CHECKING',
  balance: 1000,
  currency: 'BRL',
  initialBalance: 0,
  isArchived: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Create a mock transaction
 */
export const createMockTransaction = (overrides: any = {}) => ({
  id: 'transaction-' + Math.random().toString(36).substr(2, 9),
  userId: 'user-123',
  accountId: 'account-123',
  categoryId: 'category-123',
  type: 'EXPENSE',
  amount: 100,
  description: 'Test Transaction',
  date: new Date(),
  isRecurring: false,
  isPending: false,
  tags: [],
  aiCategorized: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Create a mock category
 */
export const createMockCategory = (overrides: any = {}) => ({
  id: 'category-' + Math.random().toString(36).substr(2, 9),
  userId: 'user-123',
  name: 'Test Category',
  type: 'EXPENSE',
  icon: '💰',
  color: '#FF5733',
  parentId: null,
  isDefault: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Create a mock budget
 */
export const createMockBudget = (overrides: any = {}) => ({
  id: 'budget-' + Math.random().toString(36).substr(2, 9),
  userId: 'user-123',
  categoryId: 'category-123',
  name: 'Test Budget',
  amount: 1000,
  period: 'MONTHLY',
  startDate: new Date(),
  endDate: null,
  alertThreshold: 80,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Create a mock goal
 */
export const createMockGoal = (overrides: any = {}) => ({
  id: 'goal-' + Math.random().toString(36).substr(2, 9),
  userId: 'user-123',
  accountId: 'account-123',
  name: 'Test Goal',
  targetAmount: 10000,
  currentAmount: 0,
  deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
  status: 'IN_PROGRESS',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Create a mock investment
 */
export const createMockInvestment = (overrides: any = {}) => ({
  id: 'investment-' + Math.random().toString(36).substr(2, 9),
  userId: 'user-123',
  accountId: 'account-123',
  symbol: 'AAPL',
  name: 'Apple Inc.',
  type: 'STOCK_US',
  quantity: 10,
  averagePrice: 150,
  currentPrice: 155,
  currency: 'USD',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Create a mock trade
 */
export const createMockTrade = (overrides: any = {}) => ({
  id: 'trade-' + Math.random().toString(36).substr(2, 9),
  userId: 'user-123',
  investmentId: 'investment-123',
  type: 'BUY',
  quantity: 5,
  price: 150,
  totalAmount: 750,
  date: new Date(),
  fees: 0,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Create a mock notification
 */
export const createMockNotification = (overrides: any = {}) => ({
  id: 'notification-' + Math.random().toString(36).substr(2, 9),
  userId: 'user-123',
  type: 'BUDGET_ALERT',
  title: 'Test Notification',
  message: 'This is a test notification',
  isRead: false,
  createdAt: new Date(),
  ...overrides,
});

/**
 * Create a mock consent
 */
export const createMockConsent = (overrides: any = {}) => ({
  id: 'consent-' + Math.random().toString(36).substr(2, 9),
  userId: 'user-123',
  type: 'TERMS_OF_SERVICE',
  isGranted: true,
  grantedAt: new Date(),
  revokedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// ==================== UTILITY FUNCTIONS ====================

/**
 * Wait for a promise to resolve/reject (useful for testing async operations)
 */
export const waitFor = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Create a mock JWT payload
 */
export const createMockJwtPayload = (overrides: any = {}) => ({
  sub: 'user-123',
  email: 'test@example.com',
  roles: ['USER'],
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  ...overrides,
});

/**
 * Create a mock request object (Express)
 */
export const createMockRequest = (overrides: any = {}) => ({
  user: createMockJwtPayload(),
  params: {},
  query: {},
  body: {},
  headers: {},
  ...overrides,
});

/**
 * Create a mock response object (Express)
 */
export const createMockResponse = () => {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  };
  return res;
};

/**
 * Reset all mocks in a Prisma mock object
 */
export const resetPrismaMocks = (prismaMock: any) => {
  Object.keys(prismaMock).forEach((key) => {
    if (typeof prismaMock[key] === 'object' && prismaMock[key] !== null) {
      Object.keys(prismaMock[key]).forEach((method) => {
        if (jest.isMockFunction(prismaMock[key][method])) {
          prismaMock[key][method].mockClear();
        }
      });
    }
  });
};

/**
 * Create a date offset from now
 */
export const dateOffset = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

/**
 * Generate a random string for testing
 */
export const randomString = (length: number = 10): string => {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
};
