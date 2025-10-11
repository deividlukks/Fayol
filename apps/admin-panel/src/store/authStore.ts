'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  fayolId: string;
}

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (fayolId: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (fayolId: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          // Etapa 1: Verificar Fayol ID
          const checkResponse = await axios.post(
            `${API_URL}/admin/auth/check-id`,
            { fayolId },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          if (!checkResponse.data.exists) {
            throw new Error('Fayol ID não encontrado');
          }

          // Etapa 2: Verificar senha
          const loginResponse = await axios.post(
            `${API_URL}/admin/auth/verify-password`,
            { fayolId, password },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          const { accessToken, user } = loginResponse.data;

          set({
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              fayolId: user.fayolId,
            },
            token: accessToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            'Erro ao fazer login. Tente novamente.';

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });

          throw new Error(errorMessage);
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
