import { DateUtils } from '../src/date';

describe('DateUtils', () => {
  describe('formatDate', () => {
    it('should format Date object to dd/MM/yyyy', () => {
      const date = new Date('2023-12-25T10:30:00');
      const result = DateUtils.formatDate(date);
      expect(result).toBe('25/12/2023');
    });

    it('should format ISO string to dd/MM/yyyy', () => {
      const result = DateUtils.formatDate('2023-01-15T12:00:00Z');
      // Account for timezone differences - just check the format is correct
      expect(result).toMatch(/\d{2}\/01\/2023/);
    });

    it('should handle different months', () => {
      const date = new Date('2023-06-05T10:30:00');
      const result = DateUtils.formatDate(date);
      expect(result).toBe('05/06/2023');
    });

    it('should pad single digits', () => {
      const date = new Date('2023-01-01T10:30:00');
      const result = DateUtils.formatDate(date);
      expect(result).toBe('01/01/2023');
    });
  });

  describe('formatDateTime', () => {
    it('should format Date with time', () => {
      const date = new Date('2023-12-25T14:30:00');
      const result = DateUtils.formatDateTime(date);
      expect(result).toBe('25/12/2023 às 14:30');
    });

    it('should format ISO string with time', () => {
      const result = DateUtils.formatDateTime('2023-01-15T09:45:00Z');
      expect(result).toContain('às');
    });

    it('should handle midnight', () => {
      const date = new Date('2023-12-25T00:00:00');
      const result = DateUtils.formatDateTime(date);
      expect(result).toContain('00:00');
    });

    it('should handle noon', () => {
      const date = new Date('2023-12-25T12:00:00');
      const result = DateUtils.formatDateTime(date);
      expect(result).toContain('12:00');
    });
  });

  describe('toISO', () => {
    it('should convert Date to ISO string', () => {
      const date = new Date('2023-12-25T10:30:00Z');
      const result = DateUtils.toISO(date);
      expect(result).toContain('2023-12-25');
      expect(result).toContain('T');
      expect(result).toContain('Z');
    });

    it('should return valid ISO 8601 format', () => {
      const date = new Date('2023-01-01T00:00:00Z');
      const result = DateUtils.toISO(date);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('getStartOfMonth', () => {
    it('should return first day of current month when no date provided', () => {
      const result = DateUtils.getStartOfMonth();
      expect(result.getDate()).toBe(1);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });

    it('should return first day of specified month', () => {
      const date = new Date('2023-06-15T10:30:00');
      const result = DateUtils.getStartOfMonth(date);
      expect(result.getDate()).toBe(1);
      expect(result.getMonth()).toBe(5); // June (0-indexed)
      expect(result.getFullYear()).toBe(2023);
    });

    it('should reset time to midnight', () => {
      const date = new Date('2023-12-25T23:59:59');
      const result = DateUtils.getStartOfMonth(date);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });
  });

  describe('getEndOfMonth', () => {
    it('should return last day of current month when no date provided', () => {
      const result = DateUtils.getEndOfMonth();
      expect(result.getDate()).toBeGreaterThanOrEqual(28);
      expect(result.getDate()).toBeLessThanOrEqual(31);
    });

    it('should return last day of specified month', () => {
      const date = new Date('2023-02-15T10:30:00');
      const result = DateUtils.getEndOfMonth(date);
      expect(result.getDate()).toBe(28); // Feb 2023
      expect(result.getMonth()).toBe(1); // February (0-indexed)
    });

    it('should handle leap year', () => {
      const date = new Date('2024-02-15T10:30:00');
      const result = DateUtils.getEndOfMonth(date);
      expect(result.getDate()).toBe(29); // Feb 2024 (leap year)
    });

    it('should handle 31-day months', () => {
      const date = new Date('2023-12-15T10:30:00');
      const result = DateUtils.getEndOfMonth(date);
      expect(result.getDate()).toBe(31);
    });

    it('should handle 30-day months', () => {
      const date = new Date('2023-06-15T10:30:00');
      const result = DateUtils.getEndOfMonth(date);
      expect(result.getDate()).toBe(30);
    });
  });

  describe('addDays', () => {
    it('should add days correctly', () => {
      const date = new Date('2023-01-01T00:00:00');
      const result = DateUtils.addDays(date, 5);
      expect(result.getDate()).toBe(6);
    });

    it('should handle month overflow', () => {
      const date = new Date('2023-01-30T00:00:00');
      const result = DateUtils.addDays(date, 5);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(4);
    });
  });

  describe('subDays', () => {
    it('should subtract days correctly', () => {
      const date = new Date('2023-01-10T00:00:00');
      const result = DateUtils.subDays(date, 5);
      expect(result.getDate()).toBe(5);
    });

    it('should handle month underflow', () => {
      const date = new Date('2023-02-03T00:00:00');
      const result = DateUtils.subDays(date, 5);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(29);
    });
  });

  describe('isAfter', () => {
    it('should return true if first date is after second', () => {
      const date1 = new Date('2023-12-25T00:00:00');
      const date2 = new Date('2023-12-20T00:00:00');
      expect(DateUtils.isAfter(date1, date2)).toBe(true);
    });

    it('should return false if first date is before second', () => {
      const date1 = new Date('2023-12-20T00:00:00');
      const date2 = new Date('2023-12-25T00:00:00');
      expect(DateUtils.isAfter(date1, date2)).toBe(false);
    });

    it('should return false if dates are equal', () => {
      const date = new Date('2023-12-25T00:00:00');
      expect(DateUtils.isAfter(date, date)).toBe(false);
    });
  });

  describe('isBefore', () => {
    it('should return true if first date is before second', () => {
      const date1 = new Date('2023-12-20T00:00:00');
      const date2 = new Date('2023-12-25T00:00:00');
      expect(DateUtils.isBefore(date1, date2)).toBe(true);
    });

    it('should return false if first date is after second', () => {
      const date1 = new Date('2023-12-25T00:00:00');
      const date2 = new Date('2023-12-20T00:00:00');
      expect(DateUtils.isBefore(date1, date2)).toBe(false);
    });

    it('should return false if dates are equal', () => {
      const date = new Date('2023-12-25T00:00:00');
      expect(DateUtils.isBefore(date, date)).toBe(false);
    });
  });
});
