/**
 * Constantes para chaves de armazenamento (localStorage/sessionStorage)
 */

export const STORAGE_KEYS = {
  // Autenticação
  AUTH: {
    TOKEN: '@fayol:auth:token',
    REFRESH_TOKEN: '@fayol:auth:refresh_token',
    USER: '@fayol:auth:user',
    REMEMBER_ME: '@fayol:auth:remember_me',
  },

  // Preferências do usuário
  PREFERENCES: {
    THEME: '@fayol:preferences:theme',
    LANGUAGE: '@fayol:preferences:language',
    CURRENCY: '@fayol:preferences:currency',
    SIDEBAR_COLLAPSED: '@fayol:preferences:sidebar_collapsed',
    DASHBOARD_LAYOUT: '@fayol:preferences:dashboard_layout',
  },

  // Configurações de filtros
  FILTERS: {
    TRANSACTIONS: '@fayol:filters:transactions',
    ACCOUNTS: '@fayol:filters:accounts',
    BUDGETS: '@fayol:filters:budgets',
    DATE_RANGE: '@fayol:filters:date_range',
  },

  // Onboarding
  ONBOARDING: {
    COMPLETED: '@fayol:onboarding:completed',
    STEP: '@fayol:onboarding:step',
    SKIPPED: '@fayol:onboarding:skipped',
  },

  // Cache
  CACHE: {
    DASHBOARD_SUMMARY: '@fayol:cache:dashboard_summary',
    CATEGORIES: '@fayol:cache:categories',
    LAST_SYNC: '@fayol:cache:last_sync',
  },

  // Temporários
  TEMP: {
    FORM_DRAFT: '@fayol:temp:form_draft',
    REDIRECT_URL: '@fayol:temp:redirect_url',
  },
} as const;

/**
 * Tempo de expiração de cache (em milissegundos)
 */
export const CACHE_EXPIRATION = {
  SHORT: 5 * 60 * 1000, // 5 minutos
  MEDIUM: 30 * 60 * 1000, // 30 minutos
  LONG: 24 * 60 * 60 * 1000, // 24 horas
} as const;
