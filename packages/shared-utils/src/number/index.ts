/**
 * Utilitários para manipulação de números
 */

export const NumberUtils = {
  /**
   * Gera número aleatório entre min e max (inclusivo)
   */
  random: (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * Limita número dentro de um range
   * @example clamp(15, 0, 10) => 10
   */
  clamp: (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
  },

  /**
   * Arredonda para N casas decimais
   * @example round(3.14159, 2) => 3.14
   */
  round: (value: number, decimals = 0): number => {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  },

  /**
   * Arredonda para cima com N casas decimais
   */
  ceil: (value: number, decimals = 0): number => {
    const factor = Math.pow(10, decimals);
    return Math.ceil(value * factor) / factor;
  },

  /**
   * Arredonda para baixo com N casas decimais
   */
  floor: (value: number, decimals = 0): number => {
    const factor = Math.pow(10, decimals);
    return Math.floor(value * factor) / factor;
  },

  /**
   * Formata número com separador de milhares
   * @example format(1000000) => '1.000.000'
   */
  format: (value: number, locale = 'pt-BR'): string => {
    return new Intl.NumberFormat(locale).format(value);
  },

  /**
   * Converte para porcentagem
   * @example toPercent(0.5, 0) => '50%'
   */
  toPercent: (value: number, decimals = 0): string => {
    return `${NumberUtils.round(value * 100, decimals)}%`;
  },

  /**
   * Verifica se número é par
   */
  isEven: (value: number): boolean => {
    return value % 2 === 0;
  },

  /**
   * Verifica se número é ímpar
   */
  isOdd: (value: number): boolean => {
    return value % 2 !== 0;
  },

  /**
   * Verifica se número é positivo
   */
  isPositive: (value: number): boolean => {
    return value > 0;
  },

  /**
   * Verifica se número é negativo
   */
  isNegative: (value: number): boolean => {
    return value < 0;
  },

  /**
   * Calcula média de array de números
   */
  average: (numbers: number[]): number => {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  },

  /**
   * Retorna menor número de um array
   */
  min: (numbers: number[]): number => {
    return Math.min(...numbers);
  },

  /**
   * Retorna maior número de um array
   */
  max: (numbers: number[]): number => {
    return Math.max(...numbers);
  },

  /**
   * Soma array de números
   */
  sum: (numbers: number[]): number => {
    return numbers.reduce((sum, num) => sum + num, 0);
  },

  /**
   * Converte bytes para formato legível
   * @example formatBytes(1024) => '1 KB'
   */
  formatBytes: (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
  },

  /**
   * Interpola valor entre min e max baseado em percentage (0 a 1)
   * @example lerp(0, 100, 0.5) => 50
   */
  lerp: (min: number, max: number, percentage: number): number => {
    return min + (max - min) * percentage;
  },

  /**
   * Calcula porcentagem inversa (de valor para 0-1)
   * @example inverseLerp(0, 100, 50) => 0.5
   */
  inverseLerp: (min: number, max: number, value: number): number => {
    return (value - min) / (max - min);
  },
};
