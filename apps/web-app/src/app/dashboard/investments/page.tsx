'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Investment } from '@fayol/shared-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { InvestmentForm } from '@/components/forms/investment-form';
import {
  Plus,
  Loader2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Briefcase,
  Pencil,
  Trash2,
} from 'lucide-react';

interface InvestmentWithTotals extends Investment {
  totalValue: number;
  yield: number;
  account?: { name: string };
}

export default function InvestmentsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | undefined>(undefined);

  // Busca de Investimentos
  const {
    data: investments,
    isLoading,
    isError,
    refetch,
  } = useQuery<InvestmentWithTotals[]>({
    queryKey: ['investments'],
    queryFn: async () => {
      const response = await api.get('/investments');
      return response.data.data;
    },
  });

  // Mutação de Exclusão
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/investments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
    },
    onError: () => {
      alert('Erro ao excluir investimento.');
    },
  });

  const handleSuccess = () => {
    setIsModalOpen(false);
    setEditingInvestment(undefined);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingInvestment(undefined);
  };

  const handleEdit = (investment: Investment) => {
    setEditingInvestment(investment);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este ativo da carteira?')) {
      deleteMutation.mutate(id);
    }
  };

  // Função auxiliar para formatar moeda baseada no tipo
  const formatCurrency = (value: number, type: string) => {
    const currency = type === 'STOCK_US' || type === 'CRYPTO' ? 'USD' : 'BRL';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  // Calcula total aproximado (convertendo tudo para BRL apenas para o card de resumo)
  const US_DOLLAR_RATE = 5.0;

  const portfolioTotalBRL =
    investments?.reduce((acc, curr) => {
      let valueInBRL = Number(curr.totalValue || 0);
      if (curr.type === 'STOCK_US' || curr.type === 'CRYPTO') {
        valueInBRL = valueInBRL * US_DOLLAR_RATE;
      }
      return acc + valueInBRL;
    }, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header & Resumo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Investimentos</h1>
          <p className="text-sm text-slate-500">Acompanhe a evolução do seu património</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Ativo
        </Button>
      </div>

      {/* Card de Resumo Total */}
      {!isLoading && !isError && (investments?.length ?? 0) > 0 && (
        <Card className="bg-slate-900 text-white border-none">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Patrimônio Total (Est. em BRL)</p>
              <h2 className="text-3xl font-bold mt-1">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(portfolioTotalBRL)}
              </h2>
            </div>
            <div className="h-12 w-12 bg-slate-800 rounded-full flex items-center justify-center text-emerald-400">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Ativos */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : isError ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-center justify-center py-8 text-red-600">
            <AlertTriangle className="h-10 w-10 mb-2" />
            <p className="font-medium">Erro ao carregar carteira</p>
            <Button
              variant="outline"
              className="mt-4 border-red-200 hover:bg-red-100 text-red-700"
              onClick={() => refetch()}
            >
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      ) : investments?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-slate-500">
            <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Briefcase className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="font-medium text-lg text-slate-900">Carteira Vazia</h3>
            <p className="text-sm mt-1 max-w-xs text-center">
              Adicione seus investimentos para acompanhar rendimentos e evolução.
            </p>
            <Button className="mt-6" onClick={() => setIsModalOpen(true)}>
              Adicionar Primeiro Ativo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {investments?.map((inv) => {
            const isPositive = inv.yield >= 0;
            const currencyFormattedTotal = formatCurrency(Number(inv.totalValue), inv.type);
            const currencyFormattedPrice = formatCurrency(Number(inv.averagePrice), inv.type);

            return (
              <Card key={inv.id} className="hover:shadow-md transition-shadow group relative">
                {/* Botões de Ação */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-lg p-1 z-10">
                  <button
                    onClick={() => handleEdit(inv)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(inv.id)}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start pr-16">
                    <div>
                      <CardTitle className="text-lg font-bold">{inv.ticker || inv.name}</CardTitle>
                      <p className="text-xs text-slate-500 truncate max-w-[150px]">{inv.name}</p>
                    </div>
                    <Badge variant="outline">{inv.type.replace('_', ' ')}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-slate-500">Total</p>
                        <p className="text-xl font-semibold text-slate-900">
                          {currencyFormattedTotal}
                        </p>
                      </div>
                      <div
                        className={`flex items-center text-sm font-medium ${
                          isPositive ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        )}
                        {inv.yield.toFixed(2)}%
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 block">Quantidade</span>
                        <span className="font-medium text-slate-700">{Number(inv.quantity)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Preço Médio</span>
                        <span className="font-medium text-slate-700">{currencyFormattedPrice}</span>
                      </div>
                      <div className="col-span-2 mt-1">
                        <span className="text-slate-500 block">Custódia</span>
                        <span className="font-medium text-slate-700">
                          {inv.account?.name || 'Desconhecida'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingInvestment ? 'Editar Investimento' : 'Novo Investimento'}
      >
        <InvestmentForm
          initialData={editingInvestment}
          onSuccess={handleSuccess}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}
