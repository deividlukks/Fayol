/**
 * Utilitários para manipulação de strings
 */

export const StringUtils = {
  /**
   * Capitaliza a primeira letra de uma string
   * @example capitalize('hello') => 'Hello'
   */
  capitalize: (value: string): string => {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  },

  /**
   * Capitaliza a primeira letra de cada palavra
   * @example titleCase('hello world') => 'Hello World'
   */
  titleCase: (value: string): string => {
    if (!value) return '';
    return value
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },

  /**
   * Converte para snake_case
   * @example toSnakeCase('HelloWorld') => 'hello_world'
   */
  toSnakeCase: (value: string): string => {
    return value
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  },

  /**
   * Converte para camelCase
   * @example toCamelCase('hello_world') => 'helloWorld'
   */
  toCamelCase: (value: string): string => {
    return value.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  },

  /**
   * Converte para kebab-case
   * @example toKebabCase('HelloWorld') => 'hello-world'
   */
  toKebabCase: (value: string): string => {
    return value
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');
  },

  /**
   * Trunca uma string adicionando reticências
   * @example truncate('Hello World', 5) => 'Hello...'
   */
  truncate: (value: string, maxLength: number, suffix = '...'): string => {
    if (value.length <= maxLength) return value;
    return value.substring(0, maxLength - suffix.length) + suffix;
  },

  /**
   * Remove espaços extras (início, fim e duplicados)
   * @example trim('  hello   world  ') => 'hello world'
   */
  trim: (value: string): string => {
    return value.trim().replace(/\s+/g, ' ');
  },

  /**
   * Remove acentos de uma string
   * @example removeAccents('José') => 'Jose'
   */
  removeAccents: (value: string): string => {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  },

  /**
   * Gera slug para URLs
   * @example slugify('Hello World!') => 'hello-world'
   */
  slugify: (value: string): string => {
    return StringUtils.removeAccents(value)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  /**
   * Extrai iniciais de um nome
   * @example getInitials('João da Silva') => 'JS'
   */
  getInitials: (value: string, max = 2): string => {
    return value
      .split(' ')
      .filter((word) => word.length > 0)
      .slice(0, max)
      .map((word) => word.charAt(0).toUpperCase())
      .join('');
  },

  /**
   * Mascara informações sensíveis
   * @example mask('12345678901', 3, 3) => '123*****901'
   */
  mask: (value: string, visibleStart = 0, visibleEnd = 0, maskChar = '*'): string => {
    if (value.length <= visibleStart + visibleEnd) return value;

    const start = value.substring(0, visibleStart);
    const end = value.substring(value.length - visibleEnd);
    const maskLength = value.length - visibleStart - visibleEnd;

    return start + maskChar.repeat(maskLength) + end;
  },

  /**
   * Conta palavras em uma string
   */
  wordCount: (value: string): number => {
    return value.trim().split(/\s+/).filter((word) => word.length > 0).length;
  },

  /**
   * Verifica se string está vazia ou contém apenas espaços
   */
  isEmpty: (value: string | null | undefined): boolean => {
    return !value || value.trim().length === 0;
  },

  /**
   * Gera string aleatória
   */
  random: (length = 10): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
};
