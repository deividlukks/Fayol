import { ArrayUtils } from '../src/array';

describe('ArrayUtils', () => {
  describe('unique', () => {
    it('should remove duplicates', () => {
      expect(ArrayUtils.unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    });

    it('should handle empty array', () => {
      expect(ArrayUtils.unique([])).toEqual([]);
    });

    it('should handle array with no duplicates', () => {
      expect(ArrayUtils.unique([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it('should handle strings', () => {
      expect(ArrayUtils.unique(['a', 'b', 'a'])).toEqual(['a', 'b']);
    });
  });

  describe('uniqueBy', () => {
    it('should remove duplicates by property', () => {
      const data = [
        { id: 1, name: 'A' },
        { id: 1, name: 'B' },
        { id: 2, name: 'C' },
      ];
      const result = ArrayUtils.uniqueBy(data, 'id');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
    });

    it('should keep first occurrence', () => {
      const data = [
        { id: 1, name: 'A' },
        { id: 1, name: 'B' },
      ];
      const result = ArrayUtils.uniqueBy(data, 'id');
      expect(result[0].name).toBe('A');
    });

    it('should handle empty array', () => {
      expect(ArrayUtils.uniqueBy([], 'id')).toEqual([]);
    });
  });

  describe('groupBy', () => {
    it('should group by property', () => {
      const data = [
        { type: 'a', value: 1 },
        { type: 'a', value: 2 },
        { type: 'b', value: 3 },
      ];
      const result = ArrayUtils.groupBy(data, 'type');
      expect(result.a).toHaveLength(2);
      expect(result.b).toHaveLength(1);
    });

    it('should handle empty array', () => {
      expect(ArrayUtils.groupBy([], 'type')).toEqual({});
    });

    it('should convert keys to strings', () => {
      const data = [
        { id: 1, value: 'a' },
        { id: 2, value: 'b' },
      ];
      const result = ArrayUtils.groupBy(data, 'id');
      expect(result['1']).toBeDefined();
      expect(result['2']).toBeDefined();
    });
  });

  describe('sortBy', () => {
    it('should sort ascending by default', () => {
      const data = [{ val: 3 }, { val: 1 }, { val: 2 }];
      const result = ArrayUtils.sortBy(data, 'val');
      expect(result[0].val).toBe(1);
      expect(result[2].val).toBe(3);
    });

    it('should sort descending', () => {
      const data = [{ val: 3 }, { val: 1 }, { val: 2 }];
      const result = ArrayUtils.sortBy(data, 'val', 'desc');
      expect(result[0].val).toBe(3);
      expect(result[2].val).toBe(1);
    });

    it('should not mutate original array', () => {
      const data = [{ val: 3 }, { val: 1 }];
      const original = [...data];
      ArrayUtils.sortBy(data, 'val');
      expect(data).toEqual(original);
    });

    it('should handle strings', () => {
      const data = [{ name: 'c' }, { name: 'a' }, { name: 'b' }];
      const result = ArrayUtils.sortBy(data, 'name');
      expect(result[0].name).toBe('a');
    });
  });

  describe('chunk', () => {
    it('should split into chunks', () => {
      const result = ArrayUtils.chunk([1, 2, 3, 4, 5], 2);
      expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should handle exact division', () => {
      const result = ArrayUtils.chunk([1, 2, 3, 4], 2);
      expect(result).toEqual([[1, 2], [3, 4]]);
    });

    it('should handle size larger than array', () => {
      const result = ArrayUtils.chunk([1, 2], 5);
      expect(result).toEqual([[1, 2]]);
    });

    it('should handle empty array', () => {
      expect(ArrayUtils.chunk([], 2)).toEqual([]);
    });

    it('should handle size of 1', () => {
      const result = ArrayUtils.chunk([1, 2, 3], 1);
      expect(result).toEqual([[1], [2], [3]]);
    });
  });

  describe('shuffle', () => {
    it('should not mutate original array', () => {
      const data = [1, 2, 3, 4, 5];
      const original = [...data];
      ArrayUtils.shuffle(data);
      expect(data).toEqual(original);
    });

    it('should return array with same length', () => {
      const data = [1, 2, 3, 4, 5];
      const result = ArrayUtils.shuffle(data);
      expect(result.length).toBe(data.length);
    });

    it('should contain same elements', () => {
      const data = [1, 2, 3, 4, 5];
      const result = ArrayUtils.shuffle(data);
      expect(result.sort()).toEqual(data.sort());
    });

    it('should handle empty array', () => {
      expect(ArrayUtils.shuffle([])).toEqual([]);
    });
  });

  describe('sample', () => {
    it('should return single element by default', () => {
      const data = [1, 2, 3, 4, 5];
      const result = ArrayUtils.sample(data);
      expect(result.length).toBe(1);
      expect(data).toContain(result[0]);
    });

    it('should return specified count', () => {
      const data = [1, 2, 3, 4, 5];
      const result = ArrayUtils.sample(data, 3);
      expect(result.length).toBe(3);
    });

    it('should not exceed array length', () => {
      const data = [1, 2, 3];
      const result = ArrayUtils.sample(data, 10);
      expect(result.length).toBe(3);
    });

    it('should handle empty array', () => {
      expect(ArrayUtils.sample([])).toEqual([]);
    });
  });

  describe('sumBy', () => {
    it('should sum numeric property', () => {
      const data = [{ val: 1 }, { val: 2 }, { val: 3 }];
      expect(ArrayUtils.sumBy(data, 'val')).toBe(6);
    });

    it('should ignore non-numeric values', () => {
      const data = [{ val: 1 }, { val: 'text' as any }, { val: 2 }];
      expect(ArrayUtils.sumBy(data, 'val')).toBe(3);
    });

    it('should handle empty array', () => {
      expect(ArrayUtils.sumBy([], 'val')).toBe(0);
    });
  });

  describe('averageBy', () => {
    it('should calculate average', () => {
      const data = [{ val: 1 }, { val: 2 }, { val: 3 }];
      expect(ArrayUtils.averageBy(data, 'val')).toBe(2);
    });

    it('should return 0 for empty array', () => {
      expect(ArrayUtils.averageBy([], 'val')).toBe(0);
    });
  });

  describe('minBy', () => {
    it('should find minimum', () => {
      const data = [{ val: 3 }, { val: 1 }, { val: 2 }];
      const result = ArrayUtils.minBy(data, 'val');
      expect(result?.val).toBe(1);
    });

    it('should return undefined for empty array', () => {
      expect(ArrayUtils.minBy([], 'val')).toBeUndefined();
    });
  });

  describe('maxBy', () => {
    it('should find maximum', () => {
      const data = [{ val: 3 }, { val: 1 }, { val: 2 }];
      const result = ArrayUtils.maxBy(data, 'val');
      expect(result?.val).toBe(3);
    });

    it('should return undefined for empty array', () => {
      expect(ArrayUtils.maxBy([], 'val')).toBeUndefined();
    });
  });

  describe('compact', () => {
    it('should remove falsy values', () => {
      const result = ArrayUtils.compact([1, 0, '', false, null, undefined, 2]);
      expect(result).toEqual([1, 2]);
    });

    it('should keep truthy values', () => {
      const result = ArrayUtils.compact([1, 'text', true, {}]);
      expect(result).toEqual([1, 'text', true, {}]);
    });

    it('should handle empty array', () => {
      expect(ArrayUtils.compact([])).toEqual([]);
    });
  });

  describe('flatten', () => {
    it('should flatten one level', () => {
      const result = ArrayUtils.flatten([1, [2, 3], 4]);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it('should handle already flat array', () => {
      const result = ArrayUtils.flatten([1, 2, 3]);
      expect(result).toEqual([1, 2, 3]);
    });

    it('should handle empty array', () => {
      expect(ArrayUtils.flatten([])).toEqual([]);
    });
  });

  describe('deepFlatten', () => {
    it('should flatten deeply nested array', () => {
      const result = ArrayUtils.deepFlatten([1, [2, [3, [4]]]]);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it('should handle mixed nesting', () => {
      const result = ArrayUtils.deepFlatten([1, [2, 3], [[4]], 5]);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle empty array', () => {
      expect(ArrayUtils.deepFlatten([])).toEqual([]);
    });
  });

  describe('difference', () => {
    it('should return elements in first array only', () => {
      const result = ArrayUtils.difference([1, 2, 3, 4], [2, 4]);
      expect(result).toEqual([1, 3]);
    });

    it('should handle no common elements', () => {
      const result = ArrayUtils.difference([1, 2], [3, 4]);
      expect(result).toEqual([1, 2]);
    });

    it('should handle all common elements', () => {
      const result = ArrayUtils.difference([1, 2], [1, 2]);
      expect(result).toEqual([]);
    });

    it('should handle empty arrays', () => {
      expect(ArrayUtils.difference([], [1, 2])).toEqual([]);
      expect(ArrayUtils.difference([1, 2], [])).toEqual([1, 2]);
    });
  });

  describe('intersection', () => {
    it('should return common elements', () => {
      const result = ArrayUtils.intersection([1, 2, 3], [2, 3, 4]);
      expect(result).toEqual([2, 3]);
    });

    it('should handle no common elements', () => {
      const result = ArrayUtils.intersection([1, 2], [3, 4]);
      expect(result).toEqual([]);
    });

    it('should handle all common elements', () => {
      const result = ArrayUtils.intersection([1, 2], [1, 2]);
      expect(result).toEqual([1, 2]);
    });

    it('should handle empty arrays', () => {
      expect(ArrayUtils.intersection([], [1, 2])).toEqual([]);
      expect(ArrayUtils.intersection([1, 2], [])).toEqual([]);
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty array', () => {
      expect(ArrayUtils.isEmpty([])).toBe(true);
    });

    it('should return false for non-empty array', () => {
      expect(ArrayUtils.isEmpty([1])).toBe(false);
    });

    it('should return true for null', () => {
      expect(ArrayUtils.isEmpty(null as any)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(ArrayUtils.isEmpty(undefined as any)).toBe(true);
    });
  });
});
