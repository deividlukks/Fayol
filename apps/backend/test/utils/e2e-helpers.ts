import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

/**
 * Interface for authenticated user data
 */
export interface AuthenticatedUser {
  user: {
    id: string;
    email: string;
    name: string;
    roles: string[];
  };
  token: string;
}

/**
 * Register a new user and return auth data
 */
export const registerUser = async (
  app: INestApplication,
  userData?: Partial<{
    name: string;
    email: string;
    password: string;
    phone: string;
  }>,
): Promise<AuthenticatedUser> => {
  const timestamp = Date.now();
  const user = {
    name: userData?.name || `Test User ${timestamp}`,
    email: userData?.email || `test${timestamp}@example.com`,
    password: userData?.password || 'Test@123456',
    phone: userData?.phone || '11999999999',
  };

  const registerResponse = await request(app.getHttpServer())
    .post('/auth/register')
    .send(user)
    .expect(201);

  return {
    user: registerResponse.body.user,
    token: registerResponse.body.access_token,
  };
};

/**
 * Register and login a user
 */
export const registerAndLogin = async (
  app: INestApplication,
  userData?: Partial<{
    name: string;
    email: string;
    password: string;
    phone: string;
  }>,
): Promise<AuthenticatedUser> => {
  const timestamp = Date.now();
  const user = {
    name: userData?.name || `Test User ${timestamp}`,
    email: userData?.email || `test${timestamp}@example.com`,
    password: userData?.password || 'Test@123456',
    phone: userData?.phone || '11999999999',
  };

  // Register
  await request(app.getHttpServer())
    .post('/auth/register')
    .send(user)
    .expect(201);

  // Login
  const loginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({
      email: user.email,
      password: user.password,
    })
    .expect(200);

  return {
    user: loginResponse.body.user,
    token: loginResponse.body.access_token,
  };
};

/**
 * Login an existing user
 */
export const loginUser = async (
  app: INestApplication,
  email: string,
  password: string,
): Promise<AuthenticatedUser> => {
  const loginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(200);

  return {
    user: loginResponse.body.user,
    token: loginResponse.body.access_token,
  };
};

/**
 * Create authenticated request helpers
 */
export const authenticatedRequest = (
  app: INestApplication,
  token: string,
) => {
  const baseRequest = request(app.getHttpServer());

  return {
    get: (url: string) =>
      baseRequest.get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string) =>
      baseRequest.post(url).set('Authorization', `Bearer ${token}`),
    patch: (url: string) =>
      baseRequest.patch(url).set('Authorization', `Bearer ${token}`),
    put: (url: string) =>
      baseRequest.put(url).set('Authorization', `Bearer ${token}`),
    delete: (url: string) =>
      baseRequest.delete(url).set('Authorization', `Bearer ${token}`),
  };
};

/**
 * Create an account for a user
 */
export const createAccount = async (
  app: INestApplication,
  token: string,
  accountData?: Partial<{
    name: string;
    type: string;
    balance: number;
    currency: string;
  }>,
) => {
  const account = {
    name: accountData?.name || 'Test Account',
    type: accountData?.type || 'CHECKING',
    balance: accountData?.balance || 1000,
    currency: accountData?.currency || 'BRL',
  };

  const response = await authenticatedRequest(app, token)
    .post('/accounts')
    .send(account)
    .expect(201);

  return response.body;
};

/**
 * Create a category for a user
 */
export const createCategory = async (
  app: INestApplication,
  token: string,
  categoryData?: Partial<{
    name: string;
    type: string;
    icon: string;
    color: string;
  }>,
) => {
  const category = {
    name: categoryData?.name || 'Test Category',
    type: categoryData?.type || 'EXPENSE',
    icon: categoryData?.icon || '💰',
    color: categoryData?.color || '#FF5733',
  };

  const response = await authenticatedRequest(app, token)
    .post('/categories')
    .send(category)
    .expect(201);

  return response.body;
};

/**
 * Create a transaction for a user
 */
