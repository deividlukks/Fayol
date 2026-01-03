'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@fayol/web-shared';
import { UserRole } from '@fayol/shared-types';
import { Loader2, AlertCircle } from 'lucide-react';

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

  console.log('AdminRoute Debug:', { user, isAuthenticated, isLoading, isAdmin });

  useEffect(() => {
    if (!isLoading) {
      // Se não está autenticado, redireciona para login
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }

      // Se está autenticado mas não é admin, redireciona para dashboard
      if (!isAdmin) {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, router]);

  // Mostra loading enquanto verifica
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado ou não é admin, não renderiza nada
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-4">Você não tem permissão para acessar esta área.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
