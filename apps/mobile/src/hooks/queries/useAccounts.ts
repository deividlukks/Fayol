/**
 * Accounts Query Hooks
 *
 * React Query hooks for fetching account data
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { accountsService } from '@fayol/api-client-mobile';
import type { ApiResponse } from '@fayol/shared-types';

// Query keys for accounts
export const accountKeys = {
  all: ['accounts'] as const,
  lists: () => [...accountKeys.all, 'list'] as const,
  list: () => [...accountKeys.lists()] as const,
  details: () => [...accountKeys.all, 'detail'] as const,
  detail: (id: string) => [...accountKeys.details(), id] as const,
};

/**
 * Hook to fetch all accounts
 */
export function useAccounts(): UseQueryResult<ApiResponse<any>> {
  return useQuery({
    queryKey: accountKeys.list(),
    queryFn: async () => {
      const response = await accountsService.findAll();
      return response;
    },
  });
}

/**
 * Hook to fetch a single account by ID
 * @param id - Account ID
 * @param enabled - Whether the query should run
 */
export function useAccount(id: string, enabled: boolean = true): UseQueryResult<ApiResponse<any>> {
  return useQuery({
    queryKey: accountKeys.detail(id),
    queryFn: async () => {
      const response = await accountsService.findOne(id);
      return response;
    },
    enabled: enabled && !!id,
  });
}
