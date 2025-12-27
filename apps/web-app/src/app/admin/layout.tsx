'use client';

import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, FileText, Settings, Activity, Shield, LogOut } from 'lucide-react';
import { AdminRoute } from '@/components/auth/admin-route';
import { useAuth } from '@/contexts/auth.context';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Usuários', href: '/admin/users', icon: Users },
    { name: 'Audit Logs', href: '/admin/audit-logs', icon: FileText },
    { name: 'Monitoramento', href: '/admin/monitoring', icon: Activity },
    { name: 'Configurações', href: '/admin/settings', icon: Settings },
  ];

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-100">
        {/* Sidebar */}
        <div className="fixed inset-y-0 left-0 w-64 bg-gray-900">
          {/* Logo/Header */}
          <div className="flex items-center gap-3 h-16 px-6 border-b border-gray-800">
            <Shield className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-white font-bold text-lg">Fayol Admin</h1>
              <p className="text-gray-400 text-xs">Painel de Administração</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-6 px-3">
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </nav>

          {/* Bottom actions */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-3 py-2 text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="pl-64">
          {/* Top bar */}
          <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
            <h2 className="text-xl font-semibold text-gray-900">Painel Administrativo</h2>

            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{user?.name || 'Admin'}</span>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                  {user?.roles?.[0] || 'ADMIN'}
                </span>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="p-6">{children}</main>
        </div>
      </div>
    </AdminRoute>
  );
}
