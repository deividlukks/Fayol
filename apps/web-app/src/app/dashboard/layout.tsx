'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api'; // <--- Importe a API
import {
  LayoutDashboard,
  Wallet,
  PieChart,
  Settings,
  LogOut,
  Menu,
  CreditCard,
  TrendingUp,
  Loader2,
  Target,
} from 'lucide-react';
import Image from 'next/image';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState<{
    id: string; // Adicionamos o ID para poder buscar
    name: string;
    email: string;
    onboardingStep?: number;
  } | null>(null);

  useEffect(() => {
    const validateAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const storedUserStr = localStorage.getItem('user');

        if (!token || !storedUserStr) {
          router.push('/auth/login');
          return;
        }

        let userObj = JSON.parse(storedUserStr);

        // --- CORREÇÃO DE ESTADO (WEB vs BOT) ---
        // Sempre tentamos buscar os dados mais recentes do usuário no servidor
        // para garantir que se ele completou o onboarding no bot, o front saiba.
        try {
          const response = await api.get(`/users/${userObj.id}`);
          const freshUser = response.data.data;

          // Atualizamos o objeto local e o localStorage
          userObj = { ...userObj, ...freshUser };
          localStorage.setItem('user', JSON.stringify(userObj));
        } catch (err) {
          console.warn(
            'Não foi possível atualizar dados do usuário em tempo real (offline ou erro de API). Usando cache.',
            err
          );
        }

        // --- VERIFICAÇÃO DE ONBOARDING ---
        if (userObj.onboardingStep !== undefined && userObj.onboardingStep < 5) {
          router.push('/onboarding');
          return;
        }

        setUser(userObj);
        setIsCheckingAuth(false);
      } catch (error) {
        console.error('Erro fatal de autenticação:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/auth/login');
      }
    };

    validateAuth();
  }, [router]);

  const handleLogout = () => {
    setIsLoggingOut(true);

    setTimeout(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/auth/login');
    }, 800);
  };

  const navItems = [
    { name: 'Visão Geral', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Transações', href: '/dashboard/transactions', icon: Wallet },
    { name: 'Orçamentos', href: '/dashboard/budgets', icon: PieChart },
    { name: 'Investimentos', href: '/dashboard/investments', icon: TrendingUp },
    { name: 'Metas', href: '/dashboard/goals', icon: Target },
    { name: 'Contas', href: '/dashboard/accounts', icon: CreditCard },
    { name: 'Configurações', href: '/dashboard/settings', icon: Settings },
  ];

  if (isCheckingAuth || !user || isLoggingOut) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F0F4F8]">
        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
          <div className="relative h-48 w-48">
            <Image src="/logo.png" alt="Fayol" fill className="object-contain" priority />
          </div>
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-sm font-medium">
              {isLoggingOut ? 'Saindo com segurança...' : 'Sincronizando dados...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="h-full flex flex-col">
          {/* Logo Sidebar */}
          <div className="h-24 flex items-center justify-center border-b border-slate-100 px-6">
            <div className="relative h-48 w-48">
              <Image src="/logo.png" alt="Fayol" fill className="object-contain" priority />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors
                    ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="border-t border-slate-100 p-4">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg border-2 border-white shadow-sm">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Sair do Sistema
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white shadow-sm h-16 flex items-center justify-between px-4">
          <div className="relative h-8 w-32">
            <Image src="/logo.png" alt="Fayol" fill className="object-contain" priority />
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-md text-slate-600 hover:bg-slate-100"
          >
            <Menu className="h-6 w-6" />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
