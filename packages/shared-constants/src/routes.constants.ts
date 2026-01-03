/**
 * Constantes de rotas da aplicação
 */

export const ROUTES = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // Dashboard
  DASHBOARD: {
    HOME: '/dashboard',
    ACCOUNTS: '/dashboard/accounts',
    TRANSACTIONS: '/dashboard/transactions',
    BUDGETS: '/dashboard/budgets',
    GOALS: '/dashboard/goals',
    INVESTMENTS: '/dashboard/investments',
    REPORTS: '/dashboard/reports',
    SETTINGS: '/dashboard/settings',
  },

  // Public
  PUBLIC: {
    HOME: '/',
    FEATURES: '/features',
    PRICING: '/pricing',
    INTEGRATIONS: '/integrations',
    CONTACT: '/contact',
    STATUS: '/status',
  },

  // Legal
  LEGAL: {
    TERMS: '/legal/terms',
    PRIVACY: '/legal/privacy',
    LGPD: '/legal/lgpd',
  },

  // Onboarding
  ONBOARDING: '/onboarding',
} as const;

/**
 * Rotas públicas (não requerem autenticação)
 */
export const PUBLIC_ROUTES = [
  ROUTES.PUBLIC.HOME,
  ROUTES.PUBLIC.FEATURES,
  ROUTES.PUBLIC.PRICING,
  ROUTES.PUBLIC.INTEGRATIONS,
  ROUTES.PUBLIC.CONTACT,
  ROUTES.PUBLIC.STATUS,
  ROUTES.AUTH.LOGIN,
  ROUTES.AUTH.REGISTER,
  ROUTES.AUTH.FORGOT_PASSWORD,
  ROUTES.AUTH.RESET_PASSWORD,
  ROUTES.LEGAL.TERMS,
  ROUTES.LEGAL.PRIVACY,
  ROUTES.LEGAL.LGPD,
] as const;

/**
 * Rotas protegidas (requerem autenticação)
 */
export const PROTECTED_ROUTES = [
  ROUTES.DASHBOARD.HOME,
  ROUTES.DASHBOARD.ACCOUNTS,
  ROUTES.DASHBOARD.TRANSACTIONS,
  ROUTES.DASHBOARD.BUDGETS,
  ROUTES.DASHBOARD.GOALS,
  ROUTES.DASHBOARD.INVESTMENTS,
  ROUTES.DASHBOARD.REPORTS,
  ROUTES.DASHBOARD.SETTINGS,
  ROUTES.ONBOARDING,
] as const;
