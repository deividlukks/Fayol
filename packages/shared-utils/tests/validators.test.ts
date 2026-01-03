import { Validators } from '../src/validators';

describe('Validators', () => {
  describe('cpf', () => {
    it('should validate correct CPF', () => {
      expect(Validators.cpf('12345678909')).toBe(true);
    });

    it('should validate formatted CPF', () => {
      expect(Validators.cpf('123.456.789-09')).toBe(true);
    });

    it('should reject invalid CPF', () => {
      expect(Validators.cpf('12345678901')).toBe(false);
    });

    it('should reject CPF with wrong length', () => {
      expect(Validators.cpf('123456789')).toBe(false);
    });

    it('should reject sequential digits', () => {
      expect(Validators.cpf('11111111111')).toBe(false);
      expect(Validators.cpf('00000000000')).toBe(false);
      expect(Validators.cpf('99999999999')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(Validators.cpf('')).toBe(false);
    });

    it('should reject CPF with letters', () => {
      expect(Validators.cpf('abc.def.ghi-jk')).toBe(false);
    });
  });

  describe('cnpj', () => {
    it('should validate correct CNPJ', () => {
      expect(Validators.cnpj('11222333000181')).toBe(true);
    });

    it('should validate formatted CNPJ', () => {
      expect(Validators.cnpj('11.222.333/0001-81')).toBe(true);
    });

    it('should reject invalid CNPJ', () => {
      expect(Validators.cnpj('11222333000199')).toBe(false);
    });

    it('should reject CNPJ with wrong length', () => {
      expect(Validators.cnpj('112223330001')).toBe(false);
    });

    it('should reject sequential digits', () => {
      expect(Validators.cnpj('11111111111111')).toBe(false);
      expect(Validators.cnpj('00000000000000')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(Validators.cnpj('')).toBe(false);
    });
  });

  describe('email', () => {
    it('should validate correct email', () => {
      expect(Validators.email('test@example.com')).toBe(true);
    });

    it('should validate email with subdomain', () => {
      expect(Validators.email('user@mail.example.com')).toBe(true);
    });

    it('should validate email with numbers', () => {
      expect(Validators.email('user123@example.com')).toBe(true);
    });

    it('should validate email with dots', () => {
      expect(Validators.email('first.last@example.com')).toBe(true);
    });

    it('should reject email without @', () => {
      expect(Validators.email('userexample.com')).toBe(false);
    });

    it('should reject email without domain', () => {
      expect(Validators.email('user@')).toBe(false);
    });

    it('should reject email without local part', () => {
      expect(Validators.email('@example.com')).toBe(false);
    });

    it('should reject email with spaces', () => {
      expect(Validators.email('user @example.com')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(Validators.email('')).toBe(false);
    });

    it('should reject email without TLD', () => {
      expect(Validators.email('user@example')).toBe(false);
    });
  });

  describe('phone', () => {
    it('should validate cellphone with 11 digits', () => {
      expect(Validators.phone('11987654321')).toBe(true);
    });

    it('should validate landline with 10 digits', () => {
      expect(Validators.phone('1133334444')).toBe(true);
    });

    it('should validate formatted phone', () => {
      expect(Validators.phone('(11) 98765-4321')).toBe(true);
    });

    it('should reject phone with wrong length', () => {
      expect(Validators.phone('119876543')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(Validators.phone('')).toBe(false);
    });
  });

  describe('url', () => {
    it('should validate http URL', () => {
      expect(Validators.url('http://example.com')).toBe(true);
    });

    it('should validate https URL', () => {
      expect(Validators.url('https://example.com')).toBe(true);
    });

    it('should validate URL with path', () => {
      expect(Validators.url('https://example.com/path/to/page')).toBe(true);
    });

    it('should validate URL with query params', () => {
      expect(Validators.url('https://example.com?param=value')).toBe(true);
    });

    it('should reject invalid URL', () => {
      expect(Validators.url('not a url')).toBe(false);
    });

    it('should reject URL without protocol', () => {
      expect(Validators.url('example.com')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(Validators.url('')).toBe(false);
    });
  });

  describe('number', () => {
    it('should validate integer', () => {
      expect(Validators.number(123)).toBe(true);
    });

    it('should validate float', () => {
      expect(Validators.number(123.45)).toBe(true);
    });

    it('should validate zero', () => {
      expect(Validators.number(0)).toBe(true);
    });

    it('should validate negative number', () => {
      expect(Validators.number(-123)).toBe(true);
    });

    it('should reject NaN', () => {
      expect(Validators.number(NaN)).toBe(false);
    });

    it('should reject Infinity', () => {
      expect(Validators.number(Infinity)).toBe(false);
    });

    it('should reject string', () => {
      expect(Validators.number('123' as any)).toBe(false);
    });
  });

  describe('integer', () => {
    it('should validate integer', () => {
      expect(Validators.integer(123)).toBe(true);
    });

    it('should validate zero', () => {
      expect(Validators.integer(0)).toBe(true);
    });

    it('should validate negative integer', () => {
      expect(Validators.integer(-123)).toBe(true);
    });

    it('should reject float', () => {
      expect(Validators.integer(123.45)).toBe(false);
    });

    it('should reject string', () => {
      expect(Validators.integer('123' as any)).toBe(false);
    });
  });

  describe('range', () => {
    it('should validate number in range', () => {
      expect(Validators.range(50, 0, 100)).toBe(true);
    });

    it('should validate number at min boundary', () => {
      expect(Validators.range(0, 0, 100)).toBe(true);
    });

    it('should validate number at max boundary', () => {
      expect(Validators.range(100, 0, 100)).toBe(true);
    });

    it('should reject number below min', () => {
      expect(Validators.range(-1, 0, 100)).toBe(false);
    });

    it('should reject number above max', () => {
      expect(Validators.range(101, 0, 100)).toBe(false);
    });
  });

  describe('length', () => {
    it('should validate string within range', () => {
      expect(Validators.length('hello', 3, 10)).toBe(true);
    });

    it('should validate string at min length', () => {
      expect(Validators.length('abc', 3, 10)).toBe(true);
    });

    it('should validate string at max length', () => {
      expect(Validators.length('1234567890', 3, 10)).toBe(true);
    });

    it('should reject string below min', () => {
      expect(Validators.length('ab', 3, 10)).toBe(false);
    });

    it('should reject string above max', () => {
      expect(Validators.length('12345678901', 3, 10)).toBe(false);
    });

    it('should validate min only', () => {
      expect(Validators.length('hello', 3)).toBe(true);
    });

    it('should reject below min when max not provided', () => {
      expect(Validators.length('ab', 3)).toBe(false);
    });
  });

  describe('alpha', () => {
    it('should validate letters only', () => {
      expect(Validators.alpha('hello')).toBe(true);
    });

    it('should validate with spaces', () => {
      expect(Validators.alpha('hello world')).toBe(true);
    });

    it('should validate accented characters', () => {
      expect(Validators.alpha('José')).toBe(true);
    });

    it('should reject numbers', () => {
      expect(Validators.alpha('hello123')).toBe(false);
    });

    it('should reject special characters', () => {
      expect(Validators.alpha('hello!')).toBe(false);
    });
  });

  describe('alphanumeric', () => {
    it('should validate letters and numbers', () => {
      expect(Validators.alphanumeric('hello123')).toBe(true);
    });

    it('should validate with spaces', () => {
      expect(Validators.alphanumeric('hello 123')).toBe(true);
    });

    it('should validate accented characters', () => {
      expect(Validators.alphanumeric('José123')).toBe(true);
    });

    it('should reject special characters', () => {
      expect(Validators.alphanumeric('hello123!')).toBe(false);
    });
  });

  describe('strongPassword', () => {
    it('should validate strong password', () => {
      expect(Validators.strongPassword('Pass123@')).toBe(true);
    });

    it('should validate with all requirements', () => {
      expect(Validators.strongPassword('MyP@ssw0rd')).toBe(true);
    });

    it('should reject password without letter', () => {
      expect(Validators.strongPassword('123456@!')).toBe(false);
    });

    it('should reject password without number', () => {
      expect(Validators.strongPassword('Password@')).toBe(false);
    });

    it('should reject password without special char', () => {
      expect(Validators.strongPassword('Password123')).toBe(false);
    });

    it('should reject password too short', () => {
      expect(Validators.strongPassword('Pa1@')).toBe(false);
    });

    it('should validate with various special chars', () => {
      expect(Validators.strongPassword('Pass123$')).toBe(true);
      expect(Validators.strongPassword('Pass123!')).toBe(true);
      expect(Validators.strongPassword('Pass123#')).toBe(true);
    });
  });
});
