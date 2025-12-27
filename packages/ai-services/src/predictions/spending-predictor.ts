/**
 * Dados históricos para previsão
 */
export interface HistoricalData {
  date: Date;
  amount: number;
  category?: string;
}

/**
 * Resultado da previsão
 */
export interface SpendingPrediction {
  category?: string;
  predictedAmount: number;
  confidence: number; // 0-1
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
  nextMonthPrediction: number;
  breakdown?: {
    baseAmount: number;
    seasonalAdjustment: number;
    trendAdjustment: number;
  };
}

/**
 * Serviço de previsão de gastos usando média móvel e análise de tendência
 */
export class SpendingPredictorService {
  /**
   * Prevê gastos futuros baseado em dados históricos
   */
  public predictSpending(historicalData: HistoricalData[], options?: {
    windowSize?: number;
    includeSeasonality?: boolean;
  }): SpendingPrediction {
    const windowSize = options?.windowSize || 3; // Média móvel de 3 meses
    const includeSeasonality = options?.includeSeasonality ?? true;

    if (historicalData.length < 2) {
      return {
        predictedAmount: historicalData[0]?.amount || 0,
        confidence: 0.3,
        trend: 'stable',
        trendPercentage: 0,
        nextMonthPrediction: historicalData[0]?.amount || 0,
      };
    }

    // Ordena por data
    const sorted = [...historicalData].sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calcula média móvel
    const movingAverage = this.calculateMovingAverage(sorted.map((d) => d.amount), windowSize);

    // Detecta tendência
    const trend = this.detectTrend(sorted.map((d) => d.amount));

    // Ajuste sazonal (se habilitado)
    let seasonalFactor = 1;
    if (includeSeasonality && sorted.length >= 12) {
      seasonalFactor = this.calculateSeasonalFactor(sorted);
    }

    // Previsão base (última média móvel)
    const baseAmount = movingAverage[movingAverage.length - 1] || sorted[sorted.length - 1].amount;

    // Ajuste de tendência (extrapola a tendência)
    const trendAdjustment = baseAmount * (trend.percentage / 100);

    // Ajuste sazonal
    const seasonalAdjustment = baseAmount * (seasonalFactor - 1);

    // Previsão final
    const predictedAmount = baseAmount + trendAdjustment + seasonalAdjustment;

    // Confiança baseada na consistência dos dados
    const confidence = this.calculateConfidence(sorted.map((d) => d.amount), trend.percentage);

    return {
      predictedAmount: Math.max(0, predictedAmount),
      confidence,
      trend: trend.direction,
      trendPercentage: trend.percentage,
      nextMonthPrediction: Math.max(0, predictedAmount),
      breakdown: {
        baseAmount,
        seasonalAdjustment,
        trendAdjustment,
      },
    };
  }

  /**
   * Prevê gastos por categoria
   */
  public predictByCategory(
    historicalData: HistoricalData[],
    options?: { windowSize?: number }
  ): Map<string, SpendingPrediction> {
    const predictions = new Map<string, SpendingPrediction>();

    // Agrupa por categoria
    const byCategory = new Map<string, HistoricalData[]>();
    historicalData.forEach((data) => {
      const category = data.category || 'Sem categoria';
      if (!byCategory.has(category)) {
        byCategory.set(category, []);
      }
      byCategory.get(category)!.push(data);
    });

    // Prevê para cada categoria
    for (const [category, data] of byCategory.entries()) {
      const prediction = this.predictSpending(data, options);
      predictions.set(category, { ...prediction, category });
    }

    return predictions;
  }

  /**
   * Prevê total de gastos mensais
   */
  public predictMonthlyTotal(historicalData: HistoricalData[]): SpendingPrediction {
    // Agrupa por mês
    const monthlyTotals = new Map<string, number>();

    historicalData.forEach((data) => {
      const monthKey = `${data.date.getFullYear()}-${String(data.date.getMonth() + 1).padStart(2, '0')}`;
      monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) || 0) + data.amount);
    });

    // Converte para array de HistoricalData
    const monthlyData: HistoricalData[] = Array.from(monthlyTotals.entries()).map(([monthKey, amount]) => {
      const [year, month] = monthKey.split('-').map(Number);
      return {
        date: new Date(year, month - 1, 1),
        amount,
      };
    });

    return this.predictSpending(monthlyData, { includeSeasonality: true });
  }

  /**
   * Calcula média móvel
   */
  private calculateMovingAverage(values: number[], windowSize: number): number[] {
    const result: number[] = [];

    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const window = values.slice(start, i + 1);
      const average = window.reduce((sum, v) => sum + v, 0) / window.length;
      result.push(average);
    }

    return result;
  }

  /**
   * Detecta tendência nos dados
   */
  private detectTrend(values: number[]): {
    direction: 'increasing' | 'decreasing' | 'stable';
    percentage: number;
  } {
    if (values.length < 2) {
      return { direction: 'stable', percentage: 0 };
    }

    // Regressão linear simples
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);

    const sumX = indices.reduce((sum, i) => sum + i, 0);
    const sumY = values.reduce((sum, v) => sum + v, 0);
    const sumXY = indices.reduce((sum, i) => sum + i * values[i], 0);
    const sumX2 = indices.reduce((sum, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const average = sumY / n;

    // Handle zero average (all values are zero)
    if (average === 0) {
      return { direction: 'stable', percentage: 0 };
    }

    // Percentual de mudança
    const percentage = (slope / average) * 100 * n; // Extrapola para o período total

    if (Math.abs(percentage) < 5 || !isFinite(percentage)) {
      return { direction: 'stable', percentage: 0 };
    }

    return {
      direction: percentage > 0 ? 'increasing' : 'decreasing',
      percentage: Math.abs(percentage),
    };
  }

  /**
   * Calcula fator sazonal baseado no mês atual
   */
  private calculateSeasonalFactor(data: HistoricalData[]): number {
    const currentMonth = new Date().getMonth();

    // Agrupa por mês do ano
    const monthlyAverages = new Map<number, number[]>();

    data.forEach((d) => {
      const month = d.date.getMonth();
      if (!monthlyAverages.has(month)) {
        monthlyAverages.set(month, []);
      }
      monthlyAverages.get(month)!.push(d.amount);
    });

    // Calcula média geral
    const overallAverage =
      data.reduce((sum, d) => sum + d.amount, 0) / data.length;

    // Calcula fator sazonal para o mês atual
    const currentMonthData = monthlyAverages.get(currentMonth);
    if (!currentMonthData || currentMonthData.length === 0) {
      return 1; // Sem ajuste
    }

    const currentMonthAverage =
      currentMonthData.reduce((sum, v) => sum + v, 0) / currentMonthData.length;

    return currentMonthAverage / overallAverage;
  }

  /**
   * Calcula confiança da previsão baseado na variabilidade dos dados
   */
  private calculateConfidence(values: number[], trendPercentage: number): number {
    if (values.length < 2) return 0.3;

    // Calcula coeficiente de variação (desvio padrão / média)
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;

    // Handle zero mean (all values are zero)
    if (mean === 0) {
      return 1.0; // Perfect confidence - no variation
    }

    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / mean;

    // Confiança base (inversamente proporcional à variabilidade)
    let confidence = Math.max(0, Math.min(1, 1 - coefficientOfVariation));

    // Penaliza tendências muito fortes (podem ser outliers)
    if (trendPercentage > 50) {
      confidence *= 0.8;
    }

    // Aumenta confiança com mais dados
    const dataBonus = Math.min(0.2, values.length * 0.02);
    confidence = Math.min(1, confidence + dataBonus);

    return Math.round(confidence * 100) / 100;
  }
}

// Exporta instância única
export const spendingPredictorService = new SpendingPredictorService();
