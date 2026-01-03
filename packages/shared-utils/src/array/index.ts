/**
 * Utilitários para manipulação de arrays
 */

export const ArrayUtils = {
  /**
   * Remove duplicatas de um array
   * @example unique([1, 2, 2, 3]) => [1, 2, 3]
   */
  unique: <T>(array: T[]): T[] => {
    return Array.from(new Set(array));
  },

  /**
   * Remove duplicatas por uma propriedade específica
   * @example uniqueBy([{id: 1}, {id: 1}, {id: 2}], 'id') => [{id: 1}, {id: 2}]
   */
  uniqueBy: <T>(array: T[], key: keyof T): T[] => {
    const seen = new Set();
    return array.filter((item) => {
      const value = item[key];
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  },

  /**
   * Agrupa array por uma propriedade
   * @example groupBy([{type: 'a', value: 1}, {type: 'a', value: 2}], 'type')
   * => { a: [{type: 'a', value: 1}, {type: 'a', value: 2}] }
   */
  groupBy: <T>(array: T[], key: keyof T): Record<string, T[]> => {
    return array.reduce(
      (result, item) => {
        const groupKey = String(item[key]);
        if (!result[groupKey]) {
          result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
      },
      {} as Record<string, T[]>
    );
  },

  /**
   * Ordena array de objetos por uma propriedade
   */
  sortBy: <T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] => {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];

      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  },

  /**
   * Divide array em chunks (pedaços)
   * @example chunk([1, 2, 3, 4, 5], 2) => [[1, 2], [3, 4], [5]]
   */
  chunk: <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  /**
   * Embaralha array (Fisher-Yates shuffle)
   */
  shuffle: <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  /**
   * Retorna elementos aleatórios do array
   */
  sample: <T>(array: T[], count = 1): T[] => {
    const shuffled = ArrayUtils.shuffle(array);
    return shuffled.slice(0, Math.min(count, array.length));
  },

  /**
   * Calcula soma de uma propriedade numérica
   */
  sumBy: <T>(array: T[], key: keyof T): number => {
    return array.reduce((sum, item) => {
      const value = item[key];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  },

  /**
   * Calcula média de uma propriedade numérica
   */
  averageBy: <T>(array: T[], key: keyof T): number => {
    if (array.length === 0) return 0;
    return ArrayUtils.sumBy(array, key) / array.length;
  },

  /**
   * Encontra valor mínimo de uma propriedade
   */
  minBy: <T>(array: T[], key: keyof T): T | undefined => {
    if (array.length === 0) return undefined;
    return array.reduce((min, item) => (item[key] < min[key] ? item : min));
  },

  /**
   * Encontra valor máximo de uma propriedade
   */
  maxBy: <T>(array: T[], key: keyof T): T | undefined => {
    if (array.length === 0) return undefined;
    return array.reduce((max, item) => (item[key] > max[key] ? item : max));
  },

  /**
   * Remove valores falsy do array
   */
  compact: <T>(array: (T | null | undefined | false | '' | 0)[]): T[] => {
    return array.filter(Boolean) as T[];
  },

  /**
   * Achata array aninhado (flatten)
   */
  flatten: <T>(array: (T | T[])[]): T[] => {
    return array.flat() as T[];
  },

  /**
   * Achata profundamente array aninhado
   */
  deepFlatten: <T>(array: unknown[]): T[] => {
    return array.flat(Infinity) as T[];
  },

  /**
   * Retorna diferença entre dois arrays
   */
  difference: <T>(array1: T[], array2: T[]): T[] => {
    return array1.filter((item) => !array2.includes(item));
  },

  /**
   * Retorna interseção entre dois arrays
   */
  intersection: <T>(array1: T[], array2: T[]): T[] => {
    return array1.filter((item) => array2.includes(item));
  },

  /**
   * Verifica se array está vazio
   */
  isEmpty: (array: unknown[]): boolean => {
    return !array || array.length === 0;
  },
};
