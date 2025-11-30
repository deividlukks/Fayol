'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CurrencyUtils, DateUtils } from '@fayol/shared-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Loader2,
  TrendingUp,
  CreditCard,
  Activity,
  PiggyBank,
  Lightbulb,
  Target,
  AlertTriangle,
  Sparkles,
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
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';
import { Transaction, LaunchType, Budget, Category } from '@fayol/shared-types';

// --- TIPOS ---

// Estendemos a transação para incluir o objeto category que vem do backend
interface TransactionWithCategory extends Transaction {
  category?: Category;
}

interface Goal {
  id: string;
  title: string;
  currentAmount: number;
  targetAmount: number;
  color: string;
}

interface Insight {
  type: 'warning' | 'tip' | 'success';
  text: string;
}

interface CashFlowData {
  date: string;
  income: number;
  expense: number;
  [key: string]: unknown;
}

interface CategoryExpenseData {
  id: string;
  name: string;
  value: number;
  color: string;
  [key: string]: unknown;
}

// --- COMPONENTES ---

// StatsCard
interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  description?: string;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info';
  loading?: boolean;
}

const StatsCard = ({
  title,
  value,
  icon: Icon,
  description,
  variant = 'default',
  loading,
}: StatsCardProps) => {
  const variants = {
    default: 'bg-white text-slate-900 border-slate-200',
    success: 'bg-emerald-50 text-emerald-900 border-emerald-100',
    danger: 'bg-red-50 text-red-900 border-red-100',
    warning: 'bg-amber-50 text-amber-900 border-amber-100',
    info: 'bg-blue-50 text-blue-900 border-blue-100',
  };

  const iconColors = {
    default: 'text-slate-500 bg-slate-100',
    success: 'text-emerald-600 bg-white',
    danger: 'text-red-600 bg-white',
    warning: 'text-amber-600 bg-white',
    info: 'text-blue-600 bg-white',
  };

  return (
    <Card className={`${variants[variant]} shadow-sm transition-all hover:shadow-md`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0">
          <div className="space-y-1">
            <p className={`text-sm font-medium opacity-80`}>{title}</p>
            {loading ? (
              <div className="h-8 w-24 bg-slate-200/50 animate-pulse rounded mt-1" />
            ) : (
              <h2 className="text-2xl font-bold tracking-tight">{CurrencyUtils.format(value)}</h2>
            )}
          </div>
          <div className={`p-3 rounded-full ${iconColors[variant]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {description && (
          <p className="text-xs mt-2 opacity-70 flex items-center gap-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

// AiInsightCard
const AiInsightCard = ({ insights, loading }: { insights?: Insight[]; loading: boolean }) => {
  const getIcon = (type: string) => {
    if (type === 'warning') return AlertTriangle;
    if (type === 'success') return Sparkles;
    return Lightbulb;
  };

  return (
    <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-100">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-600" />
          <CardTitle className="text-base font-semibold text-indigo-900">
            Insights da IA Fayol
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-2">
            <div className="h-12 w-full bg-white/40 animate-pulse rounded-lg"></div>
            <div className="h-12 w-full bg-white/40 animate-pulse rounded-lg"></div>
          </div>
        ) : insights && insights.length > 0 ? (
          insights.map((insight, idx) => {
            const Icon = getIcon(insight.type);
            return (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-white/60 rounded-lg backdrop-blur-sm border border-indigo-100/50"
              >
                <Icon
                  className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                    insight.type === 'warning'
                      ? 'text-amber-500'
                      : insight.type === 'success'
                        ? 'text-emerald-500'
                        : 'text-blue-500'
                  }`}
                />
                <p className="text-sm text-slate-700 leading-tight">{insight.text}</p>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-slate-500 italic">Nenhum insight disponível no momento.</p>
        )}
      </CardContent>
    </Card>
  );
};

// GoalItem
const GoalItem = ({
  title,
  current,
  target,
  color,
}: {
  title: string;
  current: number;
  target: number;
  color: string;
}) => {
  const percent = Math.min((current / target) * 100, 100);
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-slate-700">{title}</span>
        <span className="text-slate-500">
          {CurrencyUtils.format(current)} / {CurrencyUtils.format(target)}
        </span>
      </div>
      <Progress value={percent} className="h-2" indicatorColor={color} />
    </div>
  );
};

