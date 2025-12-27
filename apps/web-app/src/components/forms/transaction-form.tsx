'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTransactionSchema, CreateTransactionInput } from '@fayol/validation-schemas';
import { Account, Category, LaunchType, Recurrence, Transaction } from '@fayol/shared-types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import { DateUtils } from '@fayol/shared-utils';

interface CategoryWithChildren extends Category {
  children?: Category[];
}

interface TransactionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Transaction;
}

// Função auxiliar para pegar YYYY-MM-DD local e evitar problemas de timezone
const getLocalDateString = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offset);
  return localDate.toISOString().split('T')[0];
};

export function TransactionForm({ onSuccess, onCancel, initialData }: TransactionFormProps) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedParentCategory, setSelectedParentCategory] = useState<string>('');

  const launchDateFormatted = initialData
    ? DateUtils.formatDate(initialData.createdAt)
    : DateUtils.formatDate(new Date());

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: async () => (await api.get('/accounts')).data.data,
  });

  const { data: categories = [] } = useQuery<CategoryWithChildren[]>({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data.data,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
    shouldUnregister: true, // IMPORTANTE: Desregistra campos ocultos (destinationAccountId)
    defaultValues: {
      date: new Date(),
      isPaid: true,
      type: LaunchType.EXPENSE,
      recurrence: Recurrence.NONE,
    },
  });

  const selectedType = watch('type');
  const selectedAccount = watch('accountId');

  // Efeito para carregar dados de edição
  useEffect(() => {
    if (initialData && categories.length > 0) {
      const formDate = new Date(initialData.date);
      reset({
        description: initialData.description,
        amount: Number(initialData.amount),
        date: formDate,
        type: initialData.type,
        accountId: initialData.accountId,
        isPaid: initialData.isPaid,
        recurrence: initialData.recurrence,
        categoryId: initialData.categoryId || '',
      });

      if (initialData.categoryId) {
        const isParent = categories.find((c) => c.id === initialData.categoryId);
        if (isParent) {
          setSelectedParentCategory(isParent.id);
        } else {
          const parent = categories.find((p) =>
            p.children?.some((child) => child.id === initialData.categoryId)
          );
          if (parent) setSelectedParentCategory(parent.id);
        }
      }
    }
  }, [initialData, categories, reset]);

  // Filtra Categorias
  const filteredParentCategories = categories.filter((cat) => cat.type === selectedType);
  const currentParent = categories.find((c) => c.id === selectedParentCategory);
  const subCategories = currentParent?.children || [];

  // Filtra Contas de Destino (não pode ser a mesma da origem)
  const destinationAccountOptions = accounts
    .filter((acc) => acc.id !== selectedAccount)
    .map((acc) => ({ label: acc.name, value: acc.id }));

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as LaunchType;
    setValue('type', newType);
    setSelectedParentCategory('');
    setValue('categoryId', '');
    if (newType !== LaunchType.TRANSFER) {
      setValue('destinationAccountId', undefined);
    }
  };

  const saveTransactionMutation = useMutation({
    mutationFn: async (data: CreateTransactionInput) => {
      const payload = { ...data, amount: Number(data.amount) };
      if (initialData?.id) {
        return api.patch(`/transactions/${initialData.id}`, payload);
      } else {
        return api.post('/transactions', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] }); // Atualiza saldo das contas
      onSuccess();
    },
    onError: (error: AxiosError<{ message: string }>) => {
      setServerError(error.response?.data?.message || 'Erro ao salvar transação.');
    },
  });

  const onSubmit = (data: CreateTransactionInput) => {
    setServerError(null);
    saveTransactionMutation.mutate(data);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onInvalid = (errors: any) => {
    console.error('Erros de validação:', errors);
  };

  const accountOptions = accounts.map((acc) => ({
    label: acc.name,
    value: acc.id,
  }));

  const typeOptions = [
    { label: 'Despesa', value: LaunchType.EXPENSE },
    { label: 'Receita', value: LaunchType.INCOME },
    { label: 'Transferência', value: LaunchType.TRANSFER },
  ];

  const recurrenceOptions = [
    { label: 'Não se repete', value: Recurrence.NONE },
    { label: 'Diariamente', value: Recurrence.DAILY },
    { label: 'Semanalmente', value: Recurrence.WEEKLY },
    { label: 'Mensalmente', value: Recurrence.MONTHLY },
    { label: 'Anualmente', value: Recurrence.YEARLY },
  ];

  const parentCategoryOptions = filteredParentCategories.map((cat) => ({
    label: `${cat.icon || ''} ${cat.name}`,
    value: cat.id,
  }));

  const subCategoryOptions = subCategories.map((cat) => ({
    label: cat.name,
    value: cat.id,
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Tipo"
          id="type"
          options={typeOptions}
          {...register('type')}
          onChange={handleTypeChange}
          error={errors.type?.message}
        />
        <Select
          label="Recorrência"
          id="recurrence"
          options={recurrenceOptions}
          {...register('recurrence')}
          error={errors.recurrence?.message}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Data de Lançamento"
          id="launchDate"
          value={launchDateFormatted}
          disabled
          className="bg-slate-50 text-slate-500 cursor-not-allowed"
        />
        <Input
          label="Data de Efetivação"
          id="date"
          type="date"
          {...register('date', { valueAsDate: true })}
          defaultValue={
            initialData
              ? getLocalDateString(new Date(initialData.date))
              : getLocalDateString(new Date())
          }
          error={errors.date?.message}
        />
      </div>

      <Input
        label="Descrição"
        id="description"
        placeholder="Ex: Transferência para Investimento"
        {...register('description')}
        error={errors.description?.message}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Valor (R$)"
          id="amount"
          type="number"
          step="0.01"
          placeholder="0,00"
          {...register('amount', { valueAsNumber: true })}
          error={errors.amount?.message}
        />
        <Select
          label="Conta de Origem"
          id="accountId"
          placeholder="Selecione..."
          options={accountOptions}
          {...register('accountId')}
          error={errors.accountId?.message}
        />
      </div>

      {/* Campo Condicional: Conta de Destino */}
      {selectedType === LaunchType.TRANSFER && (
        <div className="animate-in fade-in slide-in-from-top-2">
          <Select
            label="Conta de Destino"
            id="destinationAccountId"
            placeholder="Para onde vai o dinheiro?"
            options={destinationAccountOptions}
            {...register('destinationAccountId')}
            error={errors.destinationAccountId?.message}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
        <Select
          label="Categoria Principal"
          id="parentCategory"
          placeholder="Selecione..."
          options={parentCategoryOptions}
          value={selectedParentCategory}
          onChange={(e) => {
            setSelectedParentCategory(e.target.value);
            setValue('categoryId', '');
          }}
        />

        <Select
          label="Subcategoria"
          id="categoryId"
          placeholder={selectedParentCategory ? 'Selecione...' : 'Escolha a principal primeiro'}
          options={subCategoryOptions}
          disabled={!selectedParentCategory || subCategories.length === 0}
          {...register('categoryId')}
          error={errors.categoryId?.message}
        />
      </div>

      <div className="flex flex-col space-y-2 pt-2">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            {...register('isPaid')}
          />
          <span className="text-sm font-medium text-slate-700">
            {watch('type') === LaunchType.INCOME ? 'Recebido / Confirmado' : 'Pago / Confirmado'}
          </span>
        </label>
      </div>

      {serverError && (
        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center animate-in fade-in">
          {serverError}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
          {initialData ? 'Atualizar' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}
