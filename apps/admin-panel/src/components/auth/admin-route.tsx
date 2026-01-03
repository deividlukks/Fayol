'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@fayol/web-shared';
import { UserRole } from '@fayol/shared-types';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Componente de proteção para rotas administrativas.
 * Garante que apenas usuários com roles ADMIN ou SUPER_ADMIN possam acessar.
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Verifica se o usuário tem role de administrador
  const isAdmin = user?.roles?.some(
    (role) => role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN
  );

  useEffect(() => {
    if (!isLoading) {
      // Se não está autenticado, redireciona para login do web-app
      if (!isAuthenticated) {
        // Como o admin-panel está em porta diferente, redireciona para o web-app
        window.location.href = 'http://localhost:3000/auth/login';
        return;
      }

      // Se está autenticado mas não é admin, redireciona para dashboard do web-app
      if (!isAdmin) {
        window.location.href = 'http://localhost:3000/dashboard';
      }
    }
  }, [isAuthenticated, isAdmin, isLoading]);

  // Mostra loading enquanto verifica
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado ou não é admin, não renderiza nada (vai redirecionar)
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-4">Você não tem permissão para acessar esta área.</p>
          <p className="text-sm text-gray-500">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
