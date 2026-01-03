/**
 * Budgets Query Hooks
 *
 * React Query hooks for fetching budget data
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { budgetsService } from '@fayol/api-client-mobile';
import type { ApiResponse } from '@fayol/shared-types';

// Query keys for budgets
export const budgetKeys = {
  all: ['budgets'] as const,
  lists: () => [...budgetKeys.all, 'list'] as const,
  list: () => [...budgetKeys.lists()] as const,
  details: () => [...budgetKeys.all, 'detail'] as const,
  detail: (id: string) => [...budgetKeys.details(), id] as const,
  progress: () => [...budgetKeys.all, 'progress'] as const,
  alerts: () => [...budgetKeys.all, 'alerts'] as const,
};

/**
 * Hook to fetch all budgets
 */
export function useBudgets(): UseQueryResult<ApiResponse<any>> {
  return useQuery({
    queryKey: budgetKeys.list(),
    queryFn: async () => {
      const response = await budgetsService.findAll();
      return response;
    },
  });
}

/**
 * Hook to fetch a single budget by ID
 * @param id - Budget ID
 * @param enabled - Whether the query should run
 */
export function useBudget(id: string, enabled: boolean = true): UseQueryResult<ApiResponse<any>> {
  return useQuery({
    queryKey: budgetKeys.detail(id),
    queryFn: async () => {
      const response = await budgetsService.findOne(id);
      return response;
    },
    enabled: enabled && !!id,
  });
}

/**
 * Hook to fetch budget progress for all budgets
 */
export function useBudgetsProgress(): UseQueryResult<ApiResponse<any>> {
  return useQuery({
    queryKey: budgetKeys.progress(),
    queryFn: async () => {
      const response = await budgetsService.getProgress();
      return response;
    },
    // Refetch more frequently for budget progress
    refetchInterval: 60000, // Every 1 minute
  });
}

/**
 * Hook to fetch active budget alerts
 */
export function useBudgetAlerts(): UseQueryResult<ApiResponse<any>> {
  return useQuery({
    queryKey: budgetKeys.alerts(),
    queryFn: async () => {
      const response = await budgetsService.getAlerts();
      return response;
    },
    // Refetch more frequently for alerts
    refetchInterval: 60000, // Every 1 minute
  });
}
