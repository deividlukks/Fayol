/**
 * Constantes de cores do sistema
 */

export const COLORS = {
  // Cores principais
  PRIMARY: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Principal
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Cores de sucesso
  SUCCESS: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Principal
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  // Cores de erro
  ERROR: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Principal
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Cores de aviso
  WARNING: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Principal
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Cores de informação
  INFO: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Principal
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },

  // Cores neutras
  NEUTRAL: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
} as const;

/**
 * Cores para categorias financeiras
 */
export const CATEGORY_COLORS = [
  '#ef4444', // Vermelho
  '#f59e0b', // Laranja
  '#eab308', // Amarelo
  '#22c55e', // Verde
  '#10b981', // Esmeralda
  '#14b8a6', // Teal
  '#06b6d4', // Ciano
  '#0ea5e9', // Azul claro
  '#3b82f6', // Azul
  '#6366f1', // Índigo
  '#8b5cf6', // Violeta
  '#a855f7', // Roxo
  '#d946ef', // Fúcsia
  '#ec4899', // Rosa
  '#f43f5e', // Rose
] as const;

/**
 * Cores para tipos de conta
 */
export const ACCOUNT_TYPE_COLORS = {
  CHECKING: COLORS.PRIMARY[600],
  SAVINGS: COLORS.SUCCESS[600],
  INVESTMENT: COLORS.WARNING[600],
  CASH: COLORS.NEUTRAL[600],
  CREDIT_CARD: COLORS.ERROR[600],
  OTHER: COLORS.INFO[600],
} as const;

/**
 * Cores para status de orçamento
 */
export const BUDGET_STATUS_COLORS = {
  HEALTHY: COLORS.SUCCESS[500], // < 80%
  WARNING: COLORS.WARNING[500], // 80% - 100%
  CRITICAL: COLORS.ERROR[500], // > 100%
} as const;
