import { StringUtils } from '../src/string';

describe('StringUtils', () => {
  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(StringUtils.capitalize('hello')).toBe('Hello');
    });

    it('should lowercase rest of string', () => {
      expect(StringUtils.capitalize('HELLO')).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(StringUtils.capitalize('')).toBe('');
    });

    it('should handle single character', () => {
      expect(StringUtils.capitalize('a')).toBe('A');
    });

    it('should handle mixed case', () => {
      expect(StringUtils.capitalize('hELLO')).toBe('Hello');
    });
  });

  describe('titleCase', () => {
    it('should capitalize each word', () => {
      expect(StringUtils.titleCase('hello world')).toBe('Hello World');
    });

    it('should handle single word', () => {
      expect(StringUtils.titleCase('hello')).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(StringUtils.titleCase('')).toBe('');
    });

    it('should handle multiple spaces', () => {
      expect(StringUtils.titleCase('hello  world')).toBe('Hello  World');
    });

    it('should handle all caps', () => {
      expect(StringUtils.titleCase('HELLO WORLD')).toBe('Hello World');
    });
  });

  describe('toSnakeCase', () => {
    it('should convert camelCase to snake_case', () => {
      expect(StringUtils.toSnakeCase('helloWorld')).toBe('hello_world');
    });

    it('should convert PascalCase to snake_case', () => {
      expect(StringUtils.toSnakeCase('HelloWorld')).toBe('hello_world');
    });

    it('should handle single word', () => {
      expect(StringUtils.toSnakeCase('hello')).toBe('hello');
    });

    it('should handle multiple capitals', () => {
      expect(StringUtils.toSnakeCase('XMLParser')).toBe('x_m_l_parser');
    });

    it('should not add leading underscore', () => {
      expect(StringUtils.toSnakeCase('Hello')).toBe('hello');
    });
  });

  describe('toCamelCase', () => {
    it('should convert snake_case to camelCase', () => {
      expect(StringUtils.toCamelCase('hello_world')).toBe('helloWorld');
    });

    it('should handle single word', () => {
      expect(StringUtils.toCamelCase('hello')).toBe('hello');
    });

    it('should handle multiple underscores', () => {
      expect(StringUtils.toCamelCase('hello_world_test')).toBe('helloWorldTest');
    });

    it('should not affect already camelCase', () => {
      expect(StringUtils.toCamelCase('helloWorld')).toBe('helloWorld');
    });
  });

  describe('toKebabCase', () => {
    it('should convert camelCase to kebab-case', () => {
      expect(StringUtils.toKebabCase('helloWorld')).toBe('hello-world');
    });

    it('should convert PascalCase to kebab-case', () => {
      expect(StringUtils.toKebabCase('HelloWorld')).toBe('hello-world');
    });

    it('should handle single word', () => {
      expect(StringUtils.toKebabCase('hello')).toBe('hello');
    });

    it('should not add leading dash', () => {
      expect(StringUtils.toKebabCase('Hello')).toBe('hello');
    });
  });

  describe('truncate', () => {
    it('should truncate long string', () => {
      expect(StringUtils.truncate('Hello World', 5)).toBe('He...');
    });

    it('should not truncate short string', () => {
      expect(StringUtils.truncate('Hello', 10)).toBe('Hello');
    });

    it('should use custom suffix', () => {
      expect(StringUtils.truncate('Hello World', 5, '…')).toBe('Hell…');
    });

    it('should handle empty string', () => {
      expect(StringUtils.truncate('', 5)).toBe('');
    });

    it('should handle exact length', () => {
      expect(StringUtils.truncate('Hello', 5)).toBe('Hello');
    });

    it('should account for suffix length', () => {
      const result = StringUtils.truncate('Hello World Test', 10);
      expect(result.length).toBe(10);
    });
  });

  describe('trim', () => {
    it('should remove leading and trailing spaces', () => {
      expect(StringUtils.trim('  hello  ')).toBe('hello');
    });

    it('should remove duplicate spaces', () => {
      expect(StringUtils.trim('hello  world')).toBe('hello world');
    });

    it('should handle multiple spaces', () => {
      expect(StringUtils.trim('  hello   world  ')).toBe('hello world');
    });

    it('should handle single space', () => {
      expect(StringUtils.trim('hello world')).toBe('hello world');
    });

    it('should handle no spaces', () => {
      expect(StringUtils.trim('hello')).toBe('hello');
    });
  });

  describe('removeAccents', () => {
    it('should remove accents from Portuguese', () => {
      expect(StringUtils.removeAccents('José')).toBe('Jose');
    });

    it('should remove various accents', () => {
      expect(StringUtils.removeAccents('àáâãäåèéêëìíîï')).toBe('aaaaaaeeeeiiii');
    });

    it('should handle no accents', () => {
      expect(StringUtils.removeAccents('hello')).toBe('hello');
    });

    it('should handle mixed content', () => {
      expect(StringUtils.removeAccents('Olá Mundo')).toBe('Ola Mundo');
    });

    it('should preserve other characters', () => {
      expect(StringUtils.removeAccents('José123!@#')).toBe('Jose123!@#');
    });
  });

  describe('slugify', () => {
    it('should create slug from string', () => {
      expect(StringUtils.slugify('Hello World')).toBe('hello-world');
    });

    it('should remove special characters', () => {
      expect(StringUtils.slugify('Hello, World!')).toBe('hello-world');
    });

    it('should remove accents', () => {
      expect(StringUtils.slugify('José da Silva')).toBe('jose-da-silva');
    });

    it('should handle multiple spaces', () => {
      expect(StringUtils.slugify('Hello  World')).toBe('hello-world');
    });

    it('should trim dashes', () => {
      expect(StringUtils.slugify('  Hello World  ')).toBe('hello-world');
    });

    it('should handle underscores', () => {
      expect(StringUtils.slugify('hello_world')).toBe('hello-world');
    });
  });

  describe('getInitials', () => {
    it('should get initials from name', () => {
      expect(StringUtils.getInitials('João Silva')).toBe('JS');
    });

    it('should handle single name', () => {
      expect(StringUtils.getInitials('João')).toBe('J');
    });

    it('should handle three names', () => {
      expect(StringUtils.getInitials('João da Silva')).toBe('JD');
    });

    it('should respect max parameter', () => {
      expect(StringUtils.getInitials('João Pedro Silva', 3)).toBe('JPS');
    });

    it('should handle extra spaces', () => {
      expect(StringUtils.getInitials('João  Silva')).toBe('JS');
    });

    it('should uppercase initials', () => {
      expect(StringUtils.getInitials('joão silva')).toBe('JS');
    });

    it('should handle empty string', () => {
      expect(StringUtils.getInitials('')).toBe('');
    });
  });

  describe('mask', () => {
    it('should mask middle of string', () => {
      expect(StringUtils.mask('12345678901', 3, 3)).toBe('123*****901');
    });

    it('should use custom mask character', () => {
      expect(StringUtils.mask('12345678901', 3, 3, '#')).toBe('123#####901');
    });

    it('should handle minimal masking', () => {
      expect(StringUtils.mask('12345', 2, 2)).toBe('12*45');
    });

    it('should handle full masking', () => {
      expect(StringUtils.mask('12345678901', 0, 0)).toBe('***********');
    });

    it('should handle visible start only', () => {
      expect(StringUtils.mask('12345678901', 3, 0)).toBe('123********');
    });

    it('should handle visible end only', () => {
      expect(StringUtils.mask('12345678901', 0, 3)).toBe('********901');
    });

    it('should not mask if total visible exceeds length', () => {
      expect(StringUtils.mask('12345', 3, 3)).toBe('12345');
    });
  });

  describe('wordCount', () => {
    it('should count words', () => {
      expect(StringUtils.wordCount('hello world')).toBe(2);
    });

    it('should handle single word', () => {
      expect(StringUtils.wordCount('hello')).toBe(1);
    });

    it('should handle multiple spaces', () => {
      expect(StringUtils.wordCount('hello  world')).toBe(2);
    });

    it('should handle leading/trailing spaces', () => {
      expect(StringUtils.wordCount('  hello world  ')).toBe(2);
    });

    it('should handle empty string', () => {
      expect(StringUtils.wordCount('')).toBe(0);
    });

    it('should handle only spaces', () => {
      expect(StringUtils.wordCount('   ')).toBe(0);
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty string', () => {
      expect(StringUtils.isEmpty('')).toBe(true);
    });

    it('should return true for null', () => {
      expect(StringUtils.isEmpty(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(StringUtils.isEmpty(undefined)).toBe(true);
    });

    it('should return true for whitespace', () => {
      expect(StringUtils.isEmpty('   ')).toBe(true);
    });

    it('should return false for non-empty string', () => {
      expect(StringUtils.isEmpty('hello')).toBe(false);
    });

    it('should return false for string with content and spaces', () => {
      expect(StringUtils.isEmpty('  hello  ')).toBe(false);
    });
  });

  describe('random', () => {
    it('should generate string with default length', () => {
      const result = StringUtils.random();
      expect(result.length).toBe(10);
    });

    it('should generate string with custom length', () => {
      const result = StringUtils.random(20);
      expect(result.length).toBe(20);
    });

    it('should generate different strings', () => {
      const str1 = StringUtils.random(10);
      const str2 = StringUtils.random(10);
      expect(str1).not.toBe(str2);
    });

    it('should only contain alphanumeric chars', () => {
      const result = StringUtils.random(100);
      expect(result).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('should handle zero length', () => {
      const result = StringUtils.random(0);
      expect(result).toBe('');
    });

    it('should handle length of 1', () => {
      const result = StringUtils.random(1);
      expect(result.length).toBe(1);
    });
  });
});
