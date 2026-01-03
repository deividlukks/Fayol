/**
 * Account Mutation Hooks
 *
 * React Query hooks for creating, updating, and deleting accounts
 */

import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { accountsService } from '@fayol/api-client-mobile';
import type { ApiResponse } from '@fayol/shared-types';
import { accountKeys } from '../queries/useAccounts';

/**
 * Hook to create a new account
 * Invalidates accounts and dashboard queries on success
 */
export function useCreateAccount(): UseMutationResult<ApiResponse<any>, Error, unknown, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: unknown) => {
      const response = await accountsService.create(data);
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

/**
 * Hook to update an existing account
 * Invalidates accounts and dashboard queries on success
 */
export function useUpdateAccount(): UseMutationResult<
  ApiResponse<any>,
  Error,
  { id: string; data: unknown },
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: unknown }) => {
      const response = await accountsService.update(id, data);
      return response;
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific account detail
      queryClient.invalidateQueries({ queryKey: accountKeys.detail(variables.id) });
      // Invalidate all account lists
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

/**
 * Hook to delete an account
 * Invalidates accounts and dashboard queries on success
 */
export function useDeleteAccount(): UseMutationResult<ApiResponse<any>, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await accountsService.remove(id);
      return response;
    },
    onSuccess: (_, id) => {
      // Remove the specific account from cache
      queryClient.removeQueries({ queryKey: accountKeys.detail(id) });
      // Invalidate all account lists
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}
