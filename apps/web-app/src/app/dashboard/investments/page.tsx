'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CurrencyUtils } from '@fayol/shared-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TradeFormModal } from '@/components/trading/trade-form-modal';
import { PortfolioChart } from '@/components/trading/portfolio-chart';
import {
  TrendingUp,
  PieChart as PieChartIcon,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface AssetPosition {
  id: string;
  ticker: string;
  quantity: number;
  averagePrice: number;
  currentPrice?: number; // Virá de uma futura integração de realtime
}

export default function InvestmentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Buscar Portfolio (Carteira Consolidada)
  const {
    data: portfolio,
    isLoading,
    refetch,
  } = useQuery<AssetPosition[]>({
    queryKey: ['investments', 'portfolio'],
    queryFn: async () => {
      const res = await api.get('/trading/portfolio');
      return res.data; // Assume que o backend retorna o array direto ou dentro de .data
    },
  });

  // Cálculos de Totais
  const totalInvested =
    portfolio?.reduce((acc, asset) => {
      return acc + Number(asset.quantity) * Number(asset.averagePrice);
    }, 0) || 0;

  // Mock de rentabilidade (já que ainda não temos preço em tempo real em todos os ativos)
  const profitability = 2.5; // +2.5% fictício para visualização

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Investimentos</h1>
          <p className="text-slate-500">Gerencie a sua carteira de renda variável.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={() => setIsModalOpen(true)}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Nova Operação
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Património Investido</CardTitle>
            <Wallet className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{CurrencyUtils.format(totalInvested)}</div>
            <p className="text-xs text-slate-500 mt-1">Custo de aquisição total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rentabilidade (Est.)</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">+{profitability}%</div>
            <p className="text-xs text-slate-500 mt-1">Variação no mês atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Ativos</CardTitle>
            <PieChartIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolio?.length || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Papéis em carteira</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e Análise */}
      <PortfolioChart />

      {/* Tabela de Ativos */}
      <Card>
        <CardHeader>
          <CardTitle>Minha Carteira</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : portfolio && portfolio.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Ativo</th>
                    <th className="px-4 py-3 text-right">Quantidade</th>
                    <th className="px-4 py-3 text-right">Preço Médio</th>
                    <th className="px-4 py-3 text-right">Total Aplicado</th>
                    <th className="px-4 py-3 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {portfolio.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">{asset.ticker}</td>
                      <td className="px-4 py-3 text-right">{asset.quantity}</td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {CurrencyUtils.format(Number(asset.averagePrice))}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        {CurrencyUtils.format(Number(asset.quantity) * Number(asset.averagePrice))}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button variant="ghost" size="sm" className="h-8 text-xs">
                          Detalhes
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500">
              <div className="mb-4 bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                <Wallet className="h-6 w-6 text-slate-400" />
              </div>
              <p className="font-medium text-slate-900">Sua carteira está vazia</p>
              <p className="text-sm mt-1">
                Registe a sua primeira operação de compra para começar.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Lançamento */}
      <TradeFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          refetch(); // Atualiza a lista após sucesso
          // Opcional: Mostrar toast de sucesso
        }}
      />
    </div>
  );
}
