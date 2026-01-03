import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@fayol/api-client-mobile';
import type { CreateInvestmentDto, UpdateInvestmentDto, Investment } from '@fayol/shared-types';

export function useInvestmentMutations() {
  const queryClient = useQueryClient();

  const createInvestment = useMutation({
    mutationFn: (data: CreateInvestmentDto) =>
      apiClient.post<{ data: Investment }>('/investments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-summary'] });
    },
  });

  const updateInvestment = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvestmentDto }) =>
      apiClient.patch<{ data: Investment }>(`/investments/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['investment', id] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-summary'] });
    },
  });

  const deleteInvestment = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/investments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-summary'] });
    },
  });

  return {
    createInvestment,
    updateInvestment,
    deleteInvestment,
  };
}
