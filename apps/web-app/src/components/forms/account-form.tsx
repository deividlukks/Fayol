'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createAccountSchema, CreateAccountInput } from '@fayol/validation-schemas';
import { Account, AccountType } from '@fayol/shared-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { AxiosError } from 'axios';

interface AccountFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Account;
}

export function AccountForm({ onSuccess, onCancel, initialData }: AccountFormProps) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateAccountInput>({
    resolver: zodResolver(createAccountSchema),
    shouldUnregister: true, // <--- IMPORTANTE: Remove campos ocultos da validação
    defaultValues: {
      balance: 0,
      creditLimit: 0,
      currency: 'BRL',
      type: AccountType.CHECKING,
    },
  });

  const selectedType = watch('type');

  // Carrega dados para edição
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        type: initialData.type,
        balance: Number(initialData.balance),
        creditLimit: initialData.creditLimit ? Number(initialData.creditLimit) : 0,
        currency: initialData.currency,
        color: initialData.color,
        icon: initialData.icon,
      });
    }
  }, [initialData, reset]);

  // Mutation
  const saveAccountMutation = useMutation({
    mutationFn: async (data: CreateAccountInput) => {
      const payload = {
        ...data,
        // Garante envio correto dos números
        balance: Number(data.balance),
        creditLimit:
          data.type === AccountType.CREDIT_CARD && data.creditLimit
            ? Number(data.creditLimit)
            : undefined,
      };

      if (initialData?.id) {
        return api.patch(`/accounts/${initialData.id}`, payload);
      } else {
        return api.post('/accounts', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      onSuccess();
    },
    onError: (error: AxiosError<{ message: string }>) => {
      setServerError(error.response?.data?.message || 'Erro ao salvar conta.');
    },
  });

  const onSubmit = (data: CreateAccountInput) => {
    setServerError(null);
    saveAccountMutation.mutate(data);
  };

  // Debug de erros
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onInvalid = (errors: any) => {
    console.error('❌ Erros de validação impedindo o envio:', errors);
  };

  const typeOptions = [
    { label: 'Conta Corrente', value: AccountType.CHECKING },
    { label: 'Poupança', value: AccountType.SAVINGS },
    { label: 'Investimento/Corretora', value: AccountType.INVESTMENT },
    { label: 'Carteira (Dinheiro)', value: AccountType.CASH },
    { label: 'Cartão de Crédito', value: AccountType.CREDIT_CARD },
    { label: 'Outros', value: AccountType.OTHER },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
      <Input
        label="Nome da Conta"
        id="name"
        placeholder="Ex: Nubank, Carteira..."
        {...register('name')}
        error={errors.name?.message}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Tipo"
          id="type"
          options={typeOptions}
          {...register('type')}
          error={errors.type?.message}
        />

        <Input
          label={
            selectedType === AccountType.CREDIT_CARD
              ? 'Limite Disponível (R$)'
              : selectedType === AccountType.INVESTMENT
                ? 'Saldo em Caixa (R$)'
                : 'Saldo Atual (R$)'
          }
          id="balance"
          type="number"
          step="0.01"
          placeholder="0,00"
          {...register('balance')}
          error={errors.balance?.message}
        />
      </div>

      {/* Campo Condicional de Limite */}
      {selectedType === AccountType.CREDIT_CARD && (
        <div className="animate-in fade-in slide-in-from-top-2">
          <Input
            label="Limite Total do Cartão (R$)"
            id="creditLimit"
            type="number"
            step="0.01"
            placeholder="Ex: 5000,00"
            {...register('creditLimit')}
            error={errors.creditLimit?.message}
          />
          <p className="text-xs text-slate-500 mt-1">
            Defina o limite total do cartão para calcularmos o uso.
          </p>
        </div>
      )}

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
          {initialData ? 'Atualizar Conta' : 'Criar Conta'}
        </Button>
      </div>
    </form>
  );
}
