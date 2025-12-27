import { Formatters } from '../src/formatters';

describe('Formatters', () => {
  describe('onlyNumbers', () => {
    it('should remove all non-numeric characters', () => {
      const result = Formatters.onlyNumbers('abc123def456');
      expect(result).toBe('123456');
    });

    it('should handle empty string', () => {
      const result = Formatters.onlyNumbers('');
      expect(result).toBe('');
    });

    it('should remove special characters', () => {
      const result = Formatters.onlyNumbers('123-456.789');
      expect(result).toBe('123456789');
    });

    it('should remove spaces', () => {
      const result = Formatters.onlyNumbers('123 456 789');
      expect(result).toBe('123456789');
    });

    it('should handle string with no numbers', () => {
      const result = Formatters.onlyNumbers('abcdef');
      expect(result).toBe('');
    });

    it('should handle already clean numbers', () => {
      const result = Formatters.onlyNumbers('123456');
      expect(result).toBe('123456');
    });
  });

  describe('cpf', () => {
    it('should format CPF correctly', () => {
      const result = Formatters.cpf('12345678901');
      expect(result).toBe('123.456.789-01');
    });

    it('should handle partially formatted CPF', () => {
      const result = Formatters.cpf('123.456.789-01');
      expect(result).toBe('123.456.789-01');
    });

    it('should handle incomplete CPF', () => {
      const result = Formatters.cpf('12345');
      expect(result).toBe('123.45');
    });

    it('should truncate extra digits', () => {
      const result = Formatters.cpf('123456789012345');
      expect(result).toBe('123.456.789-01');
    });

    it('should handle empty string', () => {
      const result = Formatters.cpf('');
      expect(result).toBe('');
    });

    it('should remove non-numeric characters before formatting', () => {
      const result = Formatters.cpf('abc123def456ghi789jkl01');
      expect(result).toBe('123.456.789-01');
    });

    it('should format 9 digits', () => {
      const result = Formatters.cpf('123456789');
      expect(result).toBe('123.456.789');
    });

    it('should format 6 digits', () => {
      const result = Formatters.cpf('123456');
      expect(result).toBe('123.456');
    });

    it('should format 3 digits', () => {
      const result = Formatters.cpf('123');
      expect(result).toBe('123');
    });
  });

  describe('phone', () => {
    it('should format cellphone with 11 digits', () => {
      const result = Formatters.phone('11987654321');
      expect(result).toBe('(11) 98765-4321');
    });

    it('should handle partially formatted phone', () => {
      const result = Formatters.phone('(11) 98765-4321');
      expect(result).toBe('(11) 98765-4321');
    });

    it('should handle incomplete phone', () => {
      const result = Formatters.phone('11987');
      expect(result).toBe('(11) 987');
    });

    it('should truncate extra digits', () => {
      const result = Formatters.phone('1198765432199999');
      expect(result).toBe('(11) 98765-4321');
    });

    it('should handle empty string', () => {
      const result = Formatters.phone('');
      expect(result).toBe('');
    });

    it('should remove non-numeric characters before formatting', () => {
      const result = Formatters.phone('abc11def98765ghi4321');
      expect(result).toBe('(11) 98765-4321');
    });

    it('should format 2 digits (DDD only)', () => {
      const result = Formatters.phone('11');
      expect(result).toBe('11');
    });

    it('should format 7 digits', () => {
      const result = Formatters.phone('119876543');
      expect(result).toBe('(11) 98765-43');
    });

    it('should format landline (10 digits)', () => {
      const result = Formatters.phone('1133334444');
      expect(result).toBe('(11) 33334-444');
    });
  });
});
