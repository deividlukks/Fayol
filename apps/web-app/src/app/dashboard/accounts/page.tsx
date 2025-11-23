'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Account, AccountType } from '@fayol/shared-types';
import { CurrencyUtils } from '@fayol/shared-utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Progress } from '@/components/ui/progress';
import { AccountForm } from '@/components/forms/account-form';
import {
  Plus,
  Loader2,
  AlertTriangle,
  Wallet,
  Landmark,
  PiggyBank,
  CreditCard,
  Banknote,
  HelpCircle,
  Pencil,
  Trash2,
  TrendingUp,
  LucideIcon, // Importado para tipagem
} from 'lucide-react';

export default function AccountsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | undefined>(undefined);

  // Busca de Contas
  const {
    data: accounts,
    isLoading,
    isError,
    refetch,
  } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await api.get('/accounts');
      return response.data.data;
    },
  });

  // Mutação de Exclusão
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: () => {
      alert('Erro ao excluir conta.');
    },
  });

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAccount(undefined);
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta conta?')) {
      deleteMutation.mutate(id);
    }
  };

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case AccountType.CHECKING:
        return Landmark;
      case AccountType.SAVINGS:
        return PiggyBank;
      case AccountType.INVESTMENT:
        return TrendingUp;
      case AccountType.CREDIT_CARD:
        return CreditCard;
      case AccountType.CASH:
        return Banknote;
      default:
        return HelpCircle;
    }
  };

  // Renderizador de Card Padrão
  const renderDefaultCard = (account: Account, Icon: LucideIcon) => (
    <Card key={account.id} className="hover:shadow-md transition-shadow group relative">
      {renderActions(account)}
      <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0 pr-14">
        <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
          <Icon className="h-5 w-5" />
        </div>
        <Badge variant="default">{account.type.replace('_', ' ')}</Badge>
      </CardHeader>
      <CardContent>
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-slate-900 truncate pr-2" title={account.name}>
            {account.name}
          </h3>
          <p className="text-2xl font-bold text-slate-700 mt-1">
            {CurrencyUtils.format(Number(account.balance))}
          </p>
          <p className="text-xs text-slate-400 mt-1">Saldo Atual</p>
        </div>
      </CardContent>
    </Card>
  );

  // Renderizador de Card de Cartão de Crédito
  const renderCreditCard = (account: Account, Icon: LucideIcon) => {
    const limit = Number(account.creditLimit || 0);
    const available = Number(account.balance);
    const used = limit - available;
    const progress = limit > 0 ? (used / limit) * 100 : 0;

    return (
      <Card
        key={account.id}
        className="hover:shadow-md transition-shadow group relative border-l-4 border-l-amber-500"
      >
        {renderActions(account)}
        <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0 pr-14">
          <div className="h-10 w-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
            <Icon className="h-5 w-5" />
          </div>
          <Badge variant="warning">Cartão de Crédito</Badge>
        </CardHeader>
        <CardContent>
          <div className="mt-4 mb-4">
            <h3 className="text-lg font-semibold text-slate-900 truncate pr-2">{account.name}</h3>
            <div className="flex justify-between items-end mt-1">
              <div>
                <p className="text-xs text-slate-500">Limite Disponível</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {CurrencyUtils.format(available)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Fatura Atual (Est.)</p>
                <p className="text-sm font-semibold text-red-600">{CurrencyUtils.format(used)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Utilizado {progress.toFixed(0)}%</span>
              <span>Limite {CurrencyUtils.format(limit)}</span>
            </div>
            <Progress value={progress} indicatorColor="bg-amber-500" className="h-1.5" />
          </div>
        </CardContent>
      </Card>
    );
  };

  // Renderizador de Card de Investimento
  const renderInvestmentCard = (account: Account, Icon: LucideIcon) => {
    const cashBalance = Number(account.balance);
    const invested = Number(account.totalInvested || 0);
    const total = Number(account.totalConsolidated || cashBalance);

    return (
      <Card
        key={account.id}
        className="hover:shadow-md transition-shadow group relative border-l-4 border-l-purple-500"
      >
        {renderActions(account)}
        <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0 pr-14">
          <div className="h-10 w-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
            <Icon className="h-5 w-5" />
          </div>
          <Badge variant="success" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
            Investimento
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-slate-900 truncate pr-2">{account.name}</h3>

            <div className="mt-3 space-y-3">
              {/* Saldo Total Consolidado */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-600">Patrimônio Total</span>
                <span className="text-lg font-bold text-slate-900">
                  {CurrencyUtils.format(total)}
                </span>
              </div>

              {/* Detalhamento */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded">
                  <p className="text-slate-500 mb-1">Em Ativos</p>
                  <p className="font-semibold text-purple-700">{CurrencyUtils.format(invested)}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <p className="text-slate-500 mb-1">Saldo em Caixa</p>
                  <p className="font-semibold text-emerald-600">
                    {CurrencyUtils.format(cashBalance)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderActions = (account: Account) => (
    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-lg p-1 z-10">
      <button
        onClick={() => handleEdit(account)}
        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        title="Editar / Ajustar Limite"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleDelete(account.id)}
        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
        title="Arquivar"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Minhas Contas</h1>
          <p className="text-sm text-slate-500">Gerencie seus saldos e fontes de recursos</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      {/* Lista de Contas */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : isError ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-center justify-center py-8 text-red-600">
            <AlertTriangle className="h-10 w-10 mb-2" />
            <p className="font-medium">Erro ao carregar contas</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-4">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      ) : accounts?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Wallet className="h-10 w-10 mb-4 text-slate-300" />
            <h3 className="font-medium text-lg text-slate-900">Nenhuma conta encontrada</h3>
            <Button className="mt-6" onClick={() => setIsModalOpen(true)}>
              Criar Primeira Conta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts?.map((account) => {
            const Icon = getAccountIcon(account.type);

            if (account.type === AccountType.CREDIT_CARD) {
              return renderCreditCard(account, Icon);
            }
            if (account.type === AccountType.INVESTMENT) {
              return renderInvestmentCard(account, Icon);
            }
            return renderDefaultCard(account, Icon);
          })}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={
          editingAccount
            ? editingAccount.type === AccountType.CREDIT_CARD
              ? 'Ajustar Cartão'
              : 'Editar Conta'
            : 'Nova Conta'
        }
      >
        <AccountForm
          initialData={editingAccount}
          onSuccess={() => {
            handleCloseModal();
            refetch(); // Garante refresh
          }}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}
