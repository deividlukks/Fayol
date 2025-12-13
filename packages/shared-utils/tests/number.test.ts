import { NumberUtils } from '../src/number';

describe('NumberUtils', () => {
  describe('random', () => {
    it('should generate number within range', () => {
      const result = NumberUtils.random(1, 10);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
    });

    it('should include min and max', () => {
      const results = new Set();
      for (let i = 0; i < 100; i++) {
        results.add(NumberUtils.random(1, 2));
      }
      expect(results.has(1)).toBe(true);
      expect(results.has(2)).toBe(true);
    });

    it('should handle same min and max', () => {
      const result = NumberUtils.random(5, 5);
      expect(result).toBe(5);
    });

    it('should handle negative range', () => {
      const result = NumberUtils.random(-10, -1);
      expect(result).toBeGreaterThanOrEqual(-10);
      expect(result).toBeLessThanOrEqual(-1);
    });

    it('should return integer', () => {
      const result = NumberUtils.random(1, 100);
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  describe('clamp', () => {
    it('should return value within range', () => {
      expect(NumberUtils.clamp(5, 0, 10)).toBe(5);
    });

    it('should clamp to max', () => {
      expect(NumberUtils.clamp(15, 0, 10)).toBe(10);
    });

    it('should clamp to min', () => {
      expect(NumberUtils.clamp(-5, 0, 10)).toBe(0);
    });

    it('should handle value equal to min', () => {
      expect(NumberUtils.clamp(0, 0, 10)).toBe(0);
    });

    it('should handle value equal to max', () => {
      expect(NumberUtils.clamp(10, 0, 10)).toBe(10);
    });

    it('should handle negative ranges', () => {
      expect(NumberUtils.clamp(-5, -10, -1)).toBe(-5);
    });
  });

  describe('round', () => {
    it('should round to integer by default', () => {
      expect(NumberUtils.round(3.7)).toBe(4);
    });

    it('should round to specified decimals', () => {
      expect(NumberUtils.round(3.14159, 2)).toBe(3.14);
    });

    it('should round up', () => {
      expect(NumberUtils.round(3.5)).toBe(4);
    });

    it('should round down', () => {
      expect(NumberUtils.round(3.4)).toBe(3);
    });

    it('should handle negative numbers', () => {
      expect(NumberUtils.round(-3.7)).toBe(-4);
    });

    it('should handle zero decimals explicitly', () => {
      expect(NumberUtils.round(3.7, 0)).toBe(4);
    });

    it('should handle multiple decimal places', () => {
      expect(NumberUtils.round(3.14159, 4)).toBe(3.1416);
    });
  });

  describe('ceil', () => {
    it('should ceil to integer by default', () => {
      expect(NumberUtils.ceil(3.1)).toBe(4);
    });

    it('should ceil to specified decimals', () => {
      expect(NumberUtils.ceil(3.141, 2)).toBe(3.15);
    });

    it('should handle negative numbers', () => {
      expect(NumberUtils.ceil(-3.1)).toBe(-3);
    });

    it('should handle exact values', () => {
      expect(NumberUtils.ceil(3.0)).toBe(3);
    });
  });

  describe('floor', () => {
    it('should floor to integer by default', () => {
      expect(NumberUtils.floor(3.9)).toBe(3);
    });

    it('should floor to specified decimals', () => {
      expect(NumberUtils.floor(3.149, 2)).toBe(3.14);
    });

    it('should handle negative numbers', () => {
      expect(NumberUtils.floor(-3.1)).toBe(-4);
    });

    it('should handle exact values', () => {
      expect(NumberUtils.floor(3.0)).toBe(3);
    });
  });

  describe('format', () => {
    it('should format with default locale', () => {
      const result = NumberUtils.format(1000000);
      expect(result).toBe('1.000.000');
    });

    it('should format with specified locale', () => {
      const result = NumberUtils.format(1000000, 'en-US');
      expect(result).toBe('1,000,000');
    });

    it('should handle decimals', () => {
      const result = NumberUtils.format(1234.56);
      expect(result).toContain('1.234');
    });

    it('should handle negative numbers', () => {
      const result = NumberUtils.format(-1000);
      expect(result).toContain('-');
    });

    it('should handle zero', () => {
      const result = NumberUtils.format(0);
      expect(result).toBe('0');
    });
  });

  describe('toPercent', () => {
    it('should convert to percentage', () => {
      expect(NumberUtils.toPercent(0.5)).toBe('50%');
    });

    it('should handle decimals', () => {
      expect(NumberUtils.toPercent(0.333, 2)).toBe('33.3%');
    });

    it('should handle 0', () => {
      expect(NumberUtils.toPercent(0)).toBe('0%');
    });

    it('should handle 1', () => {
      expect(NumberUtils.toPercent(1)).toBe('100%');
    });

    it('should handle values > 1', () => {
      expect(NumberUtils.toPercent(1.5)).toBe('150%');
    });

    it('should handle negative values', () => {
      expect(NumberUtils.toPercent(-0.5)).toBe('-50%');
    });
  });

  describe('isEven', () => {
    it('should return true for even numbers', () => {
      expect(NumberUtils.isEven(2)).toBe(true);
      expect(NumberUtils.isEven(4)).toBe(true);
      expect(NumberUtils.isEven(0)).toBe(true);
    });

    it('should return false for odd numbers', () => {
      expect(NumberUtils.isEven(1)).toBe(false);
      expect(NumberUtils.isEven(3)).toBe(false);
    });

    it('should handle negative numbers', () => {
      expect(NumberUtils.isEven(-2)).toBe(true);
      expect(NumberUtils.isEven(-3)).toBe(false);
    });
  });

  describe('isOdd', () => {
    it('should return true for odd numbers', () => {
      expect(NumberUtils.isOdd(1)).toBe(true);
      expect(NumberUtils.isOdd(3)).toBe(true);
    });

    it('should return false for even numbers', () => {
      expect(NumberUtils.isOdd(2)).toBe(false);
      expect(NumberUtils.isOdd(4)).toBe(false);
      expect(NumberUtils.isOdd(0)).toBe(false);
    });

    it('should handle negative numbers', () => {
      expect(NumberUtils.isOdd(-1)).toBe(true);
      expect(NumberUtils.isOdd(-2)).toBe(false);
    });
  });

  describe('isPositive', () => {
    it('should return true for positive numbers', () => {
      expect(NumberUtils.isPositive(1)).toBe(true);
      expect(NumberUtils.isPositive(0.1)).toBe(true);
    });

    it('should return false for zero', () => {
      expect(NumberUtils.isPositive(0)).toBe(false);
    });

    it('should return false for negative numbers', () => {
      expect(NumberUtils.isPositive(-1)).toBe(false);
    });
  });

  describe('isNegative', () => {
    it('should return true for negative numbers', () => {
      expect(NumberUtils.isNegative(-1)).toBe(true);
      expect(NumberUtils.isNegative(-0.1)).toBe(true);
    });

    it('should return false for zero', () => {
      expect(NumberUtils.isNegative(0)).toBe(false);
    });

    it('should return false for positive numbers', () => {
      expect(NumberUtils.isNegative(1)).toBe(false);
    });
  });

  describe('average', () => {
    it('should calculate average', () => {
      expect(NumberUtils.average([1, 2, 3, 4, 5])).toBe(3);
    });

    it('should handle decimals', () => {
      expect(NumberUtils.average([1, 2, 3])).toBe(2);
    });

    it('should handle empty array', () => {
      expect(NumberUtils.average([])).toBe(0);
    });

    it('should handle single value', () => {
      expect(NumberUtils.average([5])).toBe(5);
    });

    it('should handle negative numbers', () => {
      expect(NumberUtils.average([-1, 0, 1])).toBe(0);
    });
  });

  describe('min', () => {
    it('should find minimum', () => {
      expect(NumberUtils.min([3, 1, 4, 1, 5])).toBe(1);
    });

    it('should handle negative numbers', () => {
      expect(NumberUtils.min([1, -5, 3])).toBe(-5);
    });

    it('should handle single value', () => {
      expect(NumberUtils.min([5])).toBe(5);
    });
  });

  describe('max', () => {
    it('should find maximum', () => {
      expect(NumberUtils.max([3, 1, 4, 1, 5])).toBe(5);
    });

    it('should handle negative numbers', () => {
      expect(NumberUtils.max([-1, -5, -3])).toBe(-1);
    });

    it('should handle single value', () => {
      expect(NumberUtils.max([5])).toBe(5);
    });
  });

  describe('sum', () => {
    it('should sum array', () => {
      expect(NumberUtils.sum([1, 2, 3, 4, 5])).toBe(15);
    });

    it('should handle empty array', () => {
      expect(NumberUtils.sum([])).toBe(0);
    });

    it('should handle negative numbers', () => {
      expect(NumberUtils.sum([1, -2, 3])).toBe(2);
    });

    it('should handle decimals', () => {
      expect(NumberUtils.sum([0.1, 0.2, 0.3])).toBeCloseTo(0.6);
    });
  });

  describe('formatBytes', () => {
    it('should format 0 bytes', () => {
      expect(NumberUtils.formatBytes(0)).toBe('0 Bytes');
    });

    it('should format bytes', () => {
      expect(NumberUtils.formatBytes(500)).toBe('500 Bytes');
    });

    it('should format KB', () => {
      expect(NumberUtils.formatBytes(1024)).toBe('1 KB');
    });

    it('should format MB', () => {
      expect(NumberUtils.formatBytes(1048576)).toBe('1 MB');
    });

    it('should format GB', () => {
      expect(NumberUtils.formatBytes(1073741824)).toBe('1 GB');
    });

    it('should handle decimals', () => {
      const result = NumberUtils.formatBytes(1536, 2);
      expect(result).toBe('1.5 KB');
    });

    it('should use custom decimal places', () => {
      const result = NumberUtils.formatBytes(1536, 0);
      expect(result).toBe('2 KB');
    });
  });

  describe('lerp', () => {
    it('should interpolate at 0%', () => {
      expect(NumberUtils.lerp(0, 100, 0)).toBe(0);
    });

    it('should interpolate at 50%', () => {
      expect(NumberUtils.lerp(0, 100, 0.5)).toBe(50);
    });

    it('should interpolate at 100%', () => {
      expect(NumberUtils.lerp(0, 100, 1)).toBe(100);
    });

    it('should handle negative range', () => {
      expect(NumberUtils.lerp(-100, 100, 0.5)).toBe(0);
    });

    it('should extrapolate beyond 100%', () => {
      expect(NumberUtils.lerp(0, 100, 1.5)).toBe(150);
    });
  });

  describe('inverseLerp', () => {
    it('should calculate percentage at min', () => {
      expect(NumberUtils.inverseLerp(0, 100, 0)).toBe(0);
    });

    it('should calculate percentage at middle', () => {
      expect(NumberUtils.inverseLerp(0, 100, 50)).toBe(0.5);
    });

    it('should calculate percentage at max', () => {
      expect(NumberUtils.inverseLerp(0, 100, 100)).toBe(1);
    });

    it('should handle negative range', () => {
      expect(NumberUtils.inverseLerp(-100, 100, 0)).toBe(0.5);
    });

    it('should handle values outside range', () => {
      expect(NumberUtils.inverseLerp(0, 100, 150)).toBe(1.5);
    });
  });
});
