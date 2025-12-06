'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createInvestmentSchema, CreateInvestmentInput } from '@fayol/validation-schemas';
import { Account, AccountType, Investment } from '@fayol/shared-types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import { Loader2 } from 'lucide-react';

interface InvestmentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Partial<Investment>; // Tipagem melhorada
}

export function InvestmentForm({ onSuccess, onCancel, initialData }: InvestmentFormProps) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Busca contas para vincular o ativo (Custódia)
  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: async () => (await api.get('/accounts')).data.data,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateInvestmentInput>({
    resolver: zodResolver(createInvestmentSchema),
    defaultValues: {
      purchaseDate: new Date(),
      quantity: 1,
      type: 'STOCK', // Valor padrão
    },
  });

  // Carrega dados iniciais para edição
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        ticker: initialData.ticker || undefined,
        quantity: Number(initialData.quantity),
        averagePrice: Number(initialData.averagePrice),
        currentPrice: initialData.currentPrice ? Number(initialData.currentPrice) : undefined,
        type: initialData.type,
        purchaseDate: initialData.purchaseDate ? new Date(initialData.purchaseDate) : new Date(),
        accountId: initialData.accountId,
      });
    }
  }, [initialData, reset]);

  // Monitora o campo ticker para auto-preenchimento
  const tickerValue = watch('ticker');

  useEffect(() => {
    if (initialData && tickerValue === initialData.ticker) return;

    const lookupTicker = async () => {
      if (!tickerValue || tickerValue.length < 3) return;

      setIsSearching(true);
      try {
        const response = await api.get(`/investments/lookup/${tickerValue}`);
        const data = response.data;
        const asset = data.data || data;

        if (asset) {
          setValue('name', asset.name);
          setValue('type', asset.type);
          setValue('averagePrice', asset.price);
          setServerError(null);
        }
      } catch (error) {
        console.error('Erro ao buscar ticker', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (tickerValue) lookupTicker();
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [tickerValue, setValue, initialData]);

  // Mutation para criar investimento
  const createInvestmentMutation = useMutation({
    mutationFn: async (data: CreateInvestmentInput) => {
      const payload = {
        ...data,
        quantity: Number(data.quantity),
        averagePrice: Number(data.averagePrice),
        currentPrice: data.currentPrice ? Number(data.currentPrice) : undefined,
      };
      return api.post('/investments', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] }); // Atualiza saldo das contas
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      onSuccess();
    },
    onError: (error: AxiosError<{ message: string }>) => {
      setServerError(error.response?.data?.message || 'Erro ao registrar investimento.');
    },
  });

  const onSubmit = (data: CreateInvestmentInput) => {
    setServerError(null);
    createInvestmentMutation.mutate(data);
  };

  // CORREÇÃO: Filtrar apenas contas do tipo INVESTIMENTO
  const investmentAccounts = accounts
    .filter((acc) => acc.type === AccountType.INVESTMENT)
    .map((acc) => ({
      label: acc.name,
      value: acc.id,
    }));

  const typeOptions = [
    { label: 'Ação (BR)', value: 'STOCK' },
    { label: 'Fundo Imobiliário (FII)', value: 'FII' },
    { label: 'Criptomoeda', value: 'CRYPTO' },
    { label: 'Renda Fixa (CDB/Tesouro)', value: 'FIXED' },
    { label: 'Stock (USA)', value: 'STOCK_US' },
    { label: 'ETF', value: 'ETF' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <Input
            label="Ticker (Código)"
            id="ticker"
            placeholder="Ex: PETR4"
            {...register('ticker')}
            error={errors.ticker?.message}
          />
          {isSearching && (
            <div className="absolute right-3 top-9">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            </div>
          )}
        </div>

        <Input
          label="Nome do Ativo"
          id="name"
          placeholder="Preenchimento automático..."
          {...register('name')}
          error={errors.name?.message}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Tipo de Ativo"
          id="type"
          options={typeOptions}
          {...register('type')}
          error={errors.type?.message}
        />
        <Select
          label="Conta de Custódia"
          id="accountId"
          placeholder={
            investmentAccounts.length > 0
              ? 'Selecione a corretora...'
              : 'Nenhuma conta de investimento encontrada'
          }
          options={investmentAccounts}
          {...register('accountId')}
          error={errors.accountId?.message}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Qtd."
          id="quantity"
          type="number"
          step="0.00000001"
          {...register('quantity', { valueAsNumber: true })}
          error={errors.quantity?.message}
        />
        <Input
          label="Preço (Unitário)"
          id="averagePrice"
          type="number"
          step="0.01"
          placeholder="0,00"
          {...register('averagePrice', { valueAsNumber: true })}
          error={errors.averagePrice?.message}
        />
        <Input
          label="Data Compra"
          id="purchaseDate"
          type="date"
          {...register('purchaseDate', { valueAsDate: true })}
          defaultValue={new Date().toISOString().split('T')[0]}
          error={errors.purchaseDate?.message}
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
          Adicionar Ativo
        </Button>
      </div>
    </form>
  );
}
