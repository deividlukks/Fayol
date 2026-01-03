import { HttpCache } from '../src/cache';

describe('HttpCache', () => {
  let cache: HttpCache;

  beforeEach(() => {
    cache = new HttpCache();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('get and set', () => {
    it('should store and retrieve data', () => {
      cache.set('/api/users', { id: 1, name: 'John' }, 60000);

      const result = cache.get('/api/users');

      expect(result).toEqual({ id: 1, name: 'John' });
    });

    it('should return null for non-existent keys', () => {
      const result = cache.get('/api/nonexistent');

      expect(result).toBeNull();
    });

    it('should handle params in cache key', () => {
      const params = { page: 1, limit: 10 };
      cache.set('/api/users', { data: 'with-params' }, 60000, params);

      const result = cache.get('/api/users', params);

      expect(result).toEqual({ data: 'with-params' });
    });

    it('should return null for different params', () => {
      const params1 = { page: 1, limit: 10 };
      const params2 = { page: 2, limit: 10 };

      cache.set('/api/users', { data: 'page-1' }, 60000, params1);

      const result = cache.get('/api/users', params2);

      expect(result).toBeNull();
    });

    it('should use default TTL of 60 seconds', () => {
      cache.set('/api/users', { data: 'test' });

      // Just before TTL expires
      jest.advanceTimersByTime(59999);
      expect(cache.get('/api/users')).toEqual({ data: 'test' });

      // After TTL expires
      jest.advanceTimersByTime(2);
      expect(cache.get('/api/users')).toBeNull();
    });
  });

  describe('expiration', () => {
    it('should return null for expired entries', () => {
      cache.set('/api/users', { data: 'test' }, 5000);

      // Advance time past TTL
      jest.advanceTimersByTime(5001);

      const result = cache.get('/api/users');

      expect(result).toBeNull();
    });

    it('should return data before expiration', () => {
      cache.set('/api/users', { data: 'test' }, 5000);

      // Advance time but not past TTL
      jest.advanceTimersByTime(4999);

      const result = cache.get('/api/users');

      expect(result).toEqual({ data: 'test' });
    });

    it('should clean up expired entries on get', () => {
      cache.set('/api/users', { data: 'test' }, 5000);

      jest.advanceTimersByTime(6000);

      cache.get('/api/users');

      // Try to get again - should still be null
      expect(cache.get('/api/users')).toBeNull();
    });
  });

  describe('delete', () => {
    it('should remove specific entry', () => {
      cache.set('/api/users', { data: 'test' }, 60000);
      cache.delete('/api/users');

      const result = cache.get('/api/users');

      expect(result).toBeNull();
    });

    it('should handle delete with params', () => {
      const params = { page: 1 };
      cache.set('/api/users', { data: 'test' }, 60000, params);
      cache.delete('/api/users', params);

      const result = cache.get('/api/users', params);

      expect(result).toBeNull();
    });

    it('should not affect other entries', () => {
      cache.set('/api/users', { data: 'users' }, 60000);
      cache.set('/api/posts', { data: 'posts' }, 60000);

      cache.delete('/api/users');

      expect(cache.get('/api/users')).toBeNull();
      expect(cache.get('/api/posts')).toEqual({ data: 'posts' });
    });
  });

  describe('invalidatePattern', () => {
    it('should remove all entries matching pattern', () => {
      cache.set('/api/users/1', { id: 1 }, 60000);
      cache.set('/api/users/2', { id: 2 }, 60000);
      cache.set('/api/posts/1', { id: 1 }, 60000);

      cache.invalidatePattern('users');

      expect(cache.get('/api/users/1')).toBeNull();
      expect(cache.get('/api/users/2')).toBeNull();
      expect(cache.get('/api/posts/1')).toEqual({ id: 1 });
    });

    it('should handle pattern with no matches', () => {
      cache.set('/api/users', { data: 'test' }, 60000);

      cache.invalidatePattern('posts');

      expect(cache.get('/api/users')).toEqual({ data: 'test' });
    });

    it('should invalidate entries with params', () => {
      cache.set('/api/users', { data: 'test' }, 60000, { page: 1 });
      cache.set('/api/users', { data: 'test2' }, 60000, { page: 2 });

      cache.invalidatePattern('users');

      expect(cache.get('/api/users', { page: 1 })).toBeNull();
      expect(cache.get('/api/users', { page: 2 })).toBeNull();
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cache.set('/api/users', { data: 'users' }, 60000);
      cache.set('/api/posts', { data: 'posts' }, 60000);
      cache.set('/api/comments', { data: 'comments' }, 60000);

      cache.clear();

      expect(cache.get('/api/users')).toBeNull();
      expect(cache.get('/api/posts')).toBeNull();
      expect(cache.get('/api/comments')).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should remove only expired entries', () => {
      cache.set('/api/expired1', { data: 'exp1' }, 5000);
      cache.set('/api/expired2', { data: 'exp2' }, 5000);
      cache.set('/api/valid', { data: 'valid' }, 60000);

      jest.advanceTimersByTime(6000);

      cache.cleanup();

      expect(cache.get('/api/expired1')).toBeNull();
      expect(cache.get('/api/expired2')).toBeNull();
      expect(cache.get('/api/valid')).toEqual({ data: 'valid' });
    });

    it('should not remove entries within TTL', () => {
      cache.set('/api/users', { data: 'test' }, 60000);

      jest.advanceTimersByTime(30000);

      cache.cleanup();

      expect(cache.get('/api/users')).toEqual({ data: 'test' });
    });
  });

  describe('complex data types', () => {
    it('should handle arrays', () => {
      const data = [1, 2, 3, 4, 5];
      cache.set('/api/numbers', data, 60000);

      expect(cache.get('/api/numbers')).toEqual(data);
    });

    it('should handle nested objects', () => {
      const data = {
        user: { id: 1, name: 'John', roles: ['admin', 'user'] },
        meta: { count: 10, page: 1 },
      };
      cache.set('/api/data', data, 60000);

      expect(cache.get('/api/data')).toEqual(data);
    });

    it('should handle null values', () => {
      cache.set('/api/null', null, 60000);

      expect(cache.get('/api/null')).toBeNull();
    });
  });
});
