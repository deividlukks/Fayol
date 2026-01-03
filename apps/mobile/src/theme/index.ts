import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

// Cores do Fayol (matching web app - #3b82f6)
const fayolColors = {
  primary: '#3b82f6', // Blue 500
  primaryContainer: '#dbeafe', // Blue 100
  secondary: '#64748b', // Slate 500
  secondaryContainer: '#f1f5f9', // Slate 100
  tertiary: '#10b981', // Green 500
  tertiaryContainer: '#d1fae5', // Green 100
  error: '#ef4444', // Red 500
  errorContainer: '#fee2e2', // Red 100
  success: '#10b981', // Green 500
  warning: '#f59e0b', // Amber 500
  info: '#3b82f6', // Blue 500
};

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: fayolColors.primary,
    primaryContainer: fayolColors.primaryContainer,
    secondary: fayolColors.secondary,
    secondaryContainer: fayolColors.secondaryContainer,
    tertiary: fayolColors.tertiary,
    tertiaryContainer: fayolColors.tertiaryContainer,
    error: fayolColors.error,
    errorContainer: fayolColors.errorContainer,
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: fayolColors.primary,
    primaryContainer: '#1e3a8a', // Blue 900
    secondary: fayolColors.secondary,
    secondaryContainer: '#334155', // Slate 700
    tertiary: fayolColors.tertiary,
    tertiaryContainer: '#065f46', // Green 800
    error: fayolColors.error,
    errorContainer: '#7f1d1d', // Red 900
  },
};

// Export individual colors for use in custom components
export const colors = {
  ...fayolColors,
  background: {
    light: '#ffffff',
    dark: '#1e293b', // Slate 800
  },
  surface: {
    light: '#f8fafc', // Slate 50
    dark: '#0f172a', // Slate 900
  },
  text: {
    primary: '#0f172a', // Slate 900
    secondary: '#64748b', // Slate 500
    disabled: '#cbd5e1', // Slate 300
    inverse: '#ffffff',
  },
  border: {
    light: '#e2e8f0', // Slate 200
    dark: '#475569', // Slate 600
  },
};

// Typography (matching Material Design 3)
export const typography = {
  displayLarge: {
    fontSize: 57,
    fontWeight: '400' as const,
    letterSpacing: -0.25,
    lineHeight: 64,
  },
  displayMedium: {
    fontSize: 45,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 52,
  },
  displaySmall: {
    fontSize: 36,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 44,
  },
  headlineLarge: {
    fontSize: 32,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 40,
  },
  headlineMedium: {
    fontSize: 28,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 36,
  },
  headlineSmall: {
    fontSize: 24,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 32,
  },
  titleLarge: {
    fontSize: 22,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 28,
  },
  titleMedium: {
    fontSize: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  titleSmall: {
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.5,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400' as const,
    letterSpacing: 0.25,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0.4,
    lineHeight: 16,
  },
  labelLarge: {
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
};

// Spacing system (based on 4px grid)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export default {
  light: lightTheme,
  dark: darkTheme,
  colors,
  typography,
  spacing,
  borderRadius,
};
