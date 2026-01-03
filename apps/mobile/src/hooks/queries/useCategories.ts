/**
 * Categories Query Hooks
 *
 * React Query hooks for fetching category data
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { categoriesService } from '@fayol/api-client-mobile';
import type { ApiResponse } from '@fayol/shared-types';

// Query keys for categories
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: () => [...categoryKeys.lists()] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
};

/**
 * Hook to fetch all categories
 */
export function useCategories(): UseQueryResult<ApiResponse<any>> {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: async () => {
      const response = await categoriesService.findAll();
      return response;
    },
    // Categories change infrequently, so we can cache them for longer
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Hook to fetch a single category by ID
 * @param id - Category ID
 * @param enabled - Whether the query should run
 */
export function useCategory(id: string, enabled: boolean = true): UseQueryResult<ApiResponse<any>> {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: async () => {
      const response = await categoriesService.findOne(id);
      return response;
    },
    enabled: enabled && !!id,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}
