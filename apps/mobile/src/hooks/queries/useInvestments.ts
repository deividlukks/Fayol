import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@fayol/api-client-mobile';
import type { Investment } from '@fayol/shared-types';

interface UseInvestmentsParams {
  type?: string;
  accountId?: string;
}

export function useInvestments(params?: UseInvestmentsParams) {
  return useQuery({
    queryKey: ['investments', params],
    queryFn: () => apiClient.get<{ data: Investment[] }>('/investments', { params }),
  });
}

export function useInvestment(id: string) {
  return useQuery({
    queryKey: ['investment', id],
    queryFn: () => apiClient.get<{ data: Investment }>(`/investments/${id}`),
    enabled: !!id,
  });
}

export function usePortfolioSummary() {
  return useQuery({
    queryKey: ['portfolio-summary'],
    queryFn: () =>
      apiClient.get<{
        data: {
          totalValue: number;
          totalCost: number;
          totalGain: number;
          gainPercentage: number;
          byType: Record<string, number>;
        };
      }>('/investments/summary'),
  });
}
