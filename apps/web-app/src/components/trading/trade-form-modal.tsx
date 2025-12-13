'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { tradingService, CreateTradeInput } from '@fayol/api-client';
import { TradeType } from '@fayol/shared-types';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useAccounts } from '@/hooks/useAccounts';

const tradeSchema = z.object({
  ticker: z.string().min(3, 'Código inválido (ex: PETR4)'),
  type: z.enum(['BUY', 'SELL']),
  quantity: z.coerce.number().positive('Qtd deve ser > 0'),
  price: z.coerce.number().positive('Preço deve ser > 0'),
  accountId: z.string().uuid('Selecione uma conta válida'),
  date: z.string(),
});

type TradeFormData = z.infer<typeof tradeSchema>;

interface TradeFormModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function TradeFormModal({ isOpen = false, onClose, onSuccess }: TradeFormModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInternalOpen(isOpen);
  }, [isOpen]);

  const handleClose = () => {
    setInternalOpen(false);
    if (onClose) onClose();
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<TradeFormData>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      type: 'BUY',
      date: new Date().toISOString().split('T')[0],
    },
  });

  const qtd = watch('quantity') || 0;
  const price = watch('price') || 0;
  const total = qtd * price;

  // Accounts
  const { data: accounts } = useAccounts();
  const accountList = accounts || [];

  useEffect(() => {
    if (accountList.length > 0) {
      // set default account if not set
      const current = watch('accountId');
      if (!current) setValue('accountId', accountList[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountList]);

  const onSubmit = async (data: TradeFormData) => {
    setLoading(true);
    try {
      const tradeType: TradeType = data.type === 'BUY' ? TradeType.BUY : TradeType.SELL;

      const payload: CreateTradeInput = {
        symbol: data.ticker.toUpperCase().trim(),
        type: tradeType,
        quantity: Number(data.quantity),
        price: Number(data.price),
        date: new Date(data.date).toISOString(),
        fees: 0,
        accountId: data.accountId,
      };

      await tradingService.createTrade(payload);

      reset();
      handleClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erro ao enviar ordem', error);
      alert('Erro ao enviar ordem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Lançar Ordem"
      isOpen={internalOpen}
      onClose={handleClose}
      // REMOVIDO: description="Registre suas compras e vendas de ativos."
    >
      {/* Texto de descrição movido para cá */}
      <div className="mb-4 text-sm text-slate-500">
        Registre suas compras e vendas de ativos para controlar sua carteira.
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Tipo de Operação */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            type="button"
            variant={watch('type') === 'BUY' ? 'primary' : 'outline'}
            className={
              watch('type') === 'BUY'
                ? 'bg-emerald-600 hover:bg-emerald-700 border-transparent text-white'
                : ''
            }
            onClick={() => setValue('type', 'BUY')}
          >
            Compra
          </Button>
          <Button
            type="button"
            variant={watch('type') === 'SELL' ? 'primary' : 'outline'}
            className={
              watch('type') === 'SELL'
                ? 'bg-red-600 hover:bg-red-700 border-transparent text-white'
                : ''
            }
            onClick={() => setValue('type', 'SELL')}
          >
            Venda
          </Button>
        </div>

        {/* Ticker */}
        <div className="space-y-2">
          <label htmlFor="ticker" className="text-sm font-medium leading-none">
            Ativo (Ticker)
          </label>
          <Input
            id="ticker"
            placeholder="Ex: PETR4"
            {...register('ticker')}
            className="uppercase"
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase();
              register('ticker').onChange(e);
            }}
          />
          {errors.ticker && <span className="text-xs text-red-500">{errors.ticker.message}</span>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Quantidade */}
          <div className="space-y-2">
            <label htmlFor="quantity" className="text-sm font-medium leading-none">
              Qtd
            </label>
            <Input id="quantity" type="number" step="1" {...register('quantity')} />
            {errors.quantity && (
              <span className="text-xs text-red-500">{errors.quantity.message}</span>
            )}
          </div>

          {/* Preço */}
          <div className="space-y-2">
            <label htmlFor="price" className="text-sm font-medium leading-none">
              Preço Unit.
            </label>
            <Input id="price" type="number" step="0.01" {...register('price')} />
            {errors.price && <span className="text-xs text-red-500">{errors.price.message}</span>}
          </div>
        </div>

        {/* Data */}
        <div className="space-y-2">
          <label htmlFor="date" className="text-sm font-medium leading-none">
            Data da Operação
          </label>
          <Input id="date" type="date" {...register('date')} />
        </div>

        {/* Resumo */}
        <div className="bg-slate-50 p-3 rounded-md text-right">
          <span className="text-sm text-slate-500">Total Estimado:</span>
          <p className="text-xl font-bold text-slate-900">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
            Confirmar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
