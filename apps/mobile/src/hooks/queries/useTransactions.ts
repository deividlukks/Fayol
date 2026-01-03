/**
 * Transactions Query Hooks
 *
 * React Query hooks for fetching transaction data
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { transactionsService } from '@fayol/api-client-mobile';
import type { ApiResponse } from '@fayol/shared-types';

// Query keys for transactions
export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...transactionKeys.lists(), filters] as const,
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
};

/**
 * Hook to fetch all transactions
 * @param params - Query parameters for filtering/pagination
 */
export function useTransactions(
  params?: Record<string, unknown>
): UseQueryResult<ApiResponse<any>> {
  return useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: async () => {
      const response = await transactionsService.findAll(params);
      return response;
    },
  });
}

/**
 * Hook to fetch a single transaction by ID
 * @param id - Transaction ID
 * @param enabled - Whether the query should run
 */
export function useTransaction(
  id: string,
  enabled: boolean = true
): UseQueryResult<ApiResponse<any>> {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: async () => {
      const response = await transactionsService.findOne(id);
      return response;
    },
    enabled: enabled && !!id,
  });
}
