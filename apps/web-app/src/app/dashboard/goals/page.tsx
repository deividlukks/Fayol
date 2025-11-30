'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Goal } from '@fayol/shared-types';
import { CurrencyUtils, DateUtils } from '@fayol/shared-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Progress } from '@/components/ui/progress';
import { GoalForm } from '@/components/forms/goal-form';
import { Plus, Loader2, Target, Pencil, Trash2, Calendar } from 'lucide-react';

export default function GoalsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>(undefined);

  // Busca de Metas
  const {
    data: goals,
    isLoading,
    isError,
  } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: async () => {
      const response = await api.get('/goals');
      return response.data.data;
    },
  });

  // Mutação de Exclusão
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Nota: Você precisará garantir que o endpoint DELETE exista no backend
      return api.delete(`/goals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
    onError: () => {
      alert('Erro ao excluir meta.');
    },
  });

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta meta?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGoal(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Minhas Metas</h1>
          <p className="text-sm text-slate-500">Defina objetivos e acompanhe seu progresso</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Meta
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : isError ? (
        <div className="p-4 text-center text-red-500 bg-red-50 rounded-lg">
          Erro ao carregar metas. Tente recarregar a página.
        </div>
      ) : goals?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Target className="h-10 w-10 mb-4 text-slate-300" />
            <h3 className="font-medium text-lg text-slate-900">Nenhuma meta definida</h3>
            <p className="text-sm mt-1 max-w-xs text-center">
              Crie metas para viagens, compras ou reserva de emergência.
            </p>
            <Button className="mt-6" onClick={() => setIsModalOpen(true)}>
              Criar Primeira Meta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals?.map((goal) => {
            const current = Number(goal.currentAmount);
            const target = Number(goal.targetAmount);
            const percent = Math.min((current / target) * 100, 100);
            const remaining = target - current;

            return (
              <Card key={goal.id} className="group relative hover:shadow-md transition-shadow">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-lg p-1 z-10">
                  <button
                    onClick={() => handleEdit(goal)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${goal.color || 'bg-blue-500'}`}
                    >
                      <Target className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold bg-slate-100 px-2 py-1 rounded text-slate-600">
                      {percent.toFixed(0)}%
                    </span>
                  </div>
                  <CardTitle
                    className="mt-3 text-lg font-bold text-slate-900 truncate"
                    title={goal.title}
                  >
                    {goal.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Acumulado</span>
                      <span className="font-bold text-slate-900">
                        {CurrencyUtils.format(current)}
                      </span>
                    </div>
                    <Progress
                      value={percent}
                      className="h-2"
                      indicatorColor={goal.color || 'bg-blue-500'}
                    />
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Meta: {CurrencyUtils.format(target)}</span>
                      <span>Falta: {CurrencyUtils.format(Math.max(0, remaining))}</span>
                    </div>
                  </div>

                  {goal.deadline && (
                    <div className="pt-3 border-t border-slate-100 flex items-center text-xs text-slate-500">
                      <Calendar className="h-3 w-3 mr-1.5" />
                      Alvo: {DateUtils.formatDate(goal.deadline)}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingGoal ? 'Editar Meta' : 'Nova Meta Financeira'}
      >
        <GoalForm
          initialData={editingGoal}
          onSuccess={() => {
            handleCloseModal();
            queryClient.invalidateQueries({ queryKey: ['goals'] });
          }}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}
