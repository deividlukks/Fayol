/**
 * Category Mutation Hooks
 *
 * React Query hooks for creating, updating, and deleting categories
 */

import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { categoriesService } from '@fayol/api-client-mobile';
import type { ApiResponse } from '@fayol/shared-types';
import { categoryKeys } from '../queries/useCategories';

/**
 * Hook to create a new category
 * Invalidates categories on success
 */
export function useCreateCategory(): UseMutationResult<ApiResponse<any>, Error, unknown, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: unknown) => {
      const response = await categoriesService.create(data);
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

/**
 * Hook to update an existing category
 * Invalidates categories on success
 */
export function useUpdateCategory(): UseMutationResult<
  ApiResponse<any>,
  Error,
  { id: string; data: unknown },
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: unknown }) => {
      const response = await categoriesService.update(id, data);
      return response;
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific category detail
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(variables.id) });
      // Invalidate all category lists
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}

/**
 * Hook to delete a category
 * Invalidates categories on success
 */
export function useDeleteCategory(): UseMutationResult<ApiResponse<any>, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await categoriesService.remove(id);
      return response;
    },
    onSuccess: (_, id) => {
      // Remove the specific category from cache
      queryClient.removeQueries({ queryKey: categoryKeys.detail(id) });
      // Invalidate all category lists
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}
