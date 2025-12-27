'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  Activity,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { useAdminUsersStats } from '@/hooks/useAdminUsers';
import { auditService, healthService, AuditLog } from '@fayol/api-client';

interface SystemStatus {
  name: string;
  status: 'healthy' | 'unhealthy';
  details?: string;
}

export default function AdminDashboard() {
  const { stats: userStats, isLoading: statsLoading, error: statsError } = useAdminUsersStats();

  // Novos estados para dados reais
  const [activities, setActivities] = useState<AuditLog[]>([]);
  const [health, setHealth] = useState<SystemStatus[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingExtras(true);

        // 1. Buscar últimas 5 atividades (Logs de Auditoria)
        const logsResponse = await auditService.list({
          pageSize: 5,
          page: 1,
        });
        setActivities(logsResponse.data);

        // 2. Buscar Health Check real
        const healthResponse = await healthService.check();

        // Mapear resposta do Terminus para formato visual
        const details = healthResponse.details || {};
        const newHealth: SystemStatus[] = [
          { name: 'API (Backend)', status: 'healthy' }, // Se respondeu, está ok
          {
            name: 'Database',
            status: details.database?.status === 'up' ? 'healthy' : 'unhealthy',
          },
          {
            name: 'Redis',
            status: details.redis?.status === 'up' ? 'healthy' : 'unhealthy',
          }, // Assumindo que o backend reporta redis
          {
            name: 'Python AI',
            status: details['python-ai']?.status === 'up' ? 'healthy' : 'unhealthy',
          },
        ];
        setHealth(newHealth);
      } catch (error) {
        console.error('Falha ao carregar dados do dashboard', error);
      } finally {
        setLoadingExtras(false);
      }
    };

    fetchData();

    // Polling de saúde a cada 30s
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = userStats
    ? [
        {
          name: 'Total de Usuários',
          value: userStats.totalUsers.toLocaleString('pt-BR'),
          change: `+${userStats.growthRate}%`,
          changeType: 'positive' as const,
          icon: Users,
        },
        {
          name: 'Usuários Ativos',
          value: userStats.activeUsers.toLocaleString('pt-BR'),
          change: `${userStats.activeUsers > 0 ? ((userStats.activeUsers / userStats.totalUsers) * 100).toFixed(1) : 0}%`,
          changeType: 'positive' as const,
          icon: Activity,
        },
        {
          name: 'Novos Usuários (30d)',
          value: userStats.usersLast30Days.toLocaleString('pt-BR'),
          change: `${userStats.growthRate}%`,
          changeType: 'positive' as const,
          icon: DollarSign,
        },
        {
          name: 'Crescimento',
          value: `${userStats.growthRate}%`,
          change: 'Últimos 30 dias',
          changeType: 'positive' as const,
          icon: TrendingUp,
        },
      ]
    : [];

  if (statsError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-900">Erro ao carregar dados</h3>
            <p className="text-sm text-red-800 mt-1">{statsError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              </div>
            ))
          : stats.map((stat) => (
              <div key={stat.name} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className={`text-sm mt-1 text-green-600`}>{stat.change}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <stat.icon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Two columns layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities (REAL DATA) */}
        <div className="bg-white rounded-lg shadow h-full">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Atividades Recentes</h3>
            <Clock className="w-4 h-4 text-gray-400" />
          </div>
          <div className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
            {loadingExtras ? (
              <div className="p-6 text-center text-gray-500">Carregando atividades...</div>
            ) : activities.length === 0 ? (
              <div className="p-6 text-center text-gray-500">Nenhuma atividade recente.</div>
            ) : (
              activities.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {log.user?.name || log.userId || 'Sistema'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {log.action} em <span className="font-medium">{log.entity}</span>
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {new Date(log.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Health (REAL DATA) */}
        <div className="bg-white rounded-lg shadow h-full">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Saúde do Sistema (Live)</h3>
          </div>
          <div className="p-6 space-y-4">
            {loadingExtras ? (
              <div className="text-center text-gray-500">Verificando status...</div>
            ) : (
              health.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {service.status === 'healthy' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="font-medium text-gray-900">{service.name}</span>
                  </div>
                  <div
                    className={`text-sm font-medium ${service.status === 'healthy' ? 'text-green-700' : 'text-red-700'}`}
                  >
                    {service.status === 'healthy' ? 'Online' : 'Offline'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
