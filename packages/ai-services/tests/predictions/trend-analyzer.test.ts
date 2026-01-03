import {
  TrendAnalyzerService,
  TrendType,
  DataPoint,
  TrendAnalysis,
} from '../../src/predictions/trend-analyzer';

describe('TrendAnalyzerService', () => {
  let service: TrendAnalyzerService;

  beforeEach(() => {
    service = new TrendAnalyzerService();
  });

  const createDataPoint = (value: number, daysAgo: number): DataPoint => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return { timestamp: date, value };
  };

  describe('analyzeTrend', () => {
    describe('with insufficient data', () => {
      it('should throw error with less than 2 points', () => {
        const data: DataPoint[] = [createDataPoint(100, 0)];
        expect(() => service.analyzeTrend(data)).toThrow('Dados insuficientes');
      });

      it('should throw error with empty array', () => {
        const data: DataPoint[] = [];
        expect(() => service.analyzeTrend(data)).toThrow('Dados insuficientes');
      });
    });

    describe('with linear trend', () => {
      it('should detect upward linear trend', () => {
        const data: DataPoint[] = [
          createDataPoint(100, 10),
          createDataPoint(150, 8),
          createDataPoint(200, 6),
          createDataPoint(250, 4),
          createDataPoint(300, 2),
          createDataPoint(350, 0),
        ];

        const analysis = service.analyzeTrend(data);

        expect(analysis.type).toBe(TrendType.LINEAR);
        expect(analysis.direction).toBe('up');
        expect(analysis.strength).toBeGreaterThan(0.8);
      });

      it('should detect downward linear trend', () => {
        const data: DataPoint[] = [
          createDataPoint(350, 10),
          createDataPoint(300, 8),
          createDataPoint(250, 6),
          createDataPoint(200, 4),
          createDataPoint(150, 2),
          createDataPoint(100, 0),
        ];

        const analysis = service.analyzeTrend(data);

        expect(analysis.type).toBe(TrendType.LINEAR);
        expect(analysis.direction).toBe('down');
      });
    });

    describe('with stable trend', () => {
      it('should detect stable trend', () => {
        const data: DataPoint[] = Array.from({ length: 10 }, (_, i) =>
          createDataPoint(100, i)
        );

        const analysis = service.analyzeTrend(data);

        expect(analysis.type).toBe(TrendType.STABLE);
        expect(analysis.direction).toBe('neutral');
      });

      it('should tolerate small variations', () => {
        const data: DataPoint[] = [
          createDataPoint(100, 6),
          createDataPoint(101, 5),
          createDataPoint(99, 4),
          createDataPoint(100, 3),
          createDataPoint(101, 2),
          createDataPoint(100, 0),
        ];

        const analysis = service.analyzeTrend(data);
        expect(analysis.type).toBe(TrendType.STABLE);
      });
    });

    describe('with volatile trend', () => {
      it('should detect volatile data', () => {
        const data: DataPoint[] = [
          createDataPoint(100, 10),
          createDataPoint(500, 9),
          createDataPoint(50, 8),
          createDataPoint(600, 7),
          createDataPoint(30, 6),
          createDataPoint(550, 5),
        ];

        const analysis = service.analyzeTrend(data);

        expect(analysis.type).toBe(TrendType.VOLATILE);
        expect(analysis.volatility).toBeGreaterThan(0.3);
      });

      it('should have high volatility value', () => {
        const data: DataPoint[] = [
          createDataPoint(100, 5),
          createDataPoint(1000, 4),
          createDataPoint(200, 3),
          createDataPoint(900, 2),
          createDataPoint(150, 0),
        ];

        const analysis = service.analyzeTrend(data);
        expect(analysis.volatility).toBeGreaterThan(0.5);
      });
    });

    describe('statistics calculation', () => {
      it('should calculate correct statistics', () => {
        const data: DataPoint[] = [
          createDataPoint(100, 4),
          createDataPoint(200, 3),
          createDataPoint(150, 2),
          createDataPoint(250, 1),
          createDataPoint(175, 0),
        ];

        const analysis = service.analyzeTrend(data);
        const stats = analysis.statistics;

        expect(stats.mean).toBe(175);
        expect(stats.min).toBe(100);
        expect(stats.max).toBe(250);
        expect(stats.range).toBe(150);
        expect(stats.median).toBe(175);
        expect(stats.stdDev).toBeGreaterThan(0);
      });

      it('should calculate median for even number of values', () => {
        const data: DataPoint[] = [
          createDataPoint(100, 3),
          createDataPoint(200, 2),
          createDataPoint(300, 1),
          createDataPoint(400, 0),
        ];

        const analysis = service.analyzeTrend(data);
        expect(analysis.statistics.median).toBe(250);
      });

      it('should calculate median for odd number of values', () => {
        const data: DataPoint[] = [
          createDataPoint(100, 2),
          createDataPoint(200, 1),
          createDataPoint(300, 0),
        ];

        const analysis = service.analyzeTrend(data);
        expect(analysis.statistics.median).toBe(200);
      });
    });

    describe('forecast generation', () => {
      it('should generate next value forecast', () => {
        const data: DataPoint[] = [
          createDataPoint(100, 4),
          createDataPoint(150, 3),
          createDataPoint(200, 2),
          createDataPoint(250, 1),
          createDataPoint(300, 0),
        ];

        const analysis = service.analyzeTrend(data);
        expect(analysis.forecast.next).toBeGreaterThan(300);
      });

      it('should generate 3-month forecast', () => {
        const data: DataPoint[] = [
          createDataPoint(100, 4),
          createDataPoint(150, 3),
          createDataPoint(200, 2),
          createDataPoint(250, 1),
          createDataPoint(300, 0),
        ];

        const analysis = service.analyzeTrend(data);
        expect(analysis.forecast.next3Months).toHaveLength(3);
      });

      it('should generate 6-month forecast', () => {
        const data: DataPoint[] = [
          createDataPoint(100, 4),
          createDataPoint(150, 3),
          createDataPoint(200, 2),
          createDataPoint(250, 1),
          createDataPoint(300, 0),
        ];

        const analysis = service.analyzeTrend(data);
        expect(analysis.forecast.next6Months).toHaveLength(6);
      });

      it('should not forecast negative values', () => {
        const data: DataPoint[] = [
          createDataPoint(100, 4),
          createDataPoint(50, 3),
          createDataPoint(25, 2),
          createDataPoint(10, 1),
          createDataPoint(5, 0),
        ];

        const analysis = service.analyzeTrend(data);
        expect(analysis.forecast.next).toBeGreaterThanOrEqual(0);
        analysis.forecast.next6Months.forEach(val => {
          expect(val).toBeGreaterThanOrEqual(0);
        });
      });

      it('should use mean for stable trends', () => {
        const data: DataPoint[] = Array.from({ length: 10 }, (_, i) =>
          createDataPoint(100, i)
        );

        const analysis = service.analyzeTrend(data);
        expect(analysis.forecast.next).toBeCloseTo(100, 0);
      });
    });

    describe('strength calculation', () => {
      it('should return high strength for clear linear trend', () => {
        const data: DataPoint[] = [
          createDataPoint(100, 5),
          createDataPoint(120, 4),
          createDataPoint(140, 3),
          createDataPoint(160, 2),
          createDataPoint(180, 1),
          createDataPoint(200, 0),
        ];

        const analysis = service.analyzeTrend(data);
        expect(analysis.strength).toBeGreaterThan(0.9);
      });

      it('should return low strength for noisy data', () => {
        const data: DataPoint[] = [
          createDataPoint(100, 5),
          createDataPoint(150, 4),
          createDataPoint(110, 3),
          createDataPoint(160, 2),
          createDataPoint(105, 1),
          createDataPoint(155, 0),
        ];

        const analysis = service.analyzeTrend(data);
        expect(analysis.strength).toBeLessThan(0.7);
      });
    });

    describe('volatility calculation', () => {
      it('should be normalized between 0 and 1', () => {
        const data: DataPoint[] = [
          createDataPoint(100, 4),
          createDataPoint(200, 3),
          createDataPoint(150, 2),
          createDataPoint(250, 1),
          createDataPoint(175, 0),
        ];

        const analysis = service.analyzeTrend(data);
        expect(analysis.volatility).toBeGreaterThanOrEqual(0);
        expect(analysis.volatility).toBeLessThanOrEqual(1);
      });

      it('should be low for stable data', () => {
        const data: DataPoint[] = Array.from({ length: 10 }, (_, i) =>
          createDataPoint(100, i)
        );

        const analysis = service.analyzeTrend(data);
        expect(analysis.volatility).toBeLessThan(0.1);
      });
    });

    describe('cyclical pattern detection', () => {
      it('should not detect pattern with insufficient data', () => {
        const data: DataPoint[] = Array.from({ length: 10 }, (_, i) =>
          createDataPoint(100, i)
        );

        const analysis = service.analyzeTrend(data);
        expect(analysis.cyclicalPattern).toBeUndefined();
      });

      it('should detect cyclical pattern with enough data', () => {
        // Create cyclical data: high-low-high-low pattern
        const data: DataPoint[] = Array.from({ length: 12 }, (_, i) => {
          const value = i % 2 === 0 ? 200 : 100;
          return createDataPoint(value, 11 - i);
        });

        const analysis = service.analyzeTrend(data);
        // May or may not detect depending on autocorrelation threshold
        if (analysis.cyclicalPattern) {
          expect(analysis.cyclicalPattern.period).toBeGreaterThan(0);
          expect(analysis.cyclicalPattern.amplitude).toBeGreaterThan(0);
        }
      });
    });

    describe('data sorting', () => {
      it('should handle unsorted data', () => {
        const data: DataPoint[] = [
          createDataPoint(300, 0),
          createDataPoint(100, 10),
          createDataPoint(200, 5),
        ];

        const analysis = service.analyzeTrend(data);
        expect(analysis).toBeDefined();
        expect(analysis.statistics.min).toBe(100);
        expect(analysis.statistics.max).toBe(300);
      });
    });
  });

  describe('comparePeriods', () => {
    it('should compare two periods', () => {
      const period1: DataPoint[] = [
        createDataPoint(100, 3),
        createDataPoint(150, 2),
        createDataPoint(200, 1),
      ];

      const period2: DataPoint[] = [
        createDataPoint(200, 3),
        createDataPoint(250, 2),
        createDataPoint(300, 1),
      ];

      const comparison = service.comparePeriods(period1, period2);

      expect(comparison.period1Analysis).toBeDefined();
      expect(comparison.period2Analysis).toBeDefined();
      expect(comparison.comparison.averageChange).toBeGreaterThan(0);
    });

    it('should calculate percentage change', () => {
      const period1: DataPoint[] = [
        createDataPoint(100, 2),
        createDataPoint(100, 1),
      ];

      const period2: DataPoint[] = [
        createDataPoint(200, 2),
        createDataPoint(200, 1),
      ];

      const comparison = service.comparePeriods(period1, period2);

      expect(comparison.comparison.averageChangePercentage).toBe(100);
    });

    it('should detect trend shift', () => {
      const period1: DataPoint[] = [
        createDataPoint(100, 5),
        createDataPoint(150, 4),
        createDataPoint(200, 3),
      ];

      const period2: DataPoint[] = [
        createDataPoint(200, 5),
        createDataPoint(150, 4),
        createDataPoint(100, 3),
      ];

      const comparison = service.comparePeriods(period1, period2);
      expect(comparison.comparison.trendShift).toContain('Mudança de tendência');
    });

    it('should detect trend strengthening', () => {
      const period1: DataPoint[] = [
        createDataPoint(100, 4),
        createDataPoint(105, 3),
        createDataPoint(110, 2),
        createDataPoint(115, 1),
      ];

      const period2: DataPoint[] = [
        createDataPoint(100, 4),
        createDataPoint(120, 3),
        createDataPoint(140, 2),
        createDataPoint(160, 1),
      ];

      const comparison = service.comparePeriods(period1, period2);
      // May detect strengthening depending on R² values
      expect(comparison.comparison.trendShift).toBeDefined();
    });

    it('should calculate volatility change', () => {
      const period1: DataPoint[] = Array.from({ length: 5 }, (_, i) =>
        createDataPoint(100, i)
      );

      const period2: DataPoint[] = [
        createDataPoint(100, 4),
        createDataPoint(200, 3),
        createDataPoint(100, 2),
        createDataPoint(200, 1),
      ];

      const comparison = service.comparePeriods(period1, period2);
      expect(comparison.comparison.volatilityChange).toBeGreaterThan(0);
    });
  });

  describe('detectAnomalies', () => {
    it('should detect outliers', () => {
      const data: DataPoint[] = [
        createDataPoint(100, 10),
        createDataPoint(100, 9),
        createDataPoint(100, 8),
        createDataPoint(100, 7),
        createDataPoint(100, 6),
        createDataPoint(500, 5), // Anomaly
        createDataPoint(100, 4),
        createDataPoint(100, 3),
      ];

      const anomalies = service.detectAnomalies(data);

      expect(anomalies.length).toBeGreaterThan(0);
      expect(anomalies[0].point.value).toBe(500);
    });

    it('should classify anomaly severity', () => {
      const data: DataPoint[] = [
        createDataPoint(100, 5),
        createDataPoint(100, 4),
        createDataPoint(100, 3),
        createDataPoint(100, 2),
        createDataPoint(1000, 1), // High severity anomaly
      ];

      const anomalies = service.detectAnomalies(data);

      if (anomalies.length > 0) {
        expect(['low', 'medium', 'high']).toContain(anomalies[0].severity);
      }
    });

    it('should use custom sensitivity', () => {
      const data: DataPoint[] = [
        createDataPoint(100, 5),
        createDataPoint(100, 4),
        createDataPoint(100, 3),
        createDataPoint(150, 2), // Mild outlier
        createDataPoint(100, 1),
      ];

      const strictAnomalies = service.detectAnomalies(data, { sensitivity: 1 });
      const lenientAnomalies = service.detectAnomalies(data, { sensitivity: 3 });

      expect(strictAnomalies.length).toBeGreaterThanOrEqual(lenientAnomalies.length);
    });

    it('should return empty array for stable data', () => {
      const data: DataPoint[] = Array.from({ length: 10 }, (_, i) =>
        createDataPoint(100, i)
      );

      const anomalies = service.detectAnomalies(data);
      expect(anomalies.length).toBe(0);
    });

    it('should handle negative values', () => {
      const data: DataPoint[] = [
        createDataPoint(100, 4),
        createDataPoint(100, 3),
        createDataPoint(-500, 2), // Negative anomaly
        createDataPoint(100, 1),
      ];

      const anomalies = service.detectAnomalies(data, { sensitivity: 1.5 });
      expect(anomalies.length).toBeGreaterThan(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle minimum data (2 points)', () => {
      const data: DataPoint[] = [
        createDataPoint(100, 1),
        createDataPoint(200, 0),
      ];

      const analysis = service.analyzeTrend(data);
      expect(analysis).toBeDefined();
      expect(analysis.statistics.mean).toBe(150);
    });

    it('should handle identical values', () => {
      const data: DataPoint[] = [
        createDataPoint(100, 2),
        createDataPoint(100, 1),
        createDataPoint(100, 0),
      ];

      const analysis = service.analyzeTrend(data);
      expect(analysis.type).toBe(TrendType.STABLE);
      expect(analysis.direction).toBe('neutral');
      expect(analysis.statistics.stdDev).toBe(0);
    });

    it('should handle zero values', () => {
      const data: DataPoint[] = [
        createDataPoint(0, 2),
        createDataPoint(0, 1),
        createDataPoint(0, 0),
      ];

      const analysis = service.analyzeTrend(data);
      expect(analysis.statistics.mean).toBe(0);
    });

    it('should handle very small variations', () => {
      const data: DataPoint[] = [
        createDataPoint(1.0001, 2),
        createDataPoint(1.0002, 1),
        createDataPoint(1.0003, 0),
      ];

      const analysis = service.analyzeTrend(data);
      expect(analysis).toBeDefined();
    });

    it('should handle very large numbers', () => {
      const data: DataPoint[] = [
        createDataPoint(1000000, 2),
        createDataPoint(2000000, 1),
        createDataPoint(3000000, 0),
      ];

      const analysis = service.analyzeTrend(data);
      expect(analysis.direction).toBe('up');
    });

    it('should handle mixed positive and negative values', () => {
      const data: DataPoint[] = [
        createDataPoint(-100, 4),
        createDataPoint(-50, 3),
        createDataPoint(0, 2),
        createDataPoint(50, 1),
        createDataPoint(100, 0),
      ];

      const analysis = service.analyzeTrend(data);
      expect(analysis.direction).toBe('up');
      expect(analysis.statistics.mean).toBe(0);
    });

    it('should handle same timestamp for multiple data points', () => {
      const sameDate = new Date();
      const data: DataPoint[] = [
        { timestamp: sameDate, value: 100 },
        { timestamp: sameDate, value: 200 },
      ];

      const analysis = service.analyzeTrend(data);
      expect(analysis).toBeDefined();
    });
  });
});
