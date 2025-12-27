/**
 * Transaction Mutation Hooks
 *
 * React Query hooks for creating, updating, and deleting transactions
 */

import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { transactionsService } from '@fayol/api-client-mobile';
import type { ApiResponse } from '@fayol/shared-types';
import { transactionKeys } from '../queries/useTransactions';

/**
 * Hook to create a new transaction
 * Invalidates transactions, accounts, and dashboard queries on success
 */
export function useCreateTransaction(): UseMutationResult<
  ApiResponse<any>,
  Error,
  unknown,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: unknown) => {
      const response = await transactionsService.create(data);
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

/**
 * Hook to update an existing transaction
 * Invalidates transactions, accounts, and dashboard queries on success
 */
export function useUpdateTransaction(): UseMutationResult<
  ApiResponse<any>,
  Error,
  { id: string; data: unknown },
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: unknown }) => {
      const response = await transactionsService.update(id, data);
      return response;
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific transaction detail
      queryClient.invalidateQueries({ queryKey: transactionKeys.detail(variables.id) });
      // Invalidate all transaction lists
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

/**
 * Hook to delete a transaction
 * Invalidates transactions, accounts, and dashboard queries on success
 */
export function useDeleteTransaction(): UseMutationResult<
  ApiResponse<any>,
  Error,
  string,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await transactionsService.remove(id);
      return response;
    },
    onSuccess: (_, id) => {
      // Remove the specific transaction from cache
      queryClient.removeQueries({ queryKey: transactionKeys.detail(id) });
      // Invalidate all transaction lists
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}
