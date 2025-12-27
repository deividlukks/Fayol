/**
 * AuthContext - Authentication state management for mobile app
 *
 * Manages user authentication state, login/logout/register actions,
 * and persists tokens securely using expo-secure-store
 */

import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authService } from '@fayol/api-client-mobile';
import type { User } from '@fayol/shared-types';
import type { LoginInput, RegisterInput } from '@fayol/validation-schemas';

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Initialize authentication on app startup
   * Checks if token exists and validates it with backend
   */
  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true);

      // Check if token exists
      const isAuth = await authService.isAuthenticated();

      if (!isAuth) {
        setUser(null);
        return;
      }

      // Validate token and fetch user data
      const response = await authService.me();

      if (response.success && response.data?.user) {
        setUser(response.data.user);
      } else {
        // Token invalid or expired - clear it
        await authService.clearToken();
        setUser(null);
      }
    } catch (error) {
      console.error('[AuthContext] Failed to initialize auth:', error);
      // Clear invalid token
      await authService.clearToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Login with email and password
   */
  const login = useCallback(async (data: LoginInput) => {
    try {
      setIsLoading(true);

      const response = await authService.login(data);

      if (!response.success) {
        throw new Error(response.message || 'Login failed');
      }

      if (!response.data) {
        throw new Error('No data received from login');
      }

      // authService.login already stores the token
      setUser(response.data.user);
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Register new user
   */
  const register = useCallback(async (data: RegisterInput) => {
    try {
      setIsLoading(true);

      const response = await authService.register(data);

      if (!response.success) {
        throw new Error(response.message || 'Registration failed');
      }

      // After successful registration, user needs to login
      // (Backend doesn't auto-login after registration)
    } catch (error) {
      console.error('[AuthContext] Register error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout user and clear stored credentials
   */
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);

      // Call logout endpoint and clear local storage
      await authService.logout();

      setUser(null);
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
      // Even if API call fails, clear local state
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh user data from backend
   */
  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.me();

      if (response.success && response.data?.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('[AuthContext] Failed to refresh user:', error);
    }
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const value: AuthContextData = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
