/**
 * @fayol/api-client-mobile
 *
 * API Client para React Native / Expo
 * Usa expo-secure-store para tokens e AsyncStorage para cache
 */

// Re-export core functionality
export * from '@fayol/api-client-core';

// Export mobile storage adapter
export * from './adapters/mobile-storage.adapter';

// Import necessário para criar singletons
import {
  AuthService,
  UsersService,
  TransactionsService,
  AccountsService,
  BudgetsService,
  GoalsService,
  InvestmentsService,
} from '@fayol/api-client-core';
import { mobileStorage } from './adapters/mobile-storage.adapter';

// ==================== SINGLETON INSTANCES ====================
const API_BASE_URL = process.env.API_URL || 'http://localhost:3333/api';

/**
 * Auth Service Singleton
 */
export const authService = new AuthService(mobileStorage, `${API_BASE_URL}/auth`);

/**
 * Users Service Singleton
 */
export const usersService = new UsersService(mobileStorage, `${API_BASE_URL}/users`);

/**
 * Transactions Service Singleton
 */
export const transactionsService = new TransactionsService(
  mobileStorage,
  `${API_BASE_URL}/transactions`
);

/**
 * Accounts Service Singleton
 */
export const accountsService = new AccountsService(mobileStorage, `${API_BASE_URL}/accounts`);

/**
 * Budgets Service Singleton
 */
export const budgetsService = new BudgetsService(mobileStorage, `${API_BASE_URL}/budgets`);

/**
 * Goals Service Singleton
 */
export const goalsService = new GoalsService(mobileStorage, `${API_BASE_URL}/goals`);

/**
 * Investments Service Singleton
 */
export const investmentsService = new InvestmentsService(
  mobileStorage,
  `${API_BASE_URL}/investments`
);
