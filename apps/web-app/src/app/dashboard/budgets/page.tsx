'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Budget } from '@fayol/shared-types';
import { DateUtils, CurrencyUtils, FinancialUtils } from '@fayol/shared-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Modal } from '@/components/ui/modal';
import { BudgetForm } from '@/components/forms/budget-form';
import { Plus, Loader2, AlertTriangle, Pencil, Trash2 } from 'lucide-react';

export default function BudgetsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>(undefined);

  // Busca de Orçamentos
  const {
    data: budgets,
    isLoading,
    isError,
    refetch,
  } = useQuery<Budget[]>({
    queryKey: ['budgets'],
    queryFn: async () => {
      const response = await api.get('/budgets');
      return response.data.data;
    },
  });

  // Mutação de Exclusão
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/budgets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
    onError: () => {
      alert('Erro ao excluir orçamento.');
    },
  });

  const handleSuccess = () => {
    setIsModalOpen(false);
    setEditingBudget(undefined);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBudget(undefined);
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este orçamento?')) {
      deleteMutation.mutate(id);
    }
  };

  // Função auxiliar para determinar a cor da barra de progresso
  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'bg-red-500';
    if (percent >= 80) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orçamentos</h1>
          <p className="text-sm text-slate-500">Planeje e controle seus limites de gastos</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      {/* Lista de Orçamentos */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : isError ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-center justify-center py-8 text-red-600">
            <AlertTriangle className="h-10 w-10 mb-2" />
            <p className="font-medium">Erro ao carregar orçamentos</p>
            <Button
              variant="outline"
              className="mt-4 border-red-200 hover:bg-red-100 text-red-700"
              onClick={() => refetch()}
            >
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      ) : budgets?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-slate-500">
            <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="font-medium text-lg text-slate-900">Nenhum orçamento criado</h3>
            <p className="text-sm mt-1 max-w-xs text-center">
              Defina limites para categorias ou gastos globais para manter suas finanças em dia.
            </p>
            <Button className="mt-6" onClick={() => setIsModalOpen(true)}>
              Criar Primeiro Orçamento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets?.map((budget) => {
            const progress = FinancialUtils.calculateBudgetProgress(
              Number(budget.spent),
              Number(budget.amount)
            );
            const remaining = Number(budget.amount) - Number(budget.spent);
            const isExceeded = remaining < 0;

            return (
              <Card key={budget.id} className="overflow-hidden group relative">
                {/* Botões de Ação (aparecem no hover em desktop ou sempre visíveis se preferir) */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-lg p-1">
                  <button
                    onClick={() => handleEdit(budget)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(budget.id)}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <CardHeader className="pb-4 border-b border-slate-50 bg-slate-50/50">
                  <div className="flex justify-between items-start pr-16">
                    {' '}
                    {/* pr-16 para não sobrepor os botões */}
                    <div>
                      <CardTitle className="text-lg">{budget.name}</CardTitle>
                      <p className="text-xs text-slate-500 mt-1">
                        {DateUtils.formatDate(budget.startDate)} até{' '}
                        {DateUtils.formatDate(budget.endDate)}
                      </p>
                    </div>
                    {/* @ts-expect-error: Categoria populada via include do Prisma */}
                    {budget.category ? (
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md font-medium">
                        {/* @ts-expect-error: Categoria populada via include do Prisma */}
                        {budget.category.name}
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md font-medium">
                        Global
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Valores */}
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Gasto
                      </p>
                      <p className="text-2xl font-bold text-slate-900">
                        {CurrencyUtils.format(Number(budget.spent))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Limite
                      </p>
                      <p className="text-lg font-semibold text-slate-700">
                        {CurrencyUtils.format(Number(budget.amount))}
                      </p>
                    </div>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span
                        className={`font-medium ${isExceeded ? 'text-red-600' : 'text-slate-600'}`}
                      >
                        {progress.toFixed(1)}% utilizado
                      </span>
                      <span className="text-slate-500">
                        {isExceeded
                          ? `Excedido em ${CurrencyUtils.format(Math.abs(remaining))}`
                          : `Resta ${CurrencyUtils.format(remaining)}`}
                      </span>
                    </div>
                    <Progress value={progress} indicatorColor={getProgressColor(progress)} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Criação/Edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingBudget ? 'Editar Orçamento' : 'Novo Orçamento'}
      >
        <BudgetForm
          initialData={editingBudget}
          onSuccess={handleSuccess}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}
