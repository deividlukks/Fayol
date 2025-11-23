'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CurrencyUtils } from '@fayol/shared-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Loader2,
  TrendingUp,
  CreditCard,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Transaction, LaunchType } from '@fayol/shared-types';
import { DateUtils } from '@fayol/shared-utils';

// Tipos para os gráficos
interface CashFlowData {
  date: string;
  income: number;
  expense: number;
  [key: string]: any;
}

interface CategoryExpenseData {
  id: string;
  name: string;
  value: number;
  color: string;
  [key: string]: any;
}

// Paleta de cores vibrante para o gráfico
const CHART_COLORS = [
  '#2563eb', // Blue 600
  '#16a34a', // Green 600
  '#dc2626', // Red 600
  '#d97706', // Amber 600
  '#7c3aed', // Violet 600
  '#db2777', // Pink 600
  '#0891b2', // Cyan 600
  '#ea580c', // Orange 600
  '#4f46e5', // Indigo 600
  '#ca8a04', // Yellow 600
];

export default function DashboardPage() {
  // 1. Busca Resumo (Cards)
  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => (await api.get('/reports/summary')).data.data,
  });

  // 2. Busca Fluxo de Caixa (Gráfico de Barras)
  const { data: cashFlow, isLoading: isLoadingCashFlow } = useQuery<CashFlowData[]>({
    queryKey: ['dashboard-cashflow'],
    queryFn: async () => {
      const response = await api.get('/reports/cash-flow');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return response.data.data.map((item: any) => ({
        ...item,
        date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      }));
    },
  });

  // 3. Busca Despesas por Categoria (Gráfico de Pizza)
  const { data: categoryExpenses, isLoading: isLoadingCategories } = useQuery<CategoryExpenseData[]>({
    queryKey: ['dashboard-categories'],
    queryFn: async () => {
      const response = await api.get('/reports/expenses-by-category');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return response.data.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        value: Number(item.amount),
        color: item.color, // Mantemos a cor original mas usaremos a paleta no render
      }));
    },
  });

  // 4. Busca Últimas Transações
  const { data: recentTransactions, isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ['transactions', 'recent'],
    queryFn: async () => {
      const response = await api.get('/transactions');
      return response.data.data.slice(0, 5);
    },
  });

  const isLoading = isLoadingSummary || isLoadingCashFlow || isLoadingCategories || isLoadingTransactions;

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Visão Geral</h1>
        <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          Mês Atual
        </span>
      </div>

      {/* 1. CARDS DE RESUMO */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Saldo Total</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {summary ? CurrencyUtils.format(Number(summary.totalBalance)) : 'R$ 0,00'}
                </h3>
              </div>
              <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                <Wallet className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Receitas</p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                  {summary ? CurrencyUtils.format(Number(summary.periodSummary.income)) : 'R$ 0,00'}
                </h3>
              </div>
              <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                <ArrowUpCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Despesas</p>
                <h3 className="text-2xl font-bold text-red-600 mt-1">
                  {summary ? CurrencyUtils.format(Number(summary.periodSummary.expense)) : 'R$ 0,00'}
                </h3>
              </div>
              <div className="h-12 w-12 bg-red-50 rounded-full flex items-center justify-center text-red-600">
                <ArrowDownCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. GRÁFICO DE FLUXO DE CAIXA */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-slate-500" />
              Fluxo de Caixa Diário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {cashFlow && cashFlow.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cashFlow}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }} 
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `R$ ${value}`}
                    />
                    <Tooltip 
                      formatter={(value: number) => CurrencyUtils.format(value)}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend />
                    <Bar dataKey="income" name="Receita" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Despesa" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">
                  Sem dados suficientes para o gráfico
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 3. GRÁFICO DE CATEGORIAS (AGORA MULTICOLORIDO) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gastos por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {categoryExpenses && categoryExpenses.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryExpenses}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryExpenses.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          // Força o uso da paleta de cores definida no topo
                          fill={CHART_COLORS[index % CHART_COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => CurrencyUtils.format(value)} />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center" 
                      wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">
                  Sem despesas registradas
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. ÚLTIMAS TRANSAÇÕES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Últimas Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <tbody className="divide-y divide-slate-100">
                {recentTransactions && recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-4 pl-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            transaction.type === LaunchType.INCOME ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                          }`}>
                             {transaction.type === LaunchType.INCOME ? <ArrowUpCircle className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{transaction.description}</p>
                            <p className="text-xs text-slate-500">
                              {/* @ts-expect-error: category vem do include */}
                              {transaction.category?.name || 'Sem categoria'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-slate-500 text-right whitespace-nowrap">
                        {DateUtils.formatDate(transaction.date)}
                      </td>
                      <td className="py-4 pr-2 text-right">
                        <span className={`font-semibold ${
                          transaction.type === LaunchType.INCOME ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {transaction.type === LaunchType.INCOME ? '+' : '-'} 
                          {CurrencyUtils.format(Number(transaction.amount))}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-500">
                      Nenhuma transação recente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}