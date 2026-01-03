import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsService } from '@fayol/api-client';
import { CreateTransactionInput, UpdateTransactionInput } from '@fayol/validation-schemas';

export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await transactionsService.findAll();
      return response.data;
    },
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: ['transactions', id],
    queryFn: async () => {
      const response = await transactionsService.findOne(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransactionInput) => {
      // Convert null to undefined for optional fields
      const cleanData = {
        ...data,
        categoryId: data.categoryId ?? undefined,
        destinationAccountId: data.destinationAccountId ?? undefined,
      };
      return transactionsService.create(cleanData as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionInput }) => {
      // Convert null to undefined for optional fields
      const cleanData = {
        ...data,
        categoryId: data.categoryId ?? undefined,
        destinationAccountId: data.destinationAccountId ?? undefined,
      };
      return transactionsService.update(id, cleanData as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
