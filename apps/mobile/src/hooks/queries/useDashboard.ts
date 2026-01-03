/**
 * Dashboard and Reports Query Hooks
 *
 * React Query hooks for fetching dashboard and report data
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { reportsService } from '@fayol/api-client-mobile';
import type { ApiResponse } from '@fayol/shared-types';

// Query keys for dashboard and reports
export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
};

export const reportKeys = {
  all: ['reports'] as const,
  expensesByCategory: (params?: Record<string, unknown>) =>
    [...reportKeys.all, 'expenses-by-category', params] as const,
  cashFlow: (params?: Record<string, unknown>) => [...reportKeys.all, 'cash-flow', params] as const,
  insights: () => [...reportKeys.all, 'insights'] as const,
  monthlyEvolution: () => [...reportKeys.all, 'monthly-evolution'] as const,
  expensesPie: () => [...reportKeys.all, 'expenses-pie'] as const,
};

/**
 * Hook to fetch dashboard summary
 * This is the main data for the dashboard screen
 */
export function useDashboardSummary(): UseQueryResult<ApiResponse<any>> {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: async () => {
      const response = await reportsService.getSummary();
      return response;
    },
    // Refetch dashboard more frequently
    refetchInterval: 30000, // Every 30 seconds when app is active
  });
}

/**
 * Hook to fetch expenses by category report
 * @param params - Query parameters for filtering (period, date range, etc.)
 */
export function useExpensesByCategory(
  params?: Record<string, unknown>
): UseQueryResult<ApiResponse<any>> {
  return useQuery({
    queryKey: reportKeys.expensesByCategory(params),
    queryFn: async () => {
      const response = await reportsService.getExpensesByCategory(params);
      return response;
    },
  });
}

/**
 * Hook to fetch cash flow report
 * @param params - Query parameters for filtering (period, date range, etc.)
 */
export function useCashFlow(params?: Record<string, unknown>): UseQueryResult<ApiResponse<any>> {
  return useQuery({
    queryKey: reportKeys.cashFlow(params),
    queryFn: async () => {
      const response = await reportsService.getCashFlow(params);
      return response;
    },
  });
}

/**
 * Hook to fetch AI-generated insights
 */
export function useInsights(): UseQueryResult<ApiResponse<any>> {
  return useQuery({
    queryKey: reportKeys.insights(),
    queryFn: async () => {
      const response = await reportsService.getInsights();
      return response;
    },
    // Insights don't change frequently, cache for longer
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch monthly evolution chart data
 */
export function useMonthlyEvolution(): UseQueryResult<ApiResponse<any>> {
  return useQuery({
    queryKey: reportKeys.monthlyEvolution(),
    queryFn: async () => {
      const response = await reportsService.getMonthlyEvolution();
      return response;
    },
  });
}

/**
 * Hook to fetch expenses pie chart data
 */
export function useExpensesPie(): UseQueryResult<ApiResponse<any>> {
  return useQuery({
    queryKey: reportKeys.expensesPie(),
    queryFn: async () => {
      const response = await reportsService.getExpensesPie();
      return response;
    },
  });
}
