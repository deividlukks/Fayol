/**
 * @fayol/api-client-mobile
 *
 * API Client adaptado para React Native
 * Utiliza expo-secure-store para armazenamento seguro de tokens
 * e AsyncStorage para cache
 */

// Export storage adapter
export { MobileStorageAdapter, mobileStorage } from './storage.adapter';

// Export HTTP client
export { HttpClientMobile, HttpClientMobileConfig } from './http-client.mobile';

// Export all services
export {
  // Services
  AuthServiceMobile,
  TransactionsServiceMobile,
  AccountsServiceMobile,
  BudgetsServiceMobile,
  CategoriesServiceMobile,
  GoalsServiceMobile,
  ReportsServiceMobile,
  InvestmentsServiceMobile,
  TradingServiceMobile,
  UsersServiceMobile,
  // Singleton instances (ready to use)
  authService,
  transactionsService,
  accountsService,
  budgetsService,
  categoriesService,
  goalsService,
  reportsService,
  investmentsService,
  tradingService,
  usersService,
} from './services';

// Re-export error types from api-client
export * from '@fayol/api-client/src/errors';

// Re-export types from shared-types
export type { User, ApiResponse } from '@fayol/shared-types';
