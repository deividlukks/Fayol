/**
 * React Query Provider
 *
 * Configures and provides TanStack React Query for data fetching and caching
 */

import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a QueryClient instance with custom configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Time before data is considered stale (5 minutes)
      staleTime: 5 * 60 * 1000,

      // Time before inactive queries are garbage collected (10 minutes)
      gcTime: 10 * 60 * 1000,

      // Number of retry attempts on failure
      retry: 2,

      // Retry delay (exponential backoff)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus (useful when app returns from background)
      refetchOnWindowFocus: true,

      // Refetch on reconnect (when internet comes back)
      refetchOnReconnect: true,

      // Refetch on mount (if data is stale)
      refetchOnMount: true,
    },
    mutations: {
      // Number of retry attempts for mutations
      retry: 1,

      // Retry delay for mutations
      retryDelay: 1000,
    },
  },
});

interface ReactQueryProviderProps {
  children: ReactNode;
}

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

// Export queryClient for manual cache invalidation if needed
export { queryClient };
