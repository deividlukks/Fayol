'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Insight } from '../components/insights/InsightsCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

interface GenerateInsightsParams {
  startDate?: Date;
  endDate?: Date;
}

/**
 * Hook para buscar e gerenciar insights financeiros
 */
export function useInsights() {
  const queryClient = useQueryClient();

  // Busca insights do usuário
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['insights'],
    queryFn: async () => {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/ai/insights`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar insights');
      }

      const result = await response.json();
      return result.insights as Insight[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Gera novos insights
  const generateInsights = useMutation({
    mutationFn: async (params?: GenerateInsightsParams) => {
      const token = localStorage.getItem('token');

      const queryParams = new URLSearchParams();
      if (params?.startDate) {
        queryParams.append('startDate', params.startDate.toISOString());
      }
      if (params?.endDate) {
        queryParams.append('endDate', params.endDate.toISOString());
      }

      const response = await fetch(`${API_URL}/ai/insights/generate?${queryParams}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar insights');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalida cache e recarrega insights
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });

  return {
    insights: data || [],
    isLoading,
    error,
    refetch,
    generateInsights: generateInsights.mutate,
    isGenerating: generateInsights.isPending,
  };
}

/**
 * Hook para buscar previsões de gastos
 */
export function useForecast(categoryId?: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['forecast', categoryId],
    queryFn: async () => {
      const token = localStorage.getItem('token');

      const queryParams = new URLSearchParams();
      if (categoryId) {
        queryParams.append('categoryId', categoryId);
      }

      const response = await fetch(`${API_URL}/ai/forecast?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar previsões');
      }

      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  return {
    forecast: data,
    isLoading,
    error,
    refetch,
  };
}
