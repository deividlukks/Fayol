'use client';

import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Lightbulb, DollarSign } from 'lucide-react';

export interface Insight {
  id: string;
  type:
    | 'spending_increase'
    | 'spending_decrease'
    | 'category_alert'
    | 'savings_opportunity'
    | 'unusual_activity'
    | 'general';
  title: string;
  message: string;
  category?: string;
  amount?: number;
  percentage?: number;
  severity: 'low' | 'medium' | 'high';
  actionable: boolean;
  createdAt: Date;
}

interface InsightsCardProps {
  insight: Insight;
  onAction?: (insight: Insight) => void;
}

export function InsightsCard({ insight, onAction }: InsightsCardProps) {
  const getIcon = () => {
    switch (insight.type) {
      case 'spending_increase':
        return <TrendingUp className="w-5 h-5" />;
      case 'spending_decrease':
        return <TrendingDown className="w-5 h-5" />;
      case 'category_alert':
        return <AlertTriangle className="w-5 h-5" />;
      case 'savings_opportunity':
        return <DollarSign className="w-5 h-5" />;
      case 'unusual_activity':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getColorClasses = () => {
    const baseClasses = 'rounded-lg p-4 border-l-4';

    switch (insight.severity) {
      case 'high':
        return `${baseClasses} bg-red-50 border-red-500 text-red-900`;
      case 'medium':
        return `${baseClasses} bg-yellow-50 border-yellow-500 text-yellow-900`;
      case 'low':
        return `${baseClasses} bg-blue-50 border-blue-500 text-blue-900`;
      default:
        return `${baseClasses} bg-gray-50 border-gray-500 text-gray-900`;
    }
  };

  const getIconColor = () => {
    switch (insight.severity) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  return (
    <div className={getColorClasses()}>
      <div className="flex items-start gap-3">
        <div className={`${getIconColor()} mt-0.5`}>{getIcon()}</div>

        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">{insight.title}</h3>
          <p className="text-sm opacity-90">{insight.message}</p>

          {insight.category && (
            <div className="mt-2">
              <span className="inline-block px-2 py-1 bg-white bg-opacity-50 rounded text-xs font-medium">
                {insight.category}
              </span>
            </div>
          )}

          {insight.amount !== undefined && (
            <div className="mt-2 text-sm font-semibold">{formatCurrency(insight.amount)}</div>
          )}

          {insight.percentage !== undefined && (
            <div className="mt-2 text-sm font-semibold">
              {insight.percentage > 0 ? '+' : ''}
              {insight.percentage.toFixed(1)}%
            </div>
          )}

          {insight.actionable && onAction && (
            <button
              onClick={() => onAction(insight)}
              className="mt-3 text-sm font-medium underline hover:no-underline transition-all"
            >
              Ver detalhes
            </button>
          )}
        </div>
      </div>

      <div className="mt-2 text-xs opacity-70">
        {new Date(insight.createdAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
    </div>
  );
}
