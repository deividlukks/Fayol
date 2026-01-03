import { CurrencyUtils } from '../src/currency';

// Mock APP_CONFIG
jest.mock('@fayol/shared-constants', () => ({
  APP_CONFIG: {
    DEFAULT_CURRENCY: 'BRL',
  },
}));

describe('CurrencyUtils', () => {
  describe('format', () => {
    it('should format number to BRL currency', () => {
      const result = CurrencyUtils.format(1250.5);
      expect(result).toMatch(/R\$\s?1\.250,50/);
    });

    it('should format negative numbers', () => {
      const result = CurrencyUtils.format(-500);
      expect(result).toMatch(/-R\$\s?500,00/);
    });

    it('should format zero', () => {
      const result = CurrencyUtils.format(0);
      expect(result).toMatch(/R\$\s?0,00/);
    });

    it('should format decimal numbers correctly', () => {
      const result = CurrencyUtils.format(1234.56);
      expect(result).toMatch(/R\$\s?1\.234,56/);
    });

    it('should format large numbers', () => {
      const result = CurrencyUtils.format(1234567.89);
      expect(result).toMatch(/R\$\s?1\.234\.567,89/);
    });

    it('should use custom currency when provided', () => {
      const result = CurrencyUtils.format(100, 'USD');
      expect(result).toContain('100');
    });

    it('should handle very small numbers', () => {
      const result = CurrencyUtils.format(0.01);
      expect(result).toMatch(/R\$\s?0,01/);
    });

    it('should handle numbers with many decimal places', () => {
      const result = CurrencyUtils.format(10.999);
      expect(result).toContain('11,00');
    });
  });

  describe('parse', () => {
    it('should parse BRL formatted currency', () => {
      const result = CurrencyUtils.parse('R$ 1.250,50');
      expect(result).toBe(1250.5);
    });

    it('should parse currency without spaces', () => {
      const result = CurrencyUtils.parse('R$1.250,50');
      expect(result).toBe(1250.5);
    });

    it('should parse plain numbers', () => {
      const result = CurrencyUtils.parse('1250.50');
      expect(result).toBe(1250.5);
    });

    it('should parse numbers with comma as decimal', () => {
      const result = CurrencyUtils.parse('1250,50');
      expect(result).toBe(1250.5);
    });

    it('should return 0 for empty string', () => {
      const result = CurrencyUtils.parse('');
      expect(result).toBe(0);
    });

    it('should return 0 for invalid input', () => {
      const result = CurrencyUtils.parse('abc');
      expect(result).toBe(0);
    });

    it('should parse negative values', () => {
      const result = CurrencyUtils.parse('-R$ 500,00');
      expect(result).toBe(-500);
    });

    it('should handle values with only currency symbol', () => {
      const result = CurrencyUtils.parse('R$');
      expect(result).toBe(0);
    });

    it('should parse integer values', () => {
      const result = CurrencyUtils.parse('1000');
      expect(result).toBe(1000);
    });

    it('should handle multiple dots and commas', () => {
      const result = CurrencyUtils.parse('1.234.567,89');
      expect(result).toBe(1234567.89);
    });

    it('should handle zero', () => {
      const result = CurrencyUtils.parse('R$ 0,00');
      expect(result).toBe(0);
    });
  });
});
