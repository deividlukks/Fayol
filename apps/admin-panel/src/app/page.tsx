'use client';

import Link from 'next/link';
import {
  Activity,
  Users,
  FileText,
  Settings,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

export default function AdminDashboard() {
  // Mock data - será substituído por chamadas reais à API
  const stats = {
    totalUsers: 0,
    activeUsers: 0,
    totalLogs: 0,
    systemStatus: 'OK',
  };

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Bem-vindo ao Admin Panel 👋</h2>
        <p className="text-blue-100">
          Gerencie usuários, monitore atividades e configure o sistema Fayol.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Stat Card - Total Users */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total de Usuários</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stats.totalUsers}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <Link href="/users" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Ver todos →
            </Link>
          </div>
        </div>

        {/* Stat Card - Active Users */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Usuários Ativos</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stats.activeUsers}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <Link href="/users" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Ver detalhes →
            </Link>
          </div>
        </div>

        {/* Stat Card - Audit Logs */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Audit Logs</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stats.totalLogs}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <Link
              href="/audit-logs"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Ver logs →
            </Link>
          </div>
        </div>

        {/* Stat Card - System Status */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Status do Sistema</dt>
                  <dd className="text-2xl font-bold text-green-600">{stats.systemStatus}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <Link
              href="/monitoring"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Ver monitoramento →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/users"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <Users className="h-6 w-6 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">Gerenciar Usuários</p>
              <p className="text-sm text-gray-500">Ver e editar usuários do sistema</p>
            </div>
          </Link>

          <Link
            href="/audit-logs"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <FileText className="h-6 w-6 text-purple-600" />
            <div>
              <p className="font-medium text-gray-900">Audit Logs</p>
              <p className="text-sm text-gray-500">Visualizar logs de auditoria</p>
            </div>
          </Link>

          <Link
            href="/settings"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-gray-500 hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-6 w-6 text-gray-600" />
            <div>
              <p className="font-medium text-gray-900">Configurações</p>
              <p className="text-sm text-gray-500">Configurar sistema</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Painel em Desenvolvimento</h3>
            <p className="text-blue-800 text-sm mb-3">
              Este admin panel está rodando de forma independente do web-app principal. Atualmente
              exibindo dados mockados - a integração com a API será implementada em breve.
            </p>
            <ul className="list-disc list-inside text-blue-800 text-sm space-y-1">
              <li>Autenticação compartilhada via cookies httpOnly</li>
              <li>Layout com sidebar e navegação</li>
              <li>Proteção de rotas para admin/super-admin</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
