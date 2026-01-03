/**
 * Budget Mutation Hooks
 *
 * React Query hooks for creating, updating, and deleting budgets
 */

import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { budgetsService } from '@fayol/api-client-mobile';
import type { ApiResponse } from '@fayol/shared-types';
import { budgetKeys } from '../queries/useBudgets';

/**
 * Hook to create a new budget
 * Invalidates budgets and related queries on success
 */
export function useCreateBudget(): UseMutationResult<ApiResponse<any>, Error, unknown, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: unknown) => {
      const response = await budgetsService.create(data);
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Hook to update an existing budget
 * Invalidates budgets and related queries on success
 */
export function useUpdateBudget(): UseMutationResult<
  ApiResponse<any>,
  Error,
  { id: string; data: unknown },
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: unknown }) => {
      const response = await budgetsService.update(id, data);
      return response;
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific budget detail
      queryClient.invalidateQueries({ queryKey: budgetKeys.detail(variables.id) });
      // Invalidate all budget lists
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
      // Invalidate progress and alerts
      queryClient.invalidateQueries({ queryKey: budgetKeys.progress() });
      queryClient.invalidateQueries({ queryKey: budgetKeys.alerts() });
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Hook to delete a budget
 * Invalidates budgets and related queries on success
 */
export function useDeleteBudget(): UseMutationResult<ApiResponse<any>, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await budgetsService.remove(id);
      return response;
    },
    onSuccess: (_, id) => {
      // Remove the specific budget from cache
      queryClient.removeQueries({ queryKey: budgetKeys.detail(id) });
      // Invalidate all budget lists
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
      // Invalidate progress and alerts
      queryClient.invalidateQueries({ queryKey: budgetKeys.progress() });
      queryClient.invalidateQueries({ queryKey: budgetKeys.alerts() });
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
