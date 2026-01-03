'use client';

import { Insight } from '../../../components/insights/InsightsCard';
import { InsightsList } from '../../../components/insights/InsightsList';
import { useInsights } from '../../../hooks/useInsights';
import { Lightbulb } from 'lucide-react';

export default function InsightsPage() {
  const { insights, isLoading, refetch, generateInsights, isGenerating } = useInsights();

  const handleInsightAction = (insight: Insight) => {
    // Navegar para a página relevante baseado no tipo de insight
    console.log('Ação no insight:', insight);
    // TODO: Implementar navegação
  };

  const handleGenerateInsights = () => {
    generateInsights({});
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Lightbulb className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Insights Financeiros</h1>
        </div>
        <p className="text-gray-600">Análises personalizadas baseadas em seus dados financeiros</p>
      </div>

      {/* Ação rápida */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Gerar novos insights</h3>
            <p className="text-sm text-gray-600">
              Analise suas transações recentes e descubra padrões
            </p>
          </div>
          <button
            onClick={handleGenerateInsights}
            disabled={isGenerating}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Gerando...' : 'Gerar Insights'}
          </button>
        </div>
      </div>

      {/* Lista de insights */}
      <InsightsList
        insights={insights}
        loading={isLoading}
        onRefresh={refetch}
        onInsightAction={handleInsightAction}
      />
    </div>
  );
}
