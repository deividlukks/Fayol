/**
 * Performance Utilities
 *
 * Utilitários para otimização de performance
 *
 * Features:
 * - Debounce e throttle
 * - Memoization
 * - Performance monitoring
 * - Lazy loading helpers
 */

/**
 * Debounce function - Delays execution until after wait time has elapsed
 * Use for search inputs, API calls triggered by typing
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - Ensures function is called at most once per specified time
 * Use for scroll handlers, resize handlers
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Memoize function - Caches results based on arguments
 * Use for expensive calculations that are called repeatedly with same args
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>();

  return function memoized(...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Deep equality check
 * Use for comparing objects in useMemo/useCallback dependencies
 */
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;

  if (typeof a !== 'object' || typeof b !== 'object' || a == null || b == null) {
    return false;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}

/**
 * Performance measurement
 */
export class PerformanceMonitor {
  private static measurements: Map<string, number[]> = new Map();

  /**
   * Start timing an operation
   */
  static start(label: string): () => void {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (!this.measurements.has(label)) {
        this.measurements.set(label, []);
      }

      this.measurements.get(label)!.push(duration);

      if (__DEV__) {
        console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
      }
    };
  }

  /**
   * Get average time for an operation
   */
  static getAverage(label: string): number {
    const times = this.measurements.get(label);
    if (!times || times.length === 0) return 0;

    const sum = times.reduce((a, b) => a + b, 0);
    return sum / times.length;
  }

  /**
   * Get all measurements
   */
  static getAll(): Record<string, { avg: number; count: number; min: number; max: number }> {
    const result: Record<string, any> = {};

    this.measurements.forEach((times, label) => {
      result[label] = {
        avg: times.reduce((a, b) => a + b, 0) / times.length,
        count: times.length,
        min: Math.min(...times),
        max: Math.max(...times),
      };
    });

    return result;
  }

  /**
   * Clear measurements
   */
  static clear(label?: string): void {
    if (label) {
      this.measurements.delete(label);
    } else {
      this.measurements.clear();
    }
  }
}

/**
 * Chunk array for batch processing
 * Use for processing large arrays without blocking UI
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Process array in chunks with delay
 * Use for heavy operations on large arrays
 */
export async function processInChunks<T, R>(
  array: T[],
  processor: (item: T) => R,
  chunkSize: number = 100,
  delayMs: number = 0
): Promise<R[]> {
  const results: R[] = [];
  const chunks = chunkArray(array, chunkSize);

  for (const chunk of chunks) {
    const chunkResults = chunk.map(processor);
    results.push(...chunkResults);

    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * Rate limiter for API calls
 */
export class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastCallTime = 0;

  constructor(
    private minInterval: number, // Minimum ms between calls
    private maxConcurrent: number = 1 // Max concurrent calls
  ) {}

  /**
   * Add a call to the queue
   */
  async execute<T>(call: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const now = Date.now();
          const timeSinceLastCall = now - this.lastCallTime;

          if (timeSinceLastCall < this.minInterval) {
            await new Promise((r) => setTimeout(r, this.minInterval - timeSinceLastCall));
          }

          this.lastCallTime = Date.now();
          const result = await call();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const call = this.queue.shift();

    if (call) {
      await call();
    }

    this.processQueue();
  }
}

/**
 * Cache with TTL (Time To Live)
 */
export class TTLCache<K, V> {
  private cache = new Map<K, { value: V; expiry: number }>();

  constructor(private defaultTTL: number = 5 * 60 * 1000) {} // 5 minutes default

  set(key: K, value: V, ttl?: number): void {
    const expiry = Date.now() + (ttl ?? this.defaultTTL);
    this.cache.set(key, { value, expiry });
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);

    if (!entry) return undefined;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: K[] = [];

    this.cache.forEach((entry, key) => {
      if (now > entry.expiry) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

/**
 * Batch executor - Batches multiple calls into single execution
 * Use for combining multiple API requests into one
 */
export class BatchExecutor<T, R> {
  private batch: T[] = [];
  private timeout: NodeJS.Timeout | null = null;
  private resolvers: Array<(results: R[]) => void> = [];

  constructor(
    private executor: (batch: T[]) => Promise<R[]>,
    private batchDelay: number = 50 // ms to wait before executing batch
  ) {}

  /**
   * Add item to batch
   */
  add(item: T): Promise<R> {
    return new Promise((resolve) => {
      this.batch.push(item);
      this.resolvers.push((results: R[]) => {
        const index = this.batch.indexOf(item);
        resolve(results[index]);
      });

      if (this.timeout) {
        clearTimeout(this.timeout);
      }

      this.timeout = setTimeout(() => this.execute(), this.batchDelay);
    });
  }

  private async execute(): Promise<void> {
    if (this.batch.length === 0) return;

    const batchToExecute = [...this.batch];
    const resolversToCall = [...this.resolvers];

    this.batch = [];
    this.resolvers = [];
    this.timeout = null;

    try {
      const results = await this.executor(batchToExecute);
      resolversToCall.forEach((resolver) => resolver(results));
    } catch (error) {
      console.error('[BatchExecutor] Error executing batch:', error);
    }
  }
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 10000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        console.log(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}
