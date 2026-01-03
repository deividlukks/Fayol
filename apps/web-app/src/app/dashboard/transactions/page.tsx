'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Transaction, LaunchType } from '@fayol/shared-types';
import { DateUtils, CurrencyUtils } from '@fayol/shared-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { TransactionForm } from '@/components/forms/transaction-form';
import { Plus, Search, Filter, Loader2, Pencil, Trash2 } from 'lucide-react';

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);

  // Busca de Transações
  const {
    data: transactions,
    isLoading,
    isError,
    refetch,
  } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await api.get('/transactions');
      return response.data.data;
    },
  });

  // Mutação de Exclusão
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: () => {
      alert('Erro ao excluir transação.');
    },
  });

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (
      confirm('Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.')
    ) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(undefined); // Limpa estado de edição ao fechar
  };

  const filteredTransactions = transactions?.filter((t) =>
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transações</h1>
          <p className="text-sm text-slate-500">Gerencie suas receitas e despesas</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Transação
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por descrição..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="sm:w-auto">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Conta</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Carregando transações...
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-red-500">
                    <div className="flex flex-col items-center gap-2">
                      <p>Erro ao carregar transações.</p>
                      <Button variant="outline" size="sm" onClick={() => refetch()}>
                        Tentar Novamente
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              ) : (
                filteredTransactions?.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {DateUtils.formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {/* @ts-expect-error: Tipo category pode vir do backend */}
                      {transaction.category?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {/* @ts-expect-error: Tipo account pode vir do backend */}
                      {transaction.account?.name}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold whitespace-nowrap">
                      <div
                        className={`flex items-center justify-end gap-1 ${
                          transaction.type === LaunchType.INCOME
                            ? 'text-emerald-600'
                            : transaction.type === LaunchType.TRANSFER
                              ? 'text-slate-600'
                              : 'text-red-600'
                        }`}
                      >
                        {transaction.type === LaunchType.INCOME
                          ? '+'
                          : transaction.type === LaunchType.EXPENSE
                            ? '-'
                            : ''}{' '}
                        {CurrencyUtils.format(Number(transaction.amount))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={transaction.isPaid ? 'success' : 'warning'}>
                        {transaction.isPaid ? 'Efetuado' : 'Pendente'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de Criação/Edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTransaction ? 'Editar Transação' : 'Nova Transação'}
      >
        <TransactionForm
          initialData={editingTransaction}
          onSuccess={handleCloseModal}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}