const CHART_COLORS = [
  '#2563eb',
  '#16a34a',
  '#dc2626',
  '#d97706',
  '#7c3aed',
  '#db2777',
  '#0891b2',
  '#ea580c',
  '#4f46e5',
  '#ca8a04',
];

export default function DashboardPage() {
  // 1. Resumo
  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => (await api.get('/reports/summary')).data.data,
  });

  // 2. Fluxo de Caixa
  const { data: cashFlow } = useQuery<CashFlowData[]>({
    queryKey: ['dashboard-cashflow'],
    queryFn: async () => {
      const response = await api.get('/reports/cash-flow');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return response.data.data.map((item: any) => ({
        ...item,
        date: new Date(item.date).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        }),
      }));
    },
  });

  // 3. Categorias
  const { data: categoryExpenses } = useQuery<CategoryExpenseData[]>({
    queryKey: ['dashboard-categories'],
    queryFn: async () => {
      const response = await api.get('/reports/expenses-by-category');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return response.data.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        value: Number(item.amount),
        color: item.color,
      }));
    },
  });

  // 4. Transações (Usando a interface estendida)
  const { data: recentTransactions, isLoading: isLoadingTransactions } = useQuery<
    TransactionWithCategory[]
  >({
    queryKey: ['transactions', 'recent'],
    queryFn: async () => {
      const response = await api.get('/transactions');
      return response.data.data.slice(0, 5);
    },
  });

  // 5. Orçamentos
  const { data: budgets } = useQuery<Budget[]>({
    queryKey: ['budgets'],
    queryFn: async () => (await api.get('/budgets')).data.data,
  });

  // 6. Metas (Reais)
  const { data: goals } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: async () => (await api.get('/goals')).data.data,
  });

  // 7. Insights (Reais)
  const { data: insights, isLoading: isLoadingInsights } = useQuery<Insight[]>({
    queryKey: ['insights'],
    queryFn: async () => (await api.get('/reports/insights')).data.data,
  });

  // Cálculos
  const globalBudget = budgets?.reduce(
    (acc, b) => ({
      spent: acc.spent + Number(b.spent),
      amount: acc.amount + Number(b.amount),
    }),
    { spent: 0, amount: 0 }
  );

  const budgetPercent =
    globalBudget && globalBudget.amount > 0 ? (globalBudget.spent / globalBudget.amount) * 100 : 0;

  const radialData = [
    {
      name: 'Gasto',
      value: Math.min(budgetPercent, 100),
      fill: budgetPercent > 100 ? '#ef4444' : '#3b82f6',
    },
  ];

  const totalBalance = Number(summary?.totalBalance || 0);
  const income = Number(summary?.periodSummary?.income || 0);
  const expense = Number(summary?.periodSummary?.expense || 0);
  const result = Number(summary?.periodSummary?.result || 0);
  const isPositiveResult = result >= 0;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Visão Geral</h1>
          <p className="text-slate-500">Acompanhe a saúde das suas finanças.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-sm font-medium text-slate-600">Mês Atual</span>
        </div>
      </div>

      {/* Cards Resumo */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Saldo Total"
          value={totalBalance}
          icon={Wallet}
          variant="info"
          description="Soma de todas as contas"
          loading={isLoadingSummary}
        />
        <StatsCard
          title="Receitas"
          value={income}
          icon={ArrowUpCircle}
          variant="success"
          description="Entradas este mês"
          loading={isLoadingSummary}
        />
        <StatsCard
          title="Despesas"
          value={expense}
          icon={ArrowDownCircle}
          variant="danger"
          description="Saídas este mês"
          loading={isLoadingSummary}
        />
        <StatsCard
          title="Resultado"
          value={result}
          icon={isPositiveResult ? PiggyBank : Activity}
          variant={isPositiveResult ? 'default' : 'warning'}
          description={isPositiveResult ? 'Você está economizando!' : 'Atenção aos gastos.'}
          loading={isLoadingSummary}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="xl:col-span-2 space-y-6">
          {/* Gráfico de Fluxo */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 font-semibold text-slate-800">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Fluxo de Caixa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {cashFlow && cashFlow.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashFlow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `R$${value / 1000}k`}
                      />
                      <Tooltip
                        cursor={{ fill: '#f1f5f9' }}
                        formatter={(value: number) => [CurrencyUtils.format(value), '']}
                        contentStyle={{
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          padding: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar
                        dataKey="income"
                        name="Receita"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={50}
                      />
                      <Bar
                        dataKey="expense"
                        name="Despesa"
                        fill="#ef4444"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={50}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                    <Activity className="h-10 w-10 mb-2 opacity-20" />
                    <p>Sem dados suficientes</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Últimas Transações */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
              <CardTitle className="text-lg font-semibold text-slate-800">
                Últimas Transações
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <tbody className="divide-y divide-slate-50">
                    {isLoadingTransactions ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-500">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </td>
                      </tr>
                    ) : recentTransactions && recentTransactions.length > 0 ? (
                      recentTransactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className="group hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2.5 rounded-full ${
                                  transaction.type === LaunchType.INCOME
                                    ? 'bg-emerald-100 text-emerald-600'
                                    : 'bg-red-100 text-red-600'
                                }`}
                              >
                                {transaction.type === LaunchType.INCOME ? (
                                  <ArrowUpCircle className="h-5 w-5" />
                                ) : (
                                  <CreditCard className="h-5 w-5" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {transaction.description}
                                </p>
                                <p className="text-xs text-slate-500 font-medium">
                                  {transaction.category?.name || 'Sem categoria'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-slate-500 font-medium text-right">
                            {DateUtils.formatDate(transaction.date)}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span
                              className={`font-bold text-base ${
                                transaction.type === LaunchType.INCOME
                                  ? 'text-emerald-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {transaction.type === LaunchType.INCOME ? '+' : '-'}{' '}
                              {CurrencyUtils.format(Number(transaction.amount))}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-12 text-center text-slate-400">
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

        {/* Coluna Lateral */}
        <div className="space-y-6">
          {/* Insights da IA (Reais) */}
          <AiInsightCard insights={insights} loading={isLoadingInsights} />

          {/* Orçamento Global */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Orçamento Global</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full relative flex items-center justify-center">
                {globalBudget && globalBudget.amount > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        innerRadius="70%"
                        outerRadius="100%"
                        barSize={15}
                        data={radialData}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <PolarAngleAxis
                          type="number"
                          domain={[0, 100]}
                          angleAxisId={0}
                          tick={false}
                        />
                        <RadialBar background dataKey="value" cornerRadius={10} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute text-center">
                      <p className="text-2xl font-bold text-slate-900">
                        {budgetPercent.toFixed(0)}%
                      </p>
                      <p className="text-xs text-slate-500">Comprometido</p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-400">Nenhum orçamento definido</p>
                )}
              </div>
              {globalBudget && (
                <div className="flex justify-between text-xs mt-4 px-4 text-slate-500">
                  <span>
                    Gasto: <b>{CurrencyUtils.format(globalBudget.spent)}</b>
                  </span>
                  <span>
                    Limite: <b>{CurrencyUtils.format(globalBudget.amount)}</b>
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metas (Reais) */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Minhas Metas
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {goals && goals.length > 0 ? (
                goals.map((goal) => (
                  <GoalItem
                    key={goal.id}
                    title={goal.title}
                    current={Number(goal.currentAmount)}
                    target={Number(goal.targetAmount)}
                    color={goal.color || 'bg-blue-500'}
                  />
                ))
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">Nenhuma meta cadastrada.</p>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Categorias */}
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-lg font-semibold">Top Categorias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px] w-full">
                {categoryExpenses && categoryExpenses.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryExpenses}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {categoryExpenses.map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => CurrencyUtils.format(value)}
                        contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400 text-sm">
                    Sem dados
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
