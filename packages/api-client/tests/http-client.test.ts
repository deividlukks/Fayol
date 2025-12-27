import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { HttpClient } from '../src/http-client';
import { STORAGE_KEYS } from '@fayol/shared-constants';

// Create a testable subclass
class TestHttpClient extends HttpClient {
  public async testGet<T>(url: string, config?: any): Promise<T> {
    return this.get(url, config);
  }

  public async testPost<T>(url: string, data?: unknown, config?: any): Promise<T> {
    return this.post(url, data, config);
  }

  public async testPatch<T>(url: string, data?: unknown, config?: any): Promise<T> {
    return this.patch(url, data, config);
  }

  public async testPut<T>(url: string, data?: unknown, config?: any): Promise<T> {
    return this.put(url, data, config);
  }

  public async testDelete<T>(url: string, config?: any): Promise<T> {
    return this.delete(url, config);
  }
}

describe('HttpClient', () => {
  let client: TestHttpClient;
  let mock: MockAdapter;

  beforeEach(() => {
    client = new TestHttpClient({ enableCache: false, enableRetry: false });
    mock = new MockAdapter((client as any).api);
    localStorage.clear();
  });

  afterEach(() => {
    mock.restore();
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      const defaultClient = new HttpClient();

      expect(defaultClient).toBeInstanceOf(HttpClient);
    });

    it('should accept custom baseURL', () => {
      const customClient = new TestHttpClient({
        baseURL: 'https://api.example.com',
      });

      expect((customClient as any).api.defaults.baseURL).toBe('https://api.example.com');
    });

    it('should accept custom timeout', () => {
      const customClient = new TestHttpClient({
        timeout: 5000,
      });

      expect((customClient as any).api.defaults.timeout).toBe(5000);
    });

    it('should enable cache when configured', () => {
      const cachedClient = new TestHttpClient({ enableCache: true });

      expect((cachedClient as any).enableCache).toBe(true);
    });
  });

  describe('token management', () => {
    it('should set token in localStorage', () => {
      client.setToken('test-token');

      expect(localStorage.getItem(STORAGE_KEYS.AUTH.TOKEN)).toBe('test-token');
    });

    it('should get token from localStorage', () => {
      localStorage.setItem(STORAGE_KEYS.AUTH.TOKEN, 'test-token');

      const token = client.getToken();

      expect(token).toBe('test-token');
    });

    it('should return null when token does not exist', () => {
      const token = client.getToken();

      expect(token).toBeNull();
    });

    it('should clear token from localStorage', () => {
      localStorage.setItem(STORAGE_KEYS.AUTH.TOKEN, 'test-token');
      localStorage.setItem(STORAGE_KEYS.AUTH.USER, JSON.stringify({ id: 1 }));

      client.clearToken();

      expect(localStorage.getItem(STORAGE_KEYS.AUTH.TOKEN)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.AUTH.USER)).toBeNull();
    });
  });

  describe('request interceptors', () => {
    it('should inject token in request headers', async () => {
      client.setToken('test-token');
      mock.onGet('/test').reply(200, { data: 'success' });

      await client.testGet('/test');

      expect(mock.history.get[0].headers?.Authorization).toBe('Bearer test-token');
    });

    it('should not inject Authorization header when no token', async () => {
      mock.onGet('/test').reply(200, { data: 'success' });

      await client.testGet('/test');

      expect(mock.history.get[0].headers?.Authorization).toBeUndefined();
    });
  });

  describe('GET requests', () => {
    it('should make GET request', async () => {
      const responseData = { id: 1, name: 'Test' };
      mock.onGet('/users/1').reply(200, responseData);

      const result = await client.testGet('/users/1');

      expect(result).toEqual(responseData);
      expect(mock.history.get).toHaveLength(1);
    });

    it('should pass query params', async () => {
      mock.onGet('/users').reply(200, []);

      await client.testGet('/users', { params: { page: 1, limit: 10 } });

      expect(mock.history.get[0].params).toEqual({ page: 1, limit: 10 });
    });

    it('should handle GET errors', async () => {
      mock.onGet('/users/999').reply(404);

      await expect(client.testGet('/users/999')).rejects.toThrow();
    });
  });

  describe('POST requests', () => {
    it('should make POST request', async () => {
      const requestData = { name: 'New User', email: 'user@test.com' };
      const responseData = { id: 1, ...requestData };
      mock.onPost('/users').reply(201, responseData);

      const result = await client.testPost('/users', requestData);

      expect(result).toEqual(responseData);
      expect(mock.history.post).toHaveLength(1);
      expect(JSON.parse(mock.history.post[0].data)).toEqual(requestData);
    });

    it('should make POST request without data', async () => {
      mock.onPost('/logout').reply(200, { message: 'Success' });

      const result = await client.testPost('/logout');

      expect(result).toEqual({ message: 'Success' });
    });

    it('should handle POST errors', async () => {
      mock.onPost('/users').reply(422);

      await expect(client.testPost('/users', {})).rejects.toThrow();
    });
  });

  describe('PATCH requests', () => {
    it('should make PATCH request', async () => {
      const requestData = { name: 'Updated Name' };
      const responseData = { id: 1, name: 'Updated Name' };
      mock.onPatch('/users/1').reply(200, responseData);

      const result = await client.testPatch('/users/1', requestData);

      expect(result).toEqual(responseData);
      expect(mock.history.patch).toHaveLength(1);
    });

    it('should handle PATCH errors', async () => {
      mock.onPatch('/users/999').reply(404);

      await expect(client.testPatch('/users/999', {})).rejects.toThrow();
    });
  });

  describe('PUT requests', () => {
    it('should make PUT request', async () => {
      const requestData = { id: 1, name: 'Full Update' };
      mock.onPut('/users/1').reply(200, requestData);

      const result = await client.testPut('/users/1', requestData);

      expect(result).toEqual(requestData);
      expect(mock.history.put).toHaveLength(1);
    });
  });

  describe('DELETE requests', () => {
    it('should make DELETE request', async () => {
      mock.onDelete('/users/1').reply(204);

      const result = await client.testDelete('/users/1');

      expect(mock.history.delete).toHaveLength(1);
    });

    it('should handle DELETE with response data', async () => {
      const responseData = { message: 'User deleted' };
      mock.onDelete('/users/1').reply(200, responseData);

      const result = await client.testDelete('/users/1');

      expect(result).toEqual(responseData);
    });
  });

  describe('caching', () => {
    let cachedClient: TestHttpClient;

    beforeEach(() => {
      cachedClient = new TestHttpClient({ enableCache: true, enableRetry: false });
      mock = new MockAdapter((cachedClient as any).api);
    });

    it('should cache GET requests', async () => {
      const responseData = { id: 1, name: 'Test' };
      mock.onGet('/users/1').reply(200, responseData);

      // First request - should hit the API
      const result1 = await cachedClient.testGet('/users/1');
      expect(result1).toEqual(responseData);

      // Second request - should use cache
      const result2 = await cachedClient.testGet('/users/1');
      expect(result2).toEqual(responseData);

      // Should only have made one API call
      expect(mock.history.get).toHaveLength(1);
    });

    it('should cache GET requests with different params separately', async () => {
      mock.onGet('/users').reply(200, []);

      await cachedClient.testGet('/users', { params: { page: 1 } });
      await cachedClient.testGet('/users', { params: { page: 2 } });

      // Different params = different cache keys = 2 API calls
      expect(mock.history.get).toHaveLength(2);
    });

    it('should not cache when Cache-Control header is set', async () => {
      mock.onGet('/users/1').reply(200, { id: 1 });

      await cachedClient.testGet('/users/1', {
        headers: { 'Cache-Control': 'no-cache' },
      });
      await cachedClient.testGet('/users/1', {
        headers: { 'Cache-Control': 'no-cache' },
      });

      expect(mock.history.get).toHaveLength(2);
    });

    it('should invalidate cache on POST', async () => {
      mock.onGet('/users').reply(200, [{ id: 1 }]);
      mock.onPost('/users').reply(201, { id: 2 });

      // GET request - cached
      await cachedClient.testGet('/users');

      // POST request - invalidates cache
      await cachedClient.testPost('/users', { name: 'New User' });

      // GET again - should hit API
      await cachedClient.testGet('/users');

      expect(mock.history.get).toHaveLength(2);
    });

    it('should invalidate cache on PATCH', async () => {
      mock.onGet('/users/1').reply(200, { id: 1, name: 'Old' });
      mock.onPatch('/users/1').reply(200, { id: 1, name: 'New' });

      await cachedClient.testGet('/users/1');
      await cachedClient.testPatch('/users/1', { name: 'New' });
      await cachedClient.testGet('/users/1');

      expect(mock.history.get).toHaveLength(2);
    });

    it('should invalidate cache on PUT', async () => {
      mock.onGet('/users/1').reply(200, { id: 1 });
      mock.onPut('/users/1').reply(200, { id: 1 });

      await cachedClient.testGet('/users/1');
      await cachedClient.testPut('/users/1', { name: 'Updated' });
      await cachedClient.testGet('/users/1');

      expect(mock.history.get).toHaveLength(2);
    });

    it('should invalidate cache on DELETE', async () => {
      mock.onGet('/users').reply(200, [{ id: 1 }]);
      mock.onDelete('/users/1').reply(204);

      await cachedClient.testGet('/users');
      await cachedClient.testDelete('/users/1');
      await cachedClient.testGet('/users');

      expect(mock.history.get).toHaveLength(2);
    });

    it('should clear all cache manually', async () => {
      mock.onGet('/users').reply(200, []);
      mock.onGet('/posts').reply(200, []);

      await cachedClient.testGet('/users');
      await cachedClient.testGet('/posts');

      cachedClient.clearCache();

      await cachedClient.testGet('/users');
      await cachedClient.testGet('/posts');

      expect(mock.history.get).toHaveLength(4);
    });

    it('should invalidate cache by pattern', async () => {
      mock.onGet('/users/1').reply(200, { id: 1 });
      mock.onGet('/users/2').reply(200, { id: 2 });
      mock.onGet('/posts/1').reply(200, { id: 1 });

      await cachedClient.testGet('/users/1');
      await cachedClient.testGet('/users/2');
      await cachedClient.testGet('/posts/1');

      cachedClient.invalidateCache('users');

      await cachedClient.testGet('/users/1');
      await cachedClient.testGet('/users/2');
      await cachedClient.testGet('/posts/1');

      // 3 initial + 2 users re-fetched + 1 posts from cache = 5 total
      expect(mock.history.get).toHaveLength(5);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mock.onGet('/users').networkError();

      await expect(client.testGet('/users')).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      mock.onGet('/users').timeout();

      await expect(client.testGet('/users')).rejects.toThrow();
    });

    it('should handle 401 unauthorized', async () => {
      mock.onGet('/protected').reply(401);

      await expect(client.testGet('/protected')).rejects.toThrow();
    });

    it('should handle 403 forbidden', async () => {
      mock.onGet('/admin').reply(403);

      await expect(client.testGet('/admin')).rejects.toThrow();
    });

    it('should handle 404 not found', async () => {
      mock.onGet('/users/999').reply(404);

      await expect(client.testGet('/users/999')).rejects.toThrow();
    });

    it('should handle 500 server error', async () => {
      mock.onGet('/users').reply(500);

      await expect(client.testGet('/users')).rejects.toThrow();
    });
  });
});