export const createTransaction = async (
  app: INestApplication,
  token: string,
  transactionData?: Partial<{
    accountId: string;
    categoryId: string;
    type: string;
    amount: number;
    description: string;
    date: Date;
  }>,
) => {
  const transaction = {
    accountId: transactionData?.accountId || 'account-id',
    categoryId: transactionData?.categoryId || 'category-id',
    type: transactionData?.type || 'EXPENSE',
    amount: transactionData?.amount || 100,
    description: transactionData?.description || 'Test Transaction',
    date: transactionData?.date || new Date(),
  };

  const response = await authenticatedRequest(app, token)
    .post('/transactions')
    .send(transaction)
    .expect(201);

  return response.body;
};

/**
 * Create a budget for a user
 */
export const createBudget = async (
  app: INestApplication,
  token: string,
  budgetData?: Partial<{
    categoryId: string;
    name: string;
    amount: number;
    period: string;
  }>,
) => {
  const budget = {
    categoryId: budgetData?.categoryId || 'category-id',
    name: budgetData?.name || 'Test Budget',
    amount: budgetData?.amount || 1000,
    period: budgetData?.period || 'MONTHLY',
  };

  const response = await authenticatedRequest(app, token)
    .post('/budgets')
    .send(budget)
    .expect(201);

  return response.body;
};

/**
 * Create a goal for a user
 */
export const createGoal = async (
  app: INestApplication,
  token: string,
  goalData?: Partial<{
    accountId: string;
    name: string;
    targetAmount: number;
    deadline: Date;
  }>,
) => {
  const goal = {
    accountId: goalData?.accountId || 'account-id',
    name: goalData?.name || 'Test Goal',
    targetAmount: goalData?.targetAmount || 10000,
    deadline: goalData?.deadline || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  };

  const response = await authenticatedRequest(app, token)
    .post('/goals')
    .send(goal)
    .expect(201);

  return response.body;
};

/**
 * Create a complete user with account, category, and transaction
 */
export const createCompleteUserSetup = async (
  app: INestApplication,
): Promise<{
  auth: AuthenticatedUser;
  account: any;
  category: any;
  transaction: any;
}> => {
  const auth = await registerAndLogin(app);
  const account = await createAccount(app, auth.token);
  const category = await createCategory(app, auth.token);
  const transaction = await createTransaction(app, auth.token, {
    accountId: account.id,
    categoryId: category.id,
  });

  return { auth, account, category, transaction };
};

/**
 * Cleanup test data (delete user and all related data)
 */
export const cleanupTestUser = async (
  app: INestApplication,
  token: string,
) => {
  try {
    await authenticatedRequest(app, token).delete('/users/me');
  } catch (error) {
    // Silently fail if user doesn't exist
  }
};

/**
 * Wait for a condition to be true (polling)
 */
export const waitForCondition = async (
  condition: () => Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100,
): Promise<void> => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error('Timeout waiting for condition');
};

/**
 * Verify response structure
 */
export const expectValidResponse = (
  response: request.Response,
  expectedStatus: number,
  expectedFields?: string[],
) => {
  expect(response.status).toBe(expectedStatus);

  if (expectedFields) {
    expectedFields.forEach((field) => {
      expect(response.body).toHaveProperty(field);
    });
  }

  return response.body;
};

/**
 * Expect API error response
 */
export const expectError = (
  response: request.Response,
  expectedStatus: number,
  expectedMessage?: string,
) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('error');

  if (expectedMessage) {
    expect(response.body.message).toContain(expectedMessage);
  }

  return response.body;
};

/**
 * Create multiple test resources in parallel
 */
export const createMultipleResources = async <T>(
  createFn: () => Promise<T>,
  count: number,
): Promise<T[]> => {
  const promises = Array.from({ length: count }, () => createFn());
  return Promise.all(promises);
};

/**
 * Generate test date range
 */
export const generateDateRange = (
  startDaysAgo: number,
  endDaysAgo: number = 0,
): { startDate: Date; endDate: Date } => {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - endDaysAgo);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - startDaysAgo);

  return { startDate, endDate };
};

/**
 * Verify pagination response
 */
export const expectPaginatedResponse = (
  response: request.Response,
  expectedStatus: number = 200,
) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('data');
  expect(response.body).toHaveProperty('meta');
  expect(response.body.meta).toHaveProperty('total');
  expect(response.body.meta).toHaveProperty('page');
  expect(response.body.meta).toHaveProperty('limit');
  expect(Array.isArray(response.body.data)).toBe(true);

  return response.body;
};
