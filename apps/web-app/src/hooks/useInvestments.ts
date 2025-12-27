import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { investmentsService } from '@fayol/api-client';
import { CreateInvestmentInput, UpdateInvestmentInput } from '@fayol/validation-schemas';

export function useInvestments() {
  return useQuery({
    queryKey: ['investments'],
    queryFn: async () => {
      const response = await investmentsService.findAll();
      return response.data;
    },
  });
}

export function useInvestment(id: string) {
  return useQuery({
    queryKey: ['investments', id],
    queryFn: async () => {
      const response = await investmentsService.findOne(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvestmentInput) => investmentsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}

export function useUpdateInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvestmentInput }) =>
      investmentsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}

export function useDeleteInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => investmentsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}
