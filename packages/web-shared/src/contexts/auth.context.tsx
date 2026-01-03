'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService, apiClient } from '@fayol/api-client';
import { User } from '@fayol/shared-types';

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Verifica se há um usuário autenticado via cookie ao carregar
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Chama o endpoint /auth/me que verifica o cookie httpOnly
        const response = await apiClient.get<{ user: User }>('/auth/me');

        if (response.data && response.data.user) {
          setUser(response.data.user);
        }
      } catch {
        // Se erro 401, usuário não está autenticado (cookie inválido/expirado)
        console.log('Usuário não autenticado');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });

      if (!response.data) {
        throw new Error('Erro ao fazer login');
      }

      const { user: userData } = response.data;

      // Cookie httpOnly é configurado automaticamente pelo backend
      setUser(userData);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Chama endpoint de logout para limpar cookie httpOnly
      await apiClient.post<void>('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      router.push('/auth/login');
    }
  }, [router]);

  const updateUser = useCallback((userData: Partial<User>) => {
    setUser((prevUser: User | null) => {
      if (!prevUser) return null;
      const updatedUser = { ...prevUser, ...userData };
      // Não precisa mais salvar no localStorage - dados vêm do cookie httpOnly
      return updatedUser;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
