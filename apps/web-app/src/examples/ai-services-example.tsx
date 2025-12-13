'use client';

import { useState, useEffect } from 'react';
import {
  financialInsightsService,
  spendingPredictorService,
  trendAnalyzerService,
  FinancialInsight,
  SpendingPrediction,
  TrendAnalysis,
  InsightSeverity,
} from '@fayol/ai-services';
import { Alert } from '@fayol/ui-components';

/**
 * Exemplo de uso dos serviços de IA do @fayol/ai-services
 */
export function AIServicesExample() {
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [prediction, setPrediction] = useState<SpendingPrediction | null>(null);
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis | null>(null);

  useEffect(() => {
    // Dados de exemplo de transações
    const mockTransactions = [
      {
        id: '1',
        amount: 150,
        category: 'alimentação',
        date: new Date('2024-01-01'),
        type: 'expense' as const,
        description: 'Supermercado',
      },
      {
        id: '2',
        amount: 80,
        category: 'transporte',
        date: new Date('2024-01-02'),
        type: 'expense' as const,
        description: 'Uber',
      },
      {
        id: '3',
        amount: 500,
        category: 'entretenimento',
        date: new Date('2024-01-03'),
        type: 'expense' as const,
        description: 'Show',
      },
      {
        id: '4',
        amount: 3000,
        category: 'salário',
        date: new Date('2024-01-05'),
        type: 'income' as const,
        description: 'Salário',
      },
      {
        id: '5',
        amount: 200,
        category: 'alimentação',
        date: new Date('2024-01-10'),
        type: 'expense' as const,
        description: 'Restaurante',
      },
      {
        id: '6',
        amount: 120,
        category: 'transporte',
        date: new Date('2024-01-15'),
        type: 'expense' as const,
        description: 'Combustível',
      },
      {
        id: '7',
        amount: 1200,
        category: 'alimentação',
        date: new Date('2024-01-20'),
        type: 'expense' as const,
        description: 'Supermercado - compra grande',
      },
    ];

    // Gera insights financeiros
    const budgets = new Map([
      ['alimentação', 1000],
      ['transporte', 300],
      ['entretenimento', 400],
    ]);

    const generatedInsights = financialInsightsService.generateInsights(mockTransactions, {
      periodDays: 30,
      budgets,
    });
    setInsights(generatedInsights);

    // Dados históricos para previsão (últimos 6 meses)
    const historicalData = [
      { date: new Date('2023-08-01'), amount: 1200 },
      { date: new Date('2023-09-01'), amount: 1350 },
      { date: new Date('2023-10-01'), amount: 1500 },
      { date: new Date('2023-11-01'), amount: 1400 },
      { date: new Date('2023-12-01'), amount: 1800 },
      { date: new Date('2024-01-01'), amount: 1650 },
    ];

    // Gera previsão de gastos
    const spendingPrediction = spendingPredictorService.predictSpending(historicalData, {
      windowSize: 3,
      includeSeasonality: true,
    });
    setPrediction(spendingPrediction);

    // Análise de tendências
    const dataPoints = historicalData.map((d) => ({
      timestamp: d.date,
      value: d.amount,
    }));

    const trend = trendAnalyzerService.analyzeTrend(dataPoints);
    setTrendAnalysis(trend);
  }, []);

  const getSeverityColor = (severity: InsightSeverity) => {
    const colors = {
      info: 'info',
      warning: 'warning',
      alert: 'warning',
      critical: 'error',
    };
    return colors[severity] as 'info' | 'warning' | 'error';
  };

  const translateTrendDirection = (direction: string) => {
    const translations = {
      up: 'Crescente',
      down: 'Decrescente',
      neutral: 'Estável',
    };
    return translations[direction as keyof typeof translations] || direction;
  };

  const translateTrendType = (type: string) => {
    const translations = {
      linear: 'Linear',
      exponential: 'Exponencial',
      cyclical: 'Cíclico',
      volatile: 'Volátil',
      stable: 'Estável',
    };
    return translations[type as keyof typeof translations] || type;
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Exemplos de AI Services</h1>

      {/* Financial Insights */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Insights Financeiros</h2>
        <p className="text-gray-600">
          O serviço de insights analisa suas transações e identifica padrões, alertas e
          oportunidades.
        </p>

        <div className="space-y-3">
          {insights.length === 0 ? (
            <p className="text-gray-500">Nenhum insight gerado.</p>
          ) : (
            insights.map((insight) => (
              <Alert
                key={insight.id}
                variant={getSeverityColor(insight.severity)}
                title={insight.title}
              >
                <p>{insight.description}</p>
                {insight.recommendation && (
                  <p className="mt-2 text-sm font-medium">Recomendação: {insight.recommendation}</p>
                )}
                {insight.percentage && (
                  <p className="mt-1 text-sm">Percentual: {insight.percentage.toFixed(1)}%</p>
                )}
              </Alert>
            ))
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-4 mt-4">
          <h3 className="font-medium text-blue-900 mb-2">Tipos de Insights Detectados:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Picos de gastos (gastos acima de 2 desvios padrão)</li>
            <li>• Categorias com alto gasto (&gt;30% do total)</li>
            <li>• Alertas de orçamento (90%+ utilizado)</li>
            <li>• Oportunidades de economia</li>
            <li>• Variação de renda</li>
            <li>• Despesas recorrentes</li>
          </ul>
        </div>
      </section>

      {/* Spending Prediction */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Previsão de Gastos</h2>
        <p className="text-gray-600">
          Algoritmo de previsão usando média móvel e análise de tendências.
        </p>

        {prediction && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded p-4">
              <h3 className="font-medium mb-3">Previsão Principal</h3>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Valor Previsto:</span> R${' '}
                  {prediction.predictedAmount.toFixed(2)}
                </p>
                <p>
                  <span className="font-medium">Confiança:</span>{' '}
                  {(prediction.confidence * 100).toFixed(0)}%
                </p>
                <p>
                  <span className="font-medium">Tendência:</span>{' '}
                  {prediction.trend === 'increasing' && '📈 Crescente'}
                  {prediction.trend === 'decreasing' && '📉 Decrescente'}
                  {prediction.trend === 'stable' && '➡️ Estável'} (
                  {prediction.trendPercentage.toFixed(1)}%)
                </p>
              </div>
            </div>

            {prediction.breakdown && (
              <div className="border rounded p-4">
                <h3 className="font-medium mb-3">Breakdown da Previsão</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Base:</span> R${' '}
                    {prediction.breakdown.baseAmount.toFixed(2)}
                  </p>
                  <p>
                    <span className="font-medium">Ajuste Sazonal:</span> R${' '}
                    {prediction.breakdown.seasonalAdjustment.toFixed(2)}
                  </p>
                  <p>
                    <span className="font-medium">Ajuste de Tendência:</span> R${' '}
                    {prediction.breakdown.trendAdjustment.toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Trend Analysis */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Análise de Tendências</h2>
        <p className="text-gray-600">
          Análise avançada de séries temporais com detecção de padrões.
        </p>

        {trendAnalysis && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="border rounded p-4">
                <h3 className="font-medium mb-2">Tipo de Tendência</h3>
                <p className="text-2xl">{translateTrendType(trendAnalysis.type)}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Direção: {translateTrendDirection(trendAnalysis.direction)}
                </p>
              </div>

              <div className="border rounded p-4">
                <h3 className="font-medium mb-2">Força da Tendência</h3>
                <p className="text-2xl">{(trendAnalysis.strength * 100).toFixed(0)}%</p>
                <p className="text-sm text-gray-600 mt-1">R² do modelo de regressão</p>
              </div>

              <div className="border rounded p-4">
                <h3 className="font-medium mb-2">Volatilidade</h3>
                <p className="text-2xl">{(trendAnalysis.volatility * 100).toFixed(0)}%</p>
                <p className="text-sm text-gray-600 mt-1">Variabilidade dos dados</p>
              </div>
            </div>

            <div className="border rounded p-4">
              <h3 className="font-medium mb-3">Estatísticas</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Média</p>
                  <p className="font-medium">R$ {trendAnalysis.statistics.mean.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Mediana</p>
                  <p className="font-medium">R$ {trendAnalysis.statistics.median.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Desvio Padrão</p>
                  <p className="font-medium">R$ {trendAnalysis.statistics.stdDev.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Mínimo</p>
                  <p className="font-medium">R$ {trendAnalysis.statistics.min.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Máximo</p>
                  <p className="font-medium">R$ {trendAnalysis.statistics.max.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="border rounded p-4">
              <h3 className="font-medium mb-3">Previsões Futuras</h3>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Próximo Mês:</span> R${' '}
                  {trendAnalysis.forecast.next.toFixed(2)}
                </p>
                <p>
                  <span className="font-medium">Próximos 3 Meses (média):</span> R${' '}
                  {(trendAnalysis.forecast.next3Months.reduce((a, b) => a + b, 0) / 3).toFixed(2)}
                </p>
                <p>
                  <span className="font-medium">Próximos 6 Meses (média):</span> R${' '}
                  {(trendAnalysis.forecast.next6Months.reduce((a, b) => a + b, 0) / 6).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="bg-green-50 border border-green-200 rounded p-4">
        <h3 className="font-medium text-green-900 mb-2">Serviços de IA Disponíveis:</h3>
        <ul className="text-sm text-green-800 space-y-1">
          <li>
            • <strong>FinancialInsightsService:</strong> Detecta padrões e gera recomendações
          </li>
          <li>
            • <strong>SpendingPredictorService:</strong> Prevê gastos futuros com IA
          </li>
          <li>
            • <strong>TrendAnalyzerService:</strong> Analisa tendências e séries temporais
          </li>
          <li>
            • <strong>CategorizerService:</strong> Categoriza transações automaticamente
          </li>
        </ul>
      </div>
    </div>
  );
}
