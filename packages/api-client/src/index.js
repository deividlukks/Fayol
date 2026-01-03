'use strict';
/**
 * @fayol/api-client
 *
 * API Client para Web (Next.js)
 * Usa localStorage para armazenamento de tokens
 */
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __exportStar =
  (this && this.__exportStar) ||
  function (m, exports) {
    for (var p in m)
      if (p !== 'default' && !Object.prototype.hasOwnProperty.call(exports, p))
        __createBinding(exports, m, p);
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.investmentsService =
  exports.goalsService =
  exports.budgetsService =
  exports.accountsService =
  exports.transactionsService =
  exports.usersService =
  exports.authService =
    void 0;
// Re-export core functionality
__exportStar(require('@fayol/api-client-core'), exports);
// Export web storage adapter
__exportStar(require('./adapters/web-storage.adapter'), exports);
// Import necessário para criar singletons
const api_client_core_1 = require('@fayol/api-client-core');
const web_storage_adapter_1 = require('./adapters/web-storage.adapter');
// ==================== SINGLETON INSTANCES ====================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';
/**
 * Auth Service Singleton
 */
exports.authService = new api_client_core_1.AuthService(
  web_storage_adapter_1.webStorage,
  `${API_BASE_URL}/auth`
);
/**
 * Users Service Singleton
 */
exports.usersService = new api_client_core_1.UsersService(
  web_storage_adapter_1.webStorage,
  `${API_BASE_URL}/users`
);
/**
 * Transactions Service Singleton
 */
exports.transactionsService = new api_client_core_1.TransactionsService(
  web_storage_adapter_1.webStorage,
  `${API_BASE_URL}/transactions`
);
/**
 * Accounts Service Singleton
 */
exports.accountsService = new api_client_core_1.AccountsService(
  web_storage_adapter_1.webStorage,
  `${API_BASE_URL}/accounts`
);
/**
 * Budgets Service Singleton
 */
exports.budgetsService = new api_client_core_1.BudgetsService(
  web_storage_adapter_1.webStorage,
  `${API_BASE_URL}/budgets`
);
/**
 * Goals Service Singleton
 */
exports.goalsService = new api_client_core_1.GoalsService(
  web_storage_adapter_1.webStorage,
  `${API_BASE_URL}/goals`
);
/**
 * Investments Service Singleton
 */
exports.investmentsService = new api_client_core_1.InvestmentsService(
  web_storage_adapter_1.webStorage,
  `${API_BASE_URL}/investments`
);
//# sourceMappingURL=index.js.map
