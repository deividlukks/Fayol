import {
  SpendingPredictorService,
  HistoricalData,
  SpendingPrediction,
} from '../../src/predictions/spending-predictor';

describe('SpendingPredictorService', () => {
  let service: SpendingPredictorService;

  beforeEach(() => {
    service = new SpendingPredictorService();
  });

  const createHistoricalData = (amount: number, daysAgo: number, category?: string): HistoricalData => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return { date, amount, category };
  };

  describe('predictSpending', () => {
    describe('with insufficient data', () => {
      it('should handle single data point', () => {
        const data: HistoricalData[] = [createHistoricalData(1000, 0)];
        const prediction = service.predictSpending(data);

        expect(prediction.predictedAmount).toBe(1000);
        expect(prediction.confidence).toBe(0.3);
        expect(prediction.trend).toBe('stable');
      });

      it('should handle empty array', () => {
        const data: HistoricalData[] = [];
        const prediction = service.predictSpending(data);

        expect(prediction.predictedAmount).toBe(0);
        expect(prediction.confidence).toBe(0.3);
        expect(prediction.trend).toBe('stable');
      });
    });

    describe('with stable trend', () => {
      it('should predict stable spending', () => {
        const data: HistoricalData[] = [
          createHistoricalData(1000, 90),
          createHistoricalData(1000, 60),
          createHistoricalData(1000, 30),
          createHistoricalData(1000, 0),
        ];

        const prediction = service.predictSpending(data);

        expect(prediction.trend).toBe('stable');
        expect(prediction.predictedAmount).toBeCloseTo(1000, 0);
        expect(prediction.confidence).toBeGreaterThan(0.3);
      });

      it('should have high confidence for stable data', () => {
        const data: HistoricalData[] = Array.from({ length: 10 }, (_, i) =>
          createHistoricalData(1000, i * 30)
        );

        const prediction = service.predictSpending(data);
        expect(prediction.confidence).toBeGreaterThan(0.5);
      });
    });

    describe('with increasing trend', () => {
      it('should detect increasing trend', () => {
        const data: HistoricalData[] = [
          createHistoricalData(1000, 90),
          createHistoricalData(1100, 60),
          createHistoricalData(1200, 30),
          createHistoricalData(1300, 0),
        ];

        const prediction = service.predictSpending(data);

        expect(prediction.trend).toBe('increasing');
        expect(prediction.trendPercentage).toBeGreaterThan(0);
        expect(prediction.predictedAmount).toBeGreaterThan(1300);
      });

      it('should adjust prediction based on trend', () => {
        const data: HistoricalData[] = [
          createHistoricalData(1000, 90),
          createHistoricalData(1500, 60),
          createHistoricalData(2000, 30),
        ];

        const prediction = service.predictSpending(data);
        expect(prediction.predictedAmount).toBeGreaterThan(2000);
      });
    });

    describe('with decreasing trend', () => {
      it('should detect decreasing trend', () => {
        const data: HistoricalData[] = [
          createHistoricalData(1300, 90),
          createHistoricalData(1200, 60),
          createHistoricalData(1100, 30),
          createHistoricalData(1000, 0),
        ];

        const prediction = service.predictSpending(data);

        expect(prediction.trend).toBe('decreasing');
        expect(prediction.trendPercentage).toBeGreaterThan(0);
      });

      it('should not predict negative amounts', () => {
        const data: HistoricalData[] = [
          createHistoricalData(100, 60),
          createHistoricalData(50, 30),
          createHistoricalData(10, 0),
        ];

        const prediction = service.predictSpending(data);
        expect(prediction.predictedAmount).toBeGreaterThanOrEqual(0);
      });
    });

    describe('with custom options', () => {
      it('should use custom window size', () => {
        const data: HistoricalData[] = Array.from({ length: 10 }, (_, i) =>
          createHistoricalData(1000 + i * 100, i * 30)
        );

        const prediction1 = service.predictSpending(data, { windowSize: 2 });
        const prediction2 = service.predictSpending(data, { windowSize: 5 });

        expect(prediction1).toBeDefined();
        expect(prediction2).toBeDefined();
      });

      it('should handle seasonality option disabled', () => {
        const data: HistoricalData[] = Array.from({ length: 12 }, (_, i) =>
          createHistoricalData(1000, i * 30)
        );

        const prediction = service.predictSpending(data, { includeSeasonality: false });
        expect(prediction.breakdown?.seasonalAdjustment).toBe(0);
      });

      it('should apply seasonal adjustment with enough data', () => {
        const data: HistoricalData[] = Array.from({ length: 12 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          return { date, amount: 1000 };
        });

        const prediction = service.predictSpending(data, { includeSeasonality: true });
        expect(prediction.breakdown).toBeDefined();
      });
    });

    describe('prediction breakdown', () => {
      it('should provide detailed breakdown', () => {
        const data: HistoricalData[] = [
          createHistoricalData(1000, 90),
          createHistoricalData(1100, 60),
          createHistoricalData(1200, 30),
        ];

        const prediction = service.predictSpending(data);

        expect(prediction.breakdown).toBeDefined();
        expect(prediction.breakdown?.baseAmount).toBeGreaterThan(0);
        expect(prediction.breakdown?.trendAdjustment).toBeDefined();
        expect(prediction.breakdown?.seasonalAdjustment).toBeDefined();
      });

      it('should sum breakdown components correctly', () => {
        const data: HistoricalData[] = [
          createHistoricalData(1000, 60),
          createHistoricalData(1100, 30),
          createHistoricalData(1200, 0),
        ];

        const prediction = service.predictSpending(data);
        const breakdown = prediction.breakdown!;

        const sum = breakdown.baseAmount + breakdown.trendAdjustment + breakdown.seasonalAdjustment;
        expect(prediction.predictedAmount).toBeCloseTo(sum, 0);
      });
    });

    describe('confidence calculation', () => {
      it('should have low confidence for volatile data', () => {
        const data: HistoricalData[] = [
          createHistoricalData(1000, 90),
          createHistoricalData(2000, 60),
          createHistoricalData(500, 30),
          createHistoricalData(1500, 0),
        ];

        const prediction = service.predictSpending(data);
        expect(prediction.confidence).toBeLessThan(0.7);
      });

      it('should increase confidence with more data', () => {
        const baseData = [
          createHistoricalData(1000, 60),
          createHistoricalData(1000, 30),
        ];

        const moreData = [
          ...baseData,
          ...Array.from({ length: 8 }, (_, i) => createHistoricalData(1000, i * 10)),
        ];

        const prediction1 = service.predictSpending(baseData);
        const prediction2 = service.predictSpending(moreData);

        expect(prediction2.confidence).toBeGreaterThanOrEqual(prediction1.confidence);
      });

      it('should be between 0 and 1', () => {
        const data: HistoricalData[] = Array.from({ length: 5 }, (_, i) =>
          createHistoricalData(1000, i * 30)
        );

        const prediction = service.predictSpending(data);
        expect(prediction.confidence).toBeGreaterThanOrEqual(0);
        expect(prediction.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('predictByCategory', () => {
    it('should predict for each category', () => {
      const data: HistoricalData[] = [
        createHistoricalData(1000, 30, 'Food'),
        createHistoricalData(500, 30, 'Transport'),
        createHistoricalData(1100, 0, 'Food'),
        createHistoricalData(550, 0, 'Transport'),
      ];

      const predictions = service.predictByCategory(data);

      expect(predictions.size).toBe(2);
      expect(predictions.has('Food')).toBe(true);
      expect(predictions.has('Transport')).toBe(true);
    });

    it('should handle missing category as "Sem categoria"', () => {
      const data: HistoricalData[] = [
        createHistoricalData(1000, 30),
        createHistoricalData(1100, 0),
      ];

      const predictions = service.predictByCategory(data);

      expect(predictions.has('Sem categoria')).toBe(true);
    });

    it('should include category in prediction result', () => {
      const data: HistoricalData[] = [
        createHistoricalData(1000, 30, 'Food'),
        createHistoricalData(1100, 0, 'Food'),
      ];

      const predictions = service.predictByCategory(data);
      const foodPrediction = predictions.get('Food');

      expect(foodPrediction?.category).toBe('Food');
    });

    it('should handle empty data', () => {
      const predictions = service.predictByCategory([]);
      expect(predictions.size).toBe(0);
    });

    it('should pass options to predict method', () => {
      const data: HistoricalData[] = [
        createHistoricalData(1000, 60, 'Food'),
        createHistoricalData(1100, 30, 'Food'),
        createHistoricalData(1200, 0, 'Food'),
      ];

      const predictions = service.predictByCategory(data, { windowSize: 2 });
      expect(predictions.get('Food')).toBeDefined();
    });
  });

  describe('predictMonthlyTotal', () => {
    it('should aggregate data by month', () => {
      const data: HistoricalData[] = [
        { date: new Date('2023-01-15'), amount: 500 },
        { date: new Date('2023-01-20'), amount: 500 },
        { date: new Date('2023-02-15'), amount: 600 },
        { date: new Date('2023-02-20'), amount: 600 },
      ];

      const prediction = service.predictMonthlyTotal(data);
      expect(prediction).toBeDefined();
      expect(prediction.predictedAmount).toBeGreaterThan(0);
    });

    it('should enable seasonality for monthly predictions', () => {
      const data: HistoricalData[] = Array.from({ length: 24 }, (_, i) => {
        const date = new Date('2023-01-01');
        date.setMonth(date.getMonth() + i);
        return { date, amount: 1000 };
      });

      const prediction = service.predictMonthlyTotal(data);
      expect(prediction).toBeDefined();
    });

    it('should handle single month', () => {
      const data: HistoricalData[] = [
        { date: new Date('2023-01-15'), amount: 500 },
        { date: new Date('2023-01-20'), amount: 500 },
      ];

      const prediction = service.predictMonthlyTotal(data);
      expect(prediction.predictedAmount).toBe(1000);
    });

    it('should handle empty data', () => {
      const prediction = service.predictMonthlyTotal([]);
      expect(prediction.predictedAmount).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle very small amounts', () => {
      const data: HistoricalData[] = [
        createHistoricalData(0.01, 60),
        createHistoricalData(0.02, 30),
        createHistoricalData(0.03, 0),
      ];

      const prediction = service.predictSpending(data);
      expect(prediction.predictedAmount).toBeGreaterThan(0);
    });

    it('should handle very large amounts', () => {
      const data: HistoricalData[] = [
        createHistoricalData(1000000, 60),
        createHistoricalData(1100000, 30),
        createHistoricalData(1200000, 0),
      ];

      const prediction = service.predictSpending(data);
      expect(prediction.predictedAmount).toBeGreaterThan(0);
    });

    it('should handle zero amounts', () => {
      const data: HistoricalData[] = [
        createHistoricalData(0, 60),
        createHistoricalData(0, 30),
        createHistoricalData(0, 0),
      ];

      const prediction = service.predictSpending(data);
      expect(prediction.predictedAmount).toBe(0);
    });

    it('should handle mixed zero and non-zero amounts', () => {
      const data: HistoricalData[] = [
        createHistoricalData(1000, 90),
        createHistoricalData(0, 60),
        createHistoricalData(1000, 30),
        createHistoricalData(0, 0),
      ];

      const prediction = service.predictSpending(data);
      expect(prediction).toBeDefined();
      expect(prediction.predictedAmount).toBeGreaterThanOrEqual(0);
    });

    it('should handle data with same date', () => {
      const sameDate = new Date();
      const data: HistoricalData[] = [
        { date: sameDate, amount: 1000 },
        { date: sameDate, amount: 1100 },
      ];

      const prediction = service.predictSpending(data);
      expect(prediction).toBeDefined();
    });

    it('should handle unsorted data', () => {
      const data: HistoricalData[] = [
        createHistoricalData(1200, 0),
        createHistoricalData(1000, 60),
        createHistoricalData(1100, 30),
      ];

      const prediction = service.predictSpending(data);
      expect(prediction.trend).toBe('increasing');
    });

    it('should provide next month prediction equal to predicted amount', () => {
      const data: HistoricalData[] = [
        createHistoricalData(1000, 60),
        createHistoricalData(1100, 30),
        createHistoricalData(1200, 0),
      ];

      const prediction = service.predictSpending(data);
      expect(prediction.nextMonthPrediction).toBe(prediction.predictedAmount);
    });

    it('should handle extreme volatility', () => {
      const data: HistoricalData[] = [
        createHistoricalData(100, 120),
        createHistoricalData(10000, 90),
        createHistoricalData(50, 60),
        createHistoricalData(5000, 30),
        createHistoricalData(200, 0),
      ];

      const prediction = service.predictSpending(data);
      expect(prediction.confidence).toBeLessThan(0.5);
      expect(prediction.predictedAmount).toBeGreaterThan(0);
    });
  });
});
