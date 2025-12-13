import axios, { AxiosInstance } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { setupRetry } from '../src/retry';

describe('setupRetry', () => {
  let axiosInstance: AxiosInstance;
  let mock: MockAdapter;

  beforeEach(() => {
    axiosInstance = axios.create();
    mock = new MockAdapter(axiosInstance);
    jest.useFakeTimers();
  });

  afterEach(() => {
    mock.restore();
    jest.useRealTimers();
  });

  it('should retry on network errors', async () => {
    setupRetry(axiosInstance, { retries: 2, retryDelay: 100 });

    let attempt = 0;
    mock.onGet('/test').reply(() => {
      attempt++;
      if (attempt < 3) {
        return [null as any]; // Network error
      }
      return [200, { data: 'success' }];
    });

    const promise = axiosInstance.get('/test');

    // Wait for retries
    await jest.advanceTimersByTimeAsync(100);
    await jest.advanceTimersByTimeAsync(200);

    const result = await promise;
    expect(result.status).toBe(200);
  });

  it('should retry on 5xx errors', async () => {
    setupRetry(axiosInstance, { retries: 2, retryDelay: 50 });

    let attempt = 0;
    mock.onGet('/test').reply(() => {
      attempt++;
      if (attempt === 1) {
        return [500, { error: 'Server error' }];
      }
      return [200, { data: 'success' }];
    });

    const promise = axiosInstance.get('/test');

    await jest.advanceTimersByTimeAsync(50);

    const result = await promise;
    expect(result.status).toBe(200);
  });

  it('should not retry on 4xx errors', async () => {
    setupRetry(axiosInstance, { retries: 3, retryDelay: 10 });

    mock.onGet('/test').reply(400, { error: 'Bad request' });

    await expect(axiosInstance.get('/test')).rejects.toThrow();
  });

  it('should not retry on 401 errors', async () => {
    setupRetry(axiosInstance, { retries: 3, retryDelay: 10 });

    mock.onGet('/test').reply(401, { error: 'Unauthorized' });

    await expect(axiosInstance.get('/test')).rejects.toThrow();
  });

  it('should respect max retries', async () => {
    setupRetry(axiosInstance, { retries: 3, retryDelay: 10 });

    let attempt = 0;
    mock.onGet('/test').reply(() => {
      attempt++;
      return [500, { error: 'Server error' }];
    });

    const promise = axiosInstance.get('/test');

    // Advance through all retries
    await jest.advanceTimersByTimeAsync(10); // 1st retry
    await jest.advanceTimersByTimeAsync(20); // 2nd retry
    await jest.advanceTimersByTimeAsync(40); // 3rd retry

    await expect(promise).rejects.toThrow();
    expect(attempt).toBe(4); // Initial + 3 retries
  });

  it('should use exponential backoff', async () => {
    const delays: number[] = [];
    const startTime = Date.now();

    setupRetry(axiosInstance, {
      retries: 3,
      retryDelay: 100,
      onRetry: () => {
        delays.push(Date.now() - startTime);
      },
    });

    let attempt = 0;
    mock.onGet('/test').reply(() => {
      attempt++;
      return [500, { error: 'Server error' }];
    });

    const promise = axiosInstance.get('/test');

    await jest.advanceTimersByTimeAsync(100); // 1st: 100ms
    await jest.advanceTimersByTimeAsync(200); // 2nd: 200ms
    await jest.advanceTimersByTimeAsync(400); // 3rd: 400ms

    await expect(promise).rejects.toThrow();

    // Should have called onRetry 3 times
    expect(delays.length).toBe(3);
  });

  it('should call onRetry callback', async () => {
    const onRetry = jest.fn();

    setupRetry(axiosInstance, {
      retries: 2,
      retryDelay: 10,
      onRetry,
    });

    let attempt = 0;
    mock.onGet('/test').reply(() => {
      attempt++;
      if (attempt === 1) {
        return [500, { error: 'Server error' }];
      }
      return [200, { data: 'success' }];
    });

    const promise = axiosInstance.get('/test');

    await jest.advanceTimersByTimeAsync(10);

    await promise;

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Object));
  });

  it('should allow custom retry condition', async () => {
    const retryCondition = jest.fn(() => false);

    setupRetry(axiosInstance, {
      retries: 3,
      retryDelay: 10,
      retryCondition,
    });

    mock.onGet('/test').networkError();

    await expect(axiosInstance.get('/test')).rejects.toThrow();

    expect(retryCondition).toHaveBeenCalled();
  });

  it('should handle custom retry condition returning true', async () => {
    const retryCondition = jest.fn(() => true);

    setupRetry(axiosInstance, {
      retries: 1,
      retryDelay: 10,
      retryCondition,
    });

    let attempt = 0;
    mock.onGet('/test').reply(() => {
      attempt++;
      if (attempt === 1) {
        return [400, { error: 'Bad request' }]; // Normally not retried
      }
      return [200, { data: 'success' }];
    });

    const promise = axiosInstance.get('/test');

    await jest.advanceTimersByTimeAsync(10);

    const result = await promise;
    expect(result.status).toBe(200);
    expect(retryCondition).toHaveBeenCalled();
  });

  it('should handle successful request without retries', async () => {
    setupRetry(axiosInstance);

    mock.onGet('/test').reply(200, { data: 'success' });

    const result = await axiosInstance.get('/test');

    expect(result.status).toBe(200);
    expect(result.data).toEqual({ data: 'success' });
  });

  it('should use default config when not provided', async () => {
    setupRetry(axiosInstance);

    let attempt = 0;
    mock.onGet('/test').reply(() => {
      attempt++;
      return [500, { error: 'Server error' }];
    });

    const promise = axiosInstance.get('/test');

    // Default is 3 retries with 1000ms base delay
    await jest.advanceTimersByTimeAsync(1000);
    await jest.advanceTimersByTimeAsync(2000);
    await jest.advanceTimersByTimeAsync(4000);

    await expect(promise).rejects.toThrow();
    expect(attempt).toBe(4); // Initial + 3 retries
  });

  it('should maintain retry count across attempts', async () => {
    const retryCounts: number[] = [];

    setupRetry(axiosInstance, {
      retries: 3,
      retryDelay: 10,
      onRetry: (count) => {
        retryCounts.push(count);
      },
    });

    let attempt = 0;
    mock.onGet('/test').reply(() => {
      attempt++;
      return [500, { error: 'Server error' }];
    });

    const promise = axiosInstance.get('/test');

    await jest.advanceTimersByTimeAsync(10); // 1st
    await jest.advanceTimersByTimeAsync(20); // 2nd
    await jest.advanceTimersByTimeAsync(40); // 3rd

    await expect(promise).rejects.toThrow();

    expect(retryCounts).toEqual([1, 2, 3]);
  });

  it('should retry on 502 error', async () => {
    setupRetry(axiosInstance, { retries: 1, retryDelay: 10 });

    let attempt = 0;
    mock.onGet('/test').reply(() => {
      attempt++;
      if (attempt === 1) {
        return [502, { error: 'Bad gateway' }];
      }
      return [200, { data: 'success' }];
    });

    const promise = axiosInstance.get('/test');

    await jest.advanceTimersByTimeAsync(10);

    const result = await promise;
    expect(result.status).toBe(200);
  });

  it('should retry on 503 error', async () => {
    setupRetry(axiosInstance, { retries: 1, retryDelay: 10 });

    let attempt = 0;
    mock.onGet('/test').reply(() => {
      attempt++;
      if (attempt === 1) {
        return [503, { error: 'Service unavailable' }];
      }
      return [200, { data: 'success' }];
    });

    const promise = axiosInstance.get('/test');

    await jest.advanceTimersByTimeAsync(10);

    const result = await promise;
    expect(result.status).toBe(200);
  });
});
