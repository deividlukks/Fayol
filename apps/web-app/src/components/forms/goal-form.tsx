'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createGoalSchema, CreateGoalInput } from '@fayol/validation-schemas';
import { Goal } from '@fayol/shared-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { AxiosError } from 'axios';

interface GoalFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Goal;
}

export function GoalForm({ onSuccess, onCancel, initialData }: GoalFormProps) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateGoalInput>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: {
      currentAmount: 0,
      color: 'bg-blue-500', // Cor padrão
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title,
        currentAmount: Number(initialData.currentAmount),
        targetAmount: Number(initialData.targetAmount),
        deadline: initialData.deadline ? new Date(initialData.deadline) : undefined,
        color: initialData.color,
      });
    }
  }, [initialData, reset]);

  const saveGoalMutation = useMutation({
    mutationFn: async (data: CreateGoalInput) => {
      const payload = {
        ...data,
        currentAmount: Number(data.currentAmount),
        targetAmount: Number(data.targetAmount),
      };

      if (initialData?.id) {
        return api.patch(`/goals/${initialData.id}`, payload);
      } else {
        return api.post('/goals', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      onSuccess();
    },
    onError: (error: AxiosError<{ message: string }>) => {
      setServerError(error.response?.data?.message || 'Erro ao salvar meta.');
    },
  });

  const onSubmit = (data: CreateGoalInput) => {
    setServerError(null);
    saveGoalMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Título da Meta"
        id="title"
        placeholder="Ex: Viagem para Disney, Carro Novo..."
        {...register('title')}
        error={errors.title?.message}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Valor Alvo (R$)"
          id="targetAmount"
          type="number"
          step="0.01"
          placeholder="0,00"
          {...register('targetAmount', { valueAsNumber: true })}
          error={errors.targetAmount?.message}
        />
        <Input
          label="Já guardado (R$)"
          id="currentAmount"
          type="number"
          step="0.01"
          placeholder="0,00"
          {...register('currentAmount', { valueAsNumber: true })}
          error={errors.currentAmount?.message}
        />
      </div>

      <Input
        label="Prazo (Opcional)"
        id="deadline"
        type="date"
        {...register('deadline', { valueAsDate: true })}
        defaultValue={
          initialData?.deadline ? new Date(initialData.deadline).toISOString().split('T')[0] : ''
        }
        error={errors.deadline?.message}
      />

      <div className="space-y-1">
        <label htmlFor="color" className="text-sm font-medium text-slate-700">
          Cor do Card
        </label>
        <Select
          id="color"
          {...register('color')}
          options={[
            { label: 'Azul', value: 'bg-blue-500' },
            { label: 'Verde', value: 'bg-emerald-500' },
            { label: 'Roxo', value: 'bg-purple-500' },
            { label: 'Laranja', value: 'bg-amber-500' },
            { label: 'Rosa', value: 'bg-rose-500' },
          ]}
        />
      </div>

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
          {initialData ? 'Atualizar' : 'Criar Meta'}
        </Button>
      </div>
    </form>
  );
}
