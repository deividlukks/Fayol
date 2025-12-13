import {
  FinancialInsightsService,
  InsightType,
  InsightSeverity,
  TransactionData,
} from '../../src/insights/financial-insights';

describe('FinancialInsightsService', () => {
  let service: FinancialInsightsService;

  beforeEach(() => {
    service = new FinancialInsightsService();
  });

  const createTransaction = (
    id: string,
    amount: number,
    category: string,
    date: Date,
    type: 'income' | 'expense' = 'expense',
    description?: string
  ): TransactionData => ({
    id,
    amount,
    category,
    date,
    type,
    description,
  });

  describe('generateInsights', () => {
    it('should return empty array for no transactions', () => {
      const insights = service.generateInsights([]);
      expect(insights).toEqual([]);
    });

    it('should sort insights by severity', () => {
      const transactions: TransactionData[] = [
        createTransaction('1', 100, 'Test', new Date(), 'expense'),
      ];
      const budgets = new Map([['Test', 50]]);

      const insights = service.generateInsights(transactions, { budgets });

      if (insights.length > 1) {
        for (let i = 0; i < insights.length - 1; i++) {
          const currentWeight = getSeverityWeight(insights[i].severity);
          const nextWeight = getSeverityWeight(insights[i + 1].severity);
          expect(currentWeight).toBeGreaterThanOrEqual(nextWeight);
        }
      }
    });

    it('should generate multiple types of insights', () => {
      const now = new Date();
      const transactions: TransactionData[] = [
        createTransaction('1', 1000, 'Alimentação', now, 'expense'),
        createTransaction('2', 500, 'Transporte', now, 'expense'),
        createTransaction('3', 2000, 'Salary', now, 'income'),
      ];

      const insights = service.generateInsights(transactions, { periodDays: 30 });
      expect(insights.length).toBeGreaterThan(0);
    });
  });

  describe('detectSpendingSpikes', () => {
    it('should detect spending spike', () => {
      const transactions: TransactionData[] = [];
      const baseDate = new Date('2023-01-01');

      // Normal days
      for (let i = 0; i < 10; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);
        transactions.push(createTransaction(`normal-${i}`, 100, 'Test', date, 'expense'));
      }

      // Spike day
      const spikeDate = new Date(baseDate);
      spikeDate.setDate(spikeDate.getDate() + 10);
      transactions.push(createTransaction('spike', 500, 'Test', spikeDate, 'expense'));

      const insights = service.generateInsights(transactions);
      const spikes = insights.filter((i) => i.type === InsightType.SPENDING_SPIKE);

      expect(spikes.length).toBeGreaterThan(0);
    });

    it('should not detect spike with insufficient data', () => {
      const transactions: TransactionData[] = [
        createTransaction('1', 100, 'Test', new Date(), 'expense'),
      ];

      const insights = service.generateInsights(transactions);
      const spikes = insights.filter((i) => i.type === InsightType.SPENDING_SPIKE);

      expect(spikes.length).toBe(0);
    });

    it('should classify spike severity correctly', () => {
      const transactions: TransactionData[] = [];
      const baseDate = new Date('2023-01-01');

      for (let i = 0; i < 10; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);
        transactions.push(createTransaction(`normal-${i}`, 100, 'Test', date, 'expense'));
      }

      // Very high spike (>100% above average)
      const spikeDate = new Date(baseDate);
      spikeDate.setDate(spikeDate.getDate() + 10);
      transactions.push(createTransaction('spike', 1000, 'Test', spikeDate, 'expense'));

      const insights = service.generateInsights(transactions);
      const spike = insights.find((i) => i.type === InsightType.SPENDING_SPIKE);

      expect(spike).toBeDefined();
      expect(spike?.severity).toBe(InsightSeverity.ALERT);
    });

    it('should ignore income transactions', () => {
      const transactions: TransactionData[] = [
        createTransaction('1', 10000, 'Salary', new Date(), 'income'),
      ];

      const insights = service.generateInsights(transactions);
      const spikes = insights.filter((i) => i.type === InsightType.SPENDING_SPIKE);

      expect(spikes.length).toBe(0);
    });
  });

  describe('detectUnusualCategories', () => {
    it('should detect category with high spending percentage', () => {
      const transactions: TransactionData[] = [
        createTransaction('1', 800, 'Moradia', new Date(), 'expense'),
        createTransaction('2', 100, 'Alimentação', new Date(), 'expense'),
        createTransaction('3', 100, 'Transporte', new Date(), 'expense'),
      ];

      const insights = service.generateInsights(transactions);
      const unusual = insights.filter((i) => i.type === InsightType.UNUSUAL_CATEGORY);

      expect(unusual.length).toBeGreaterThan(0);
      expect(unusual[0].affectedCategory).toBe('Moradia');
    });

    it('should set correct severity for very high percentage', () => {
      const transactions: TransactionData[] = [
        createTransaction('1', 900, 'Test', new Date(), 'expense'),
        createTransaction('2', 100, 'Other', new Date(), 'expense'),
      ];

      const insights = service.generateInsights(transactions);
      const unusual = insights.find((i) => i.type === InsightType.UNUSUAL_CATEGORY && i.affectedCategory === 'Test');

      expect(unusual).toBeDefined();
      expect(unusual?.severity).toBe(InsightSeverity.WARNING);
    });

    it('should not detect with balanced categories', () => {
      const transactions: TransactionData[] = [
        createTransaction('1', 250, 'A', new Date(), 'expense'),
        createTransaction('2', 250, 'B', new Date(), 'expense'),
        createTransaction('3', 250, 'C', new Date(), 'expense'),
        createTransaction('4', 250, 'D', new Date(), 'expense'),
      ];

      const insights = service.generateInsights(transactions);
      const unusual = insights.filter((i) => i.type === InsightType.UNUSUAL_CATEGORY);

      expect(unusual.length).toBe(0);
    });
  });

  describe('checkBudgetWarnings', () => {
    it('should warn when budget is 90% spent', () => {
      const transactions: TransactionData[] = [
        createTransaction('1', 900, 'Alimentação', new Date(), 'expense'),
      ];
      const budgets = new Map([['Alimentação', 1000]]);

      const insights = service.generateInsights(transactions, { budgets });
      const warnings = insights.filter((i) => i.type === InsightType.BUDGET_WARNING);

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].severity).toBe(InsightSeverity.ALERT);
    });

    it('should critical alert when budget exceeded', () => {
      const transactions: TransactionData[] = [
        createTransaction('1', 1100, 'Alimentação', new Date(), 'expense'),
      ];
      const budgets = new Map([['Alimentação', 1000]]);

      const insights = service.generateInsights(transactions, { budgets });
      const warnings = insights.filter((i) => i.type === InsightType.BUDGET_WARNING);

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].severity).toBe(InsightSeverity.CRITICAL);
    });

    it('should not warn when budget is under 90%', () => {
      const transactions: TransactionData[] = [
        createTransaction('1', 500, 'Alimentação', new Date(), 'expense'),
      ];
      const budgets = new Map([['Alimentação', 1000]]);

      const insights = service.generateInsights(transactions, { budgets });
      const warnings = insights.filter((i) => i.type === InsightType.BUDGET_WARNING);

      expect(warnings.length).toBe(0);
    });

    it('should handle category with no spending', () => {
      const transactions: TransactionData[] = [
        createTransaction('1', 100, 'Other', new Date(), 'expense'),
      ];
      const budgets = new Map([['Alimentação', 1000]]);

      const insights = service.generateInsights(transactions, { budgets });
      const warnings = insights.filter(
        (i) => i.type === InsightType.BUDGET_WARNING && i.affectedCategory === 'Alimentação'
      );

      expect(warnings.length).toBe(0);
    });

    it('should work without budgets parameter', () => {
      const transactions: TransactionData[] = [
        createTransaction('1', 1100, 'Alimentação', new Date(), 'expense'),
      ];

      const insights = service.generateInsights(transactions);
      const warnings = insights.filter((i) => i.type === InsightType.BUDGET_WARNING);

      expect(warnings.length).toBe(0);
    });
  });

  describe('findSavingsOpportunities', () => {
    it('should suggest savings for high spending categories', () => {
      const transactions: TransactionData[] = [
        createTransaction('1', 600, 'alimentação', new Date(), 'expense'),
      ];

      const insights = service.generateInsights(transactions);
      const savings = insights.filter((i) => i.type === InsightType.SAVINGS_OPPORTUNITY);

      expect(savings.length).toBeGreaterThan(0);
      expect(savings[0].affectedCategory).toBe('alimentação');
    });

    it('should not suggest savings for low spending', () => {
      const transactions: TransactionData[] = [
        createTransaction('1', 100, 'alimentação', new Date(), 'expense'),
      ];

      const insights = service.generateInsights(transactions);
      const savings = insights.filter((i) => i.type === InsightType.SAVINGS_OPPORTUNITY);

      expect(savings.length).toBe(0);
    });

    it('should calculate 10% potential savings', () => {
      const transactions: TransactionData[] = [
        createTransaction('1', 1000, 'transporte', new Date(), 'expense'),
      ];

      const insights = service.generateInsights(transactions);
      const saving = insights.find((i) => i.type === InsightType.SAVINGS_OPPORTUNITY);

      expect(saving?.value).toBe(100); // 10% of 1000
    });

    it('should only check specific categories', () => {
      const transactions: TransactionData[] = [
        createTransaction('1', 600, 'moradia', new Date(), 'expense'),
      ];

      const insights = service.generateInsights(transactions);
      const savings = insights.filter((i) => i.type === InsightType.SAVINGS_OPPORTUNITY);

      expect(savings.length).toBe(0);
    });
  });

  describe('analyzeIncomeVariance', () => {
    it('should detect income increase', () => {
      const transactions: TransactionData[] = [
        createTransaction('1', 3000, 'Salary', new Date('2023-01-15'), 'income'),
        createTransaction('2', 3000, 'Salary', new Date('2023-02-15'), 'income'),
        createTransaction('3', 4500, 'Salary', new Date('2023-03-15'), 'income'),
      ];

      const insights = service.generateInsights(transactions);
      const variance = insights.filter((i) => i.type === InsightType.INCOME_VARIANCE);

      expect(variance.length).toBeGreaterThan(0);
    });

    it('should detect income decrease', () => {
      const transactions: TransactionData[] = [
        createTransaction('1', 5000, 'Salary', new Date('2023-01-15'), 'income'),
        createTransaction('2', 5000, 'Salary', new Date('2023-02-15'), 'income'),
        createTransaction('3', 3000, 'Salary', new Date('2023-03-15'), 'income'),
      ];

      const insights = service.generateInsights(transactions);
      const variance = insights.find((i) => i.type === InsightType.INCOME_VARIANCE);

      expect(variance).toBeDefined();
      expect(variance?.severity).toBe(InsightSeverity.WARNING);
    });

    it('should not detect with insufficient income data', () => {
      const transactions: TransactionData[] = [
        createTransaction('1', 3000, 'Salary', new Date(), 'income'),
      ];

      const insights = service.generateInsights(transactions);
      const variance = insights.filter((i) => i.type === InsightType.INCOME_VARIANCE);

      expect(variance.length).toBe(0);
    });

    it('should ignore small variations', () => {
      const transactions: TransactionData[] = [
        createTransaction('1', 3000, 'Salary', new Date('2023-01-15'), 'income'),
        createTransaction('2', 3000, 'Salary', new Date('2023-02-15'), 'income'),
        createTransaction('3', 3100, 'Salary', new Date('2023-03-15'), 'income'),
      ];

      const insights = service.generateInsights(transactions);
      const variance = insights.filter((i) => i.type === InsightType.INCOME_VARIANCE);

      expect(variance.length).toBe(0);
    });
  });

  describe('detectRecurringExpenses', () => {
    it('should detect recurring expenses', () => {
      const transactions: TransactionData[] = [
        createTransaction('1', 50, 'Lazer', new Date('2023-01-15'), 'expense', 'Netflix'),
        createTransaction('2', 50, 'Lazer', new Date('2023-02-15'), 'expense', 'Netflix'),
        createTransaction('3', 50, 'Lazer', new Date('2023-03-15'), 'expense', 'Netflix'),
      ];

      const insights = service.generateInsights(transactions);
      const recurring = insights.filter((i) => i.type === InsightType.RECURRING_EXPENSE);

      expect(recurring.length).toBeGreaterThan(0);
    });

    it('should limit recurring insights to 5', () => {
      const transactions: TransactionData[] = [];

      for (let i = 0; i < 10; i++) {
        transactions.push(
          createTransaction(`${i}-1`, 50, 'Test', new Date('2023-01-15'), 'expense', `Service${i}`),
          createTransaction(`${i}-2`, 50, 'Test', new Date('2023-02-15'), 'expense', `Service${i}`)
        );
      }

      const insights = service.generateInsights(transactions);
      const recurring = insights.filter((i) => i.type === InsightType.RECURRING_EXPENSE);

      expect(recurring.length).toBeLessThanOrEqual(5);
    });

    it('should not detect single occurrence', () => {
      const transactions: TransactionData[] = [
        createTransaction('1', 50, 'Lazer', new Date(), 'expense', 'Netflix'),
      ];

      const insights = service.generateInsights(transactions);
      const recurring = insights.filter((i) => i.type === InsightType.RECURRING_EXPENSE);

      expect(recurring.length).toBe(0);
    });

    it('should handle transactions without description', () => {
      const transactions: TransactionData[] = [
        createTransaction('1', 50, 'Lazer', new Date(), 'expense'),
        createTransaction('2', 50, 'Lazer', new Date(), 'expense'),
      ];

      const insights = service.generateInsights(transactions);
      // Should not crash, recurring detection requires description
      expect(insights).toBeDefined();
    });

    it('should group by similar description and amount', () => {
      const transactions: TransactionData[] = [
        createTransaction('1', 50, 'Test', new Date('2023-01-15'), 'expense', 'Netflix'),
        createTransaction('2', 50, 'Test', new Date('2023-02-15'), 'expense', 'Netflix'),
      ];

      const insights = service.generateInsights(transactions);
      const recurring = insights.filter((i) => i.type === InsightType.RECURRING_EXPENSE);

      expect(recurring.length).toBeGreaterThan(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle mixed income and expense', () => {
      const transactions: TransactionData[] = [
        createTransaction('1', 5000, 'Salary', new Date(), 'income'),
        createTransaction('2', 1000, 'Rent', new Date(), 'expense'),
      ];

      const insights = service.generateInsights(transactions);
      expect(insights).toBeDefined();
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should handle custom period days', () => {
      const transactions: TransactionData[] = [
        createTransaction('1', 100, 'Test', new Date(), 'expense'),
      ];

      const insights = service.generateInsights(transactions, { periodDays: 60 });
      expect(insights).toBeDefined();
    });

    it('should handle all insights types together', () => {
      const now = new Date();
      const lastMonth = new Date(now);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const transactions: TransactionData[] = [
        // Income variance
        createTransaction('i1', 3000, 'Salary', lastMonth, 'income'),
        createTransaction('i2', 5000, 'Salary', now, 'income'),
        // Budget warning
        createTransaction('b1', 950, 'Food', now, 'expense'),
        // Unusual category
        createTransaction('u1', 800, 'Housing', now, 'expense'),
        createTransaction('u2', 100, 'Other', now, 'expense'),
        // Recurring
        createTransaction('r1', 50, 'Subscription', lastMonth, 'expense', 'Netflix'),
        createTransaction('r2', 50, 'Subscription', now, 'expense', 'Netflix'),
      ];

      const budgets = new Map([['Food', 1000]]);
      const insights = service.generateInsights(transactions, { budgets, periodDays: 60 });

      expect(insights.length).toBeGreaterThan(0);

      const types = new Set(insights.map((i) => i.type));
      expect(types.size).toBeGreaterThan(1);
    });
  });
});

function getSeverityWeight(severity: InsightSeverity): number {
  const weights = {
    [InsightSeverity.CRITICAL]: 4,
    [InsightSeverity.ALERT]: 3,
    [InsightSeverity.WARNING]: 2,
    [InsightSeverity.INFO]: 1,
  };
  return weights[severity] || 0;
}
