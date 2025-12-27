'use client';

import React, { useState } from 'react';
import { InsightsCard, Insight } from './InsightsCard';
import { Loader2, Filter, RefreshCw } from 'lucide-react';

interface InsightsListProps {
  insights: Insight[];
  loading?: boolean;
  onRefresh?: () => void;
  onInsightAction?: (insight: Insight) => void;
}

export function InsightsList({
  insights,
  loading = false,
  onRefresh,
  onInsightAction,
}: InsightsListProps) {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredInsights = insights.filter((insight) => {
    if (filter !== 'all' && insight.severity !== filter) {
      return false;
    }

    if (typeFilter !== 'all' && insight.type !== typeFilter) {
      return false;
    }

    return true;
  });

  const insightTypes = [
    { value: 'all', label: 'Todos' },
    { value: 'spending_increase', label: 'Aumento de gastos' },
    { value: 'spending_decrease', label: 'Redução de gastos' },
    { value: 'category_alert', label: 'Alerta de categoria' },
    { value: 'savings_opportunity', label: 'Oportunidade de economia' },
    { value: 'unusual_activity', label: 'Atividade incomum' },
    { value: 'general', label: 'Geral' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Carregando insights...</span>
      </div>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <Filter className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum insight disponível</h3>
        <p className="text-gray-600 mb-4">
          Adicione mais transações para gerar insights personalizados
        </p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Severidade</label>
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'Todos' },
              { value: 'high', label: 'Alta' },
              { value: 'medium', label: 'Média' },
              { value: 'low', label: 'Baixa' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value as 'all' | 'high' | 'medium' | 'low')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {insightTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {onRefresh && (
          <div className="flex items-end">
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
          </div>
        )}
      </div>

      {/* Lista de insights */}
      <div className="space-y-3">
        {filteredInsights.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum insight encontrado com os filtros selecionados
          </div>
        ) : (
          filteredInsights.map((insight) => (
            <InsightsCard key={insight.id} insight={insight} onAction={onInsightAction} />
          ))
        )}
      </div>

      {/* Estatísticas */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{insights.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {insights.filter((i) => i.severity === 'high').length}
            </div>
            <div className="text-sm text-gray-600">Alta</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {insights.filter((i) => i.severity === 'medium').length}
            </div>
            <div className="text-sm text-gray-600">Média</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {insights.filter((i) => i.severity === 'low').length}
            </div>
            <div className="text-sm text-gray-600">Baixa</div>
          </div>
        </div>
      </div>
    </div>
  );
}
