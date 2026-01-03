'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createBudgetSchema, CreateBudgetInput } from '@fayol/validation-schemas';
import { Category, Budget } from '@fayol/shared-types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import { DateUtils } from '@fayol/shared-utils';

interface BudgetFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Budget; // Dados para edição
}

export function BudgetForm({ onSuccess, onCancel, initialData }: BudgetFormProps) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  // Busca categorias para o select
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data.data,
  });

  // Define datas padrão: Início e fim do mês atual
  const today = new Date();
  const startOfMonth = DateUtils.getStartOfMonth(today).toISOString().split('T')[0];
  const endOfMonth = DateUtils.getEndOfMonth(today).toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateBudgetInput>({
    resolver: zodResolver(createBudgetSchema),
    defaultValues: {
      startDate: new Date(startOfMonth),
      endDate: new Date(endOfMonth),
      notifyThreshold: 80, // Alerta padrão em 80%
    },
  });

  // Carrega dados para edição
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        amount: Number(initialData.amount),
        // Garante que as datas estejam no formato YYYY-MM-DD para o input
        startDate: new Date(initialData.startDate),
        endDate: new Date(initialData.endDate),
        notifyThreshold: initialData.notifyThreshold || 80,
        categoryId: initialData.categoryId || '',
      });
    }
  }, [initialData, reset]);

  // Mutation para criar ou atualizar orçamento
  const saveBudgetMutation = useMutation({
    mutationFn: async (data: CreateBudgetInput) => {
      const payload = {
        ...data,
        amount: Number(data.amount),
        notifyThreshold: data.notifyThreshold ? Number(data.notifyThreshold) : undefined,
        // Se categoryId for vazio, envia undefined (orçamento global)
        categoryId: data.categoryId === '' ? undefined : data.categoryId,
      };

      if (initialData?.id) {
        return api.patch(`/budgets/${initialData.id}`, payload);
      } else {
        return api.post('/budgets', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      onSuccess();
    },
    onError: (error: AxiosError<{ message: string }>) => {
      setServerError(error.response?.data?.message || 'Erro ao salvar orçamento.');
    },
  });

  const onSubmit = (data: CreateBudgetInput) => {
    setServerError(null);
    saveBudgetMutation.mutate(data);
  };

  const categoryOptions = [
    { label: 'Global (Todas as Categorias)', value: '' },
    ...categories.map((cat) => ({ label: cat.name, value: cat.id })),
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Nome do Orçamento"
        id="name"
        placeholder="Ex: Gastos do Mês, Viagem..."
        {...register('name')}
        error={errors.name?.message}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Valor Limite (R$)"
          id="amount"
          type="number"
          step="0.01"
          placeholder="0,00"
          {...register('amount', { valueAsNumber: true })}
          error={errors.amount?.message}
        />
        <Select
          label="Categoria Alvo"
          id="categoryId"
          options={categoryOptions}
          {...register('categoryId')}
          error={errors.categoryId?.message}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Data Início"
          id="startDate"
          type="date"
          {...register('startDate', { valueAsDate: true })}
          // Formata data para o defaultValue apenas se não tiver vindo do reset (que já cuida disso internamente com o objeto Date, mas o input type=date as vezes precisa de string)
          // O hook form geralmente lida bem com Date object se valueAsDate for true, mas o defaultValue HTML precisa ser string YYYY-MM-DD
          defaultValue={
            initialData ? new Date(initialData.startDate).toISOString().split('T')[0] : startOfMonth
          }
          error={errors.startDate?.message}
        />
        <Input
          label="Data Fim"
          id="endDate"
          type="date"
          {...register('endDate', { valueAsDate: true })}
          defaultValue={
            initialData ? new Date(initialData.endDate).toISOString().split('T')[0] : endOfMonth
          }
          error={errors.endDate?.message}
        />
      </div>

      <Input
        label="Alertar ao atingir (%)"
        id="notifyThreshold"
        type="number"
        min="1"
        max="100"
        placeholder="Ex: 80"
        {...register('notifyThreshold', { valueAsNumber: true })}
        error={errors.notifyThreshold?.message}
      />

      {serverError && (
        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center">
          {serverError}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
          {initialData ? 'Atualizar Orçamento' : 'Criar Orçamento'}
        </Button>
      </div>
    </form>
  );
}
