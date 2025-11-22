'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { CurrencyUtils } from '@fayol/shared-utils';
import { ArrowUpCircle, ArrowDownCircle, Wallet, Loader2, TrendingUp } from 'lucide-react';

interface DashboardSummary {
  totalBalance: number;
  periodSummary: {
    income: number;
    expense: number;
    result: number;
  };
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get('http://localhost:3333/api/reports/summary', {
          headers: { Authorization: `Bearer ${token}` },
        });

        setSummary(response.data.data);
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Visão Geral</h1>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Saldo Total */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
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
        </div>

        {/* Receitas */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Receitas (Mês)</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                {summary ? CurrencyUtils.format(Number(summary.periodSummary.income)) : 'R$ 0,00'}
              </h3>
            </div>
            <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
              <ArrowUpCircle className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Despesas */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Despesas (Mês)</p>
              <h3 className="text-2xl font-bold text-red-600 mt-1">
                {summary ? CurrencyUtils.format(Number(summary.periodSummary.expense)) : 'R$ 0,00'}
              </h3>
            </div>
            <div className="h-12 w-12 bg-red-50 rounded-full flex items-center justify-center text-red-600">
              <ArrowDownCircle className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Gráficos e Detalhes (Placeholder por enquanto) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Evolução */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[300px]">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-slate-500" />
            Fluxo de Caixa
          </h3>
          <div className="flex h-full items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            Gráfico será implementado na próxima etapa
          </div>
        </div>

        {/* Últimas Transações */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[300px]">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Últimas Transações</h3>
          <div className="flex h-full items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            Lista será implementada na próxima etapa
          </div>
        </div>
      </div>
    </div>
  );
}