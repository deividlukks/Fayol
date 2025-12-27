/**
 * Tipos de tendências detectadas
 */
export enum TrendType {
  LINEAR = 'linear',
  EXPONENTIAL = 'exponential',
  CYCLICAL = 'cyclical',
  VOLATILE = 'volatile',
  STABLE = 'stable',
}

/**
 * Resultado da análise de tendência
 */
export interface TrendAnalysis {
  type: TrendType;
  direction: 'up' | 'down' | 'neutral';
  strength: number; // 0-1, quanto mais próximo de 1, mais forte a tendência
  volatility: number; // 0-1, variabilidade dos dados
  cyclicalPattern?: {
    period: number; // em dias/meses
    amplitude: number;
  };
  forecast: {
    next: number;
    next3Months: number[];
    next6Months: number[];
  };
  statistics: {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
    range: number;
  };
}

/**
 * Ponto de dados para análise
 */
export interface DataPoint {
  timestamp: Date;
  value: number;
}

/**
 * Serviço de análise de tendências
 */
export class TrendAnalyzerService {
  /**
   * Analisa tendências em uma série temporal
   */
  public analyzeTrend(data: DataPoint[]): TrendAnalysis {
    if (data.length < 2) {
      throw new Error('Dados insuficientes para análise de tendência. Mínimo: 2 pontos.');
    }

    // Ordena por timestamp
    const sorted = [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const values = sorted.map((d) => d.value);

    // Calcula estatísticas básicas
    const statistics = this.calculateStatistics(values);

    // Detecta tipo e direção da tendência
    const { type, direction, strength } = this.detectTrendType(sorted);

    // Calcula volatilidade
    const volatility = this.calculateVolatility(values, statistics.mean);

    // Detecta padrão cíclico
    const cyclicalPattern = this.detectCyclicalPattern(sorted);

    // Gera previsões
    const forecast = this.generateForecast(sorted, type, statistics);

    return {
      type,
      direction,
      strength,
      volatility,
      cyclicalPattern,
      forecast,
      statistics,
    };
  }

  /**
   * Compara tendências entre dois períodos
   */
  public comparePeriods(
    period1: DataPoint[],
    period2: DataPoint[]
  ): {
    period1Analysis: TrendAnalysis;
    period2Analysis: TrendAnalysis;
    comparison: {
      averageChange: number;
      averageChangePercentage: number;
      volatilityChange: number;
      trendShift: string; // Descrição da mudança
    };
  } {
    const period1Analysis = this.analyzeTrend(period1);
    const period2Analysis = this.analyzeTrend(period2);

    const averageChange = period2Analysis.statistics.mean - period1Analysis.statistics.mean;
    const averageChangePercentage =
      (averageChange / period1Analysis.statistics.mean) * 100;
    const volatilityChange = period2Analysis.volatility - period1Analysis.volatility;

    let trendShift = '';
    if (period1Analysis.direction !== period2Analysis.direction) {
      trendShift = `Mudança de tendência: ${this.translateDirection(period1Analysis.direction)} → ${this.translateDirection(period2Analysis.direction)}`;
    } else if (Math.abs(period2Analysis.strength - period1Analysis.strength) > 0.2) {
      trendShift =
        period2Analysis.strength > period1Analysis.strength
          ? 'Tendência se fortaleceu'
          : 'Tendência se enfraqueceu';
    } else {
      trendShift = 'Tendência mantida';
    }

    return {
      period1Analysis,
      period2Analysis,
      comparison: {
        averageChange,
        averageChangePercentage,
        volatilityChange,
        trendShift,
      },
    };
  }

  /**
   * Identifica anomalias nos dados
   */
  public detectAnomalies(
    data: DataPoint[],
    options?: { sensitivity?: number }
  ): Array<{ point: DataPoint; severity: 'low' | 'medium' | 'high' }> {
    const sensitivity = options?.sensitivity || 2; // Desvios padrão
    const values = data.map((d) => d.value);
    const stats = this.calculateStatistics(values);

    const anomalies: Array<{ point: DataPoint; severity: 'low' | 'medium' | 'high' }> = [];

    data.forEach((point) => {
      const deviations = Math.abs(point.value - stats.mean) / stats.stdDev;

      if (deviations > sensitivity) {
        let severity: 'low' | 'medium' | 'high' = 'low';
        if (deviations > sensitivity * 2) {
          severity = 'high';
        } else if (deviations > sensitivity * 1.5) {
          severity = 'medium';
        }

        anomalies.push({ point, severity });
      }
    });

    return anomalies;
  }

  /**
   * Calcula estatísticas descritivas
   */
  private calculateStatistics(values: number[]): TrendAnalysis['statistics'] {
    const sorted = [...values].sort((a, b) => a - b);
    const n = values.length;

    const mean = values.reduce((sum, v) => sum + v, 0) / n;
    const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];

    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    const min = sorted[0];
    const max = sorted[n - 1];
    const range = max - min;

    return { mean, median, stdDev, min, max, range };
  }

  /**
   * Detecta tipo e força da tendência
   */
  private detectTrendType(data: DataPoint[]): {
    type: TrendType;
    direction: 'up' | 'down' | 'neutral';
    strength: number;
  } {
    const values = data.map((d) => d.value);
    const n = values.length;

    // Regressão linear
    const indices = Array.from({ length: n }, (_, i) => i);
    const linearRegression = this.linearRegression(indices, values);

    // Verifica se é exponencial
    const logValues = values.map((v) => (v > 0 ? Math.log(v) : 0));
    const exponentialRegression = this.linearRegression(indices, logValues);

    // Determina qual modelo se ajusta melhor
    const isExponential = exponentialRegression.r2 > linearRegression.r2 && exponentialRegression.r2 > 0.9;

    // Calcula volatilidade relativa
    const stats = this.calculateStatistics(values);
    const coefficientOfVariation = stats.stdDev / stats.mean;

    let type: TrendType;
    if (coefficientOfVariation > 0.5) {
      type = TrendType.VOLATILE;
    } else if (isExponential) {
      type = TrendType.EXPONENTIAL;
    } else if (Math.abs(linearRegression.slope) < stats.mean * 0.01) {
      type = TrendType.STABLE;
    } else {
      type = TrendType.LINEAR;
    }

    // Direção
    let direction: 'up' | 'down' | 'neutral';
    if (linearRegression.slope > stats.mean * 0.05) {
      direction = 'up';
    } else if (linearRegression.slope < -stats.mean * 0.05) {
      direction = 'down';
    } else {
      direction = 'neutral';
    }

    // Força (baseada em R²)
    const strength = Math.max(linearRegression.r2, exponentialRegression.r2);

    return { type, direction, strength };
  }

  /**
   * Regressão linear simples
   */
  private linearRegression(
    x: number[],
    y: number[]
  ): {
    slope: number;
    intercept: number;
    r2: number;
  } {
    const n = x.length;
    const sumX = x.reduce((sum, v) => sum + v, 0);
    const sumY = y.reduce((sum, v) => sum + v, 0);
    const sumXY = x.reduce((sum, v, i) => sum + v * y[i], 0);
    const sumX2 = x.reduce((sum, v) => sum + v * v, 0);
    const sumY2 = y.reduce((sum, v) => sum + v * v, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calcula R²
    const meanY = sumY / n;
    const ssTotal = y.reduce((sum, v) => sum + Math.pow(v - meanY, 2), 0);
    const ssResidual = y.reduce((sum, v, i) => sum + Math.pow(v - (slope * x[i] + intercept), 2), 0);
    const r2 = 1 - ssResidual / ssTotal;

    return { slope, intercept, r2 };
  }

  /**
   * Calcula volatilidade (desvio padrão normalizado)
   */
  private calculateVolatility(values: number[], mean: number): number {
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    return Math.min(1, stdDev / mean); // Normaliza para 0-1
  }

  /**
   * Detecta padrão cíclico usando autocorrelação
   */
  private detectCyclicalPattern(
    data: DataPoint[]
  ): { period: number; amplitude: number } | undefined {
    const values = data.map((d) => d.value);
    const n = values.length;

    if (n < 12) return undefined; // Precisa de pelo menos 12 pontos

    // Calcula autocorrelação para diferentes lags
    const maxLag = Math.min(Math.floor(n / 2), 12);
    const autocorrelations: number[] = [];

    for (let lag = 1; lag <= maxLag; lag++) {
      const correlation = this.autocorrelation(values, lag);
      autocorrelations.push(correlation);
    }

    // Encontra o lag com maior autocorrelação (excluindo lag=1)
    let maxCorr = -1;
    let period = 0;

    for (let i = 1; i < autocorrelations.length; i++) {
      if (autocorrelations[i] > maxCorr) {
        maxCorr = autocorrelations[i];
        period = i + 1;
      }
    }

    // Se a autocorrelação for significativa, há padrão cíclico
    if (maxCorr > 0.5) {
      const stats = this.calculateStatistics(values);
      return {
        period,
        amplitude: stats.range / 2,
      };
    }

    return undefined;
  }

  /**
   * Calcula autocorrelação para um lag específico
   */
  private autocorrelation(values: number[], lag: number): number {
    const n = values.length;
    const mean = values.reduce((sum, v) => sum + v, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n - lag; i++) {
      numerator += (values[i] - mean) * (values[i + lag] - mean);
    }

    for (let i = 0; i < n; i++) {
      denominator += Math.pow(values[i] - mean, 2);
    }

    return numerator / denominator;
  }

  /**
   * Gera previsões futuras
   */
  private generateForecast(
    data: DataPoint[],
    type: TrendType,
    stats: TrendAnalysis['statistics']
  ): TrendAnalysis['forecast'] {
    const values = data.map((d) => d.value);
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);

    let next: number;
    const next3Months: number[] = [];
    const next6Months: number[] = [];

    if (type === TrendType.LINEAR || type === TrendType.EXPONENTIAL) {
      const regression = this.linearRegression(indices, values);

      // Próximo valor
      next = regression.slope * n + regression.intercept;

      // Próximos 3 e 6 meses
      for (let i = 1; i <= 6; i++) {
        const forecast = regression.slope * (n + i) + regression.intercept;
        if (i <= 3) {
          next3Months.push(Math.max(0, forecast));
        }
        next6Months.push(Math.max(0, forecast));
      }
    } else {
      // Para tipos estáveis ou voláteis, usa média
      next = stats.mean;
      for (let i = 0; i < 6; i++) {
        if (i < 3) {
          next3Months.push(stats.mean);
        }
        next6Months.push(stats.mean);
      }
    }

    return {
      next: Math.max(0, next),
      next3Months,
      next6Months,
    };
  }

  /**
   * Traduz direção para português
   */
  private translateDirection(direction: 'up' | 'down' | 'neutral'): string {
    const translations = {
      up: 'crescente',
      down: 'decrescente',
      neutral: 'estável',
    };
    return translations[direction];
  }
}

// Exporta instância única
export const trendAnalyzerService = new TrendAnalyzerService();
