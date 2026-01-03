import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { debounce, throttle, PerformanceMonitor } from '../utils/performance';

/**
 * Performance Hooks
 *
 * React hooks para otimização de performance
 */

/**
 * Hook for debounced value
 * Use for search inputs, filter values
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for debounced callback
 * Use for API calls triggered by user input
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useMemo(
    () => debounce((...args: Parameters<T>) => callbackRef.current(...args), delay),
    [delay]
  );

  return debouncedCallback;
}

/**
 * Hook for throttled callback
 * Use for scroll handlers, resize handlers
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useMemo(
    () => throttle((...args: Parameters<T>) => callbackRef.current(...args), limit),
    [limit]
  );

  return throttledCallback;
}

/**
 * Hook for measuring render performance
 * Use for debugging slow components
 */
export function useRenderPerformance(componentName: string, enabled: boolean = __DEV__) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());

  useEffect(() => {
    if (!enabled) return;

    renderCount.current += 1;
    const now = performance.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    if (renderCount.current > 1) {
      console.log(
        `[Render Performance] ${componentName} - Render #${renderCount.current} - ${timeSinceLastRender.toFixed(2)}ms since last render`
      );
    }
  });

  return {
    renderCount: renderCount.current,
  };
}

/**
 * Hook for async operation with loading and error states
 * Use for API calls, async operations
 */
export function useAsyncOperation<T, A extends any[]>(operation: (...args: A) => Promise<T>) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args: A): Promise<T | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await operation(...args);

        if (isMountedRef.current) {
          setData(result);
          setIsLoading(false);
        }

        return result;
      } catch (err) {
        if (isMountedRef.current) {
          setError(err as Error);
          setIsLoading(false);
        }
        return null;
      }
    },
    [operation]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    isLoading,
    error,
    data,
    execute,
    reset,
  };
}

/**
 * Hook for pagination
 * Use for infinite scroll, paginated lists
 */
export function usePagination<T>(items: T[], itemsPerPage: number = 20) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage]);

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages]
  );

  const reset = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    items: paginatedItems,
    currentPage,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    nextPage,
    prevPage,
    goToPage,
    reset,
  };
}

/**
 * Hook for infinite scroll
 * Use for loading more items as user scrolls
 */
export function useInfiniteScroll<T>(
  initialItems: T[],
  loadMore: () => Promise<T[]>,
  pageSize: number = 20
) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadMoreItems = useCallback(async () => {
    if (isLoading || !hasMore) return;

    try {
      setIsLoading(true);
      setError(null);

      const newItems = await loadMore();

      setItems((prev) => [...prev, ...newItems]);
      setHasMore(newItems.length >= pageSize);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, loadMore, pageSize]);

  const reset = useCallback(() => {
    setItems(initialItems);
    setHasMore(true);
    setError(null);
  }, [initialItems]);

  return {
    items,
    isLoading,
    hasMore,
    error,
    loadMore: loadMoreItems,
    reset,
  };
}

/**
 * Hook for previous value
 * Use for comparing current vs previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Hook for update effect (skip first render)
 * Use when you don't want effect to run on mount
 */
export function useUpdateEffect(effect: () => void | (() => void), deps: any[]) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Hook for measuring component mount time
 * Use for performance monitoring
 */
export function useMountPerformance(componentName: string) {
  useEffect(() => {
    const endMeasure = PerformanceMonitor.start(`${componentName} Mount`);

    return () => {
      endMeasure();
    };
  }, [componentName]);
}

/**
 * Hook for interval with cleanup
 * Use for polling, auto-refresh
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const tick = () => savedCallback.current();
    const id = setInterval(tick, delay);

    return () => clearInterval(id);
  }, [delay]);
}

/**
 * Hook for lazy loading data
 * Use for data that should only load when needed
 */
export function useLazyLoad<T>(loader: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const hasLoadedRef = useRef(false);

  const load = useCallback(async () => {
    if (hasLoadedRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      const result = await loader();
      setData(result);
      hasLoadedRef.current = true;
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    data,
    isLoading,
    error,
    load,
    hasLoaded: hasLoadedRef.current,
  };
}

/**
 * Hook for window dimensions with debouncing
 * Use for responsive layouts
 */
export function useWindowDimensions(debounceMs: number = 200) {
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const handleResize = debounce(() => {
      // Note: In React Native, use Dimensions.get('window')
      // This is a placeholder for web
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }, debounceMs);

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [debounceMs]);

  return dimensions;
}
