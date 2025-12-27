import { FinancialUtils } from '../src/financial';

describe('FinancialUtils', () => {
  describe('calculateBudgetProgress', () => {
    it('should calculate progress percentage correctly', () => {
      const result = FinancialUtils.calculateBudgetProgress(500, 1000);
      expect(result).toBe(50);
    });

    it('should return 0 when total is 0', () => {
      const result = FinancialUtils.calculateBudgetProgress(100, 0);
      expect(result).toBe(0);
    });

    it('should cap at 100% when spent exceeds total', () => {
      const result = FinancialUtils.calculateBudgetProgress(1500, 1000);
      expect(result).toBe(100);
    });

    it('should handle zero spent', () => {
      const result = FinancialUtils.calculateBudgetProgress(0, 1000);
      expect(result).toBe(0);
    });

    it('should calculate decimal percentages', () => {
      const result = FinancialUtils.calculateBudgetProgress(333, 1000);
      expect(result).toBeCloseTo(33.3, 1);
    });

    it('should handle negative spent values', () => {
      const result = FinancialUtils.calculateBudgetProgress(-100, 1000);
      expect(result).toBe(-10);
    });

    it('should handle equal spent and total', () => {
      const result = FinancialUtils.calculateBudgetProgress(1000, 1000);
      expect(result).toBe(100);
    });

    it('should handle very small numbers', () => {
      const result = FinancialUtils.calculateBudgetProgress(0.5, 1);
      expect(result).toBe(50);
    });
  });

  describe('calculateInstallmentValue', () => {
    it('should divide amount by installments', () => {
      const result = FinancialUtils.calculateInstallmentValue(1000, 10);
      expect(result).toBe(100);
    });

    it('should round to 2 decimal places', () => {
      const result = FinancialUtils.calculateInstallmentValue(100, 3);
      expect(result).toBe(33.33);
    });

    it('should return total when installments is 0', () => {
      const result = FinancialUtils.calculateInstallmentValue(1000, 0);
      expect(result).toBe(1000);
    });

    it('should return total when installments is negative', () => {
      const result = FinancialUtils.calculateInstallmentValue(1000, -5);
      expect(result).toBe(1000);
    });

    it('should handle single installment', () => {
      const result = FinancialUtils.calculateInstallmentValue(1000, 1);
      expect(result).toBe(1000);
    });

    it('should handle decimal amounts', () => {
      const result = FinancialUtils.calculateInstallmentValue(99.99, 3);
      expect(result).toBe(33.33);
    });

    it('should handle zero amount', () => {
      const result = FinancialUtils.calculateInstallmentValue(0, 5);
      expect(result).toBe(0);
    });

    it('should handle many installments', () => {
      const result = FinancialUtils.calculateInstallmentValue(1200, 12);
      expect(result).toBe(100);
    });
  });

  describe('calculateVariation', () => {
    it('should calculate positive variation', () => {
      const result = FinancialUtils.calculateVariation(150, 100);
      expect(result).toBe(50);
    });

    it('should calculate negative variation', () => {
      const result = FinancialUtils.calculateVariation(75, 100);
      expect(result).toBe(-25);
    });

    it('should return 0 when values are equal', () => {
      const result = FinancialUtils.calculateVariation(100, 100);
      expect(result).toBe(0);
    });

    it('should return 100 when previous is 0 and current is positive', () => {
      const result = FinancialUtils.calculateVariation(100, 0);
      expect(result).toBe(100);
    });

    it('should return 0 when both are 0', () => {
      const result = FinancialUtils.calculateVariation(0, 0);
      expect(result).toBe(0);
    });

    it('should handle decimal values', () => {
      const result = FinancialUtils.calculateVariation(125.5, 100);
      expect(result).toBe(25.5);
    });

    it('should handle negative previous value', () => {
      const result = FinancialUtils.calculateVariation(50, -100);
      expect(result).toBe(150);
    });

    it('should handle negative current value', () => {
      const result = FinancialUtils.calculateVariation(-50, 100);
      expect(result).toBe(-150);
    });

    it('should calculate large variations', () => {
      const result = FinancialUtils.calculateVariation(1000, 100);
      expect(result).toBe(900);
    });

    it('should handle very small differences', () => {
      const result = FinancialUtils.calculateVariation(100.01, 100);
      expect(result).toBeCloseTo(0.01);
    });
  });
});
