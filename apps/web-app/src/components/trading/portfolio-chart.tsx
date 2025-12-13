'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  LineChart,
  Line,
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
} from 'recharts';
import { tradingService, PortfolioItem } from '@fayol/api-client';
import { CurrencyUtils } from '@fayol/shared-utils';
import { Loader2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface ChartData {
  symbol: string;
  quantity: number;
  currentTotal: number;
  costTotal: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
}

export function PortfolioChart() {
  const [portfolioData, setPortfolioData] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleSymbols, setVisibleSymbols] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await tradingService.getPortfolio();
      if (response.data) {
        setPortfolioData(response.data);
        // inicializar visibilidade
        const visibility: Record<string, boolean> = {};
        response.data.forEach((p: PortfolioItem) => (visibility[p.symbol] = true));
        setVisibleSymbols(visibility);
      }
    } catch (err) {
      setError('Erro ao carregar portfólio');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700 font-medium">{error}</p>
        <button
          onClick={fetchPortfolio}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!portfolioData || portfolioData.length === 0) {
    return (
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg text-center">
        <p className="text-slate-600">Nenhuma posição ativa no portfólio</p>
      </div>
    );
  }

  // Calcular totais
  const totalCost = portfolioData.reduce((sum, item) => sum + item.costTotal, 0);
  const totalCurrent = portfolioData.reduce((sum, item) => sum + item.currentTotal, 0);
  const totalPnl = totalCurrent - totalCost;
  const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  // Dados para gráfico de composição (pizza)
  const compositionData = portfolioData.map((item) => ({
    name: item.symbol,
    value: item.currentTotal,
  }));

  const filteredComposition = useMemo(
    () => compositionData.filter((d) => visibleSymbols[d.name]),
    [compositionData, visibleSymbols]
  );

  // Dados para gráfico de P&L por ativo (barras)
  const pnlData: ChartData[] = portfolioData.map((item) => ({
    symbol: item.symbol,
    quantity: item.quantity,
    currentTotal: item.currentTotal,
    costTotal: item.costTotal,
    unrealizedPnl: item.unrealizedPnl,
    unrealizedPnlPercent: item.unrealizedPnlPercent,
  }));

  const filteredPnlData = useMemo(
    () => pnlData.filter((d) => visibleSymbols[d.symbol]),
    [pnlData, visibleSymbols]
  );

  // Cores para os gráficos
  const colors = [
    '#3b82f6',
    '#ef4444',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#06b6d4',
    '#ec4899',
    '#6366f1',
  ];

  const toggleSymbol = useCallback((symbol: string) => {
    setVisibleSymbols((prev) => ({ ...prev, [symbol]: !prev[symbol] }));
  }, []);

  const legendItems = useMemo(
    () => portfolioData.map((p, i) => ({ symbol: p.symbol, color: colors[i % colors.length] })),
    [portfolioData]
  );

  function PieTooltip({ active, payload }: any) {
    if (!active || !payload || payload.length === 0) return null;
    const item = payload[0];
    return (
      <div className="bg-white border p-2 rounded shadow-sm text-sm">
        <div className="font-semibold">{item.name}</div>
        <div>{CurrencyUtils.format(item.value)}</div>
        <div className="text-xs text-slate-500">
          Composição: {((item.value / totalCurrent) * 100).toFixed(2)}%
        </div>
      </div>
    );
  }

  function BarTooltip({ active, payload }: any) {
    if (!active || !payload || payload.length === 0) return null;
    const it = payload[0].payload;
    return (
      <div className="bg-white border p-2 rounded shadow-sm text-sm">
        <div className="font-semibold">{it.symbol}</div>
        <div>Qtd: {it.quantity}</div>
        <div>Valor Atual: {CurrencyUtils.format(it.currentTotal)}</div>
        <div>
          P&L: {CurrencyUtils.format(it.unrealizedPnl)} ({it.unrealizedPnlPercent.toFixed(2)}%)
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Valor Investido</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {CurrencyUtils.format(totalCost)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Valor Atual</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {CurrencyUtils.format(totalCurrent)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">P&L Total (R$)</p>
              <p
                className={`text-2xl font-bold mt-1 ${totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {totalPnl >= 0 ? '+' : ''}
                {CurrencyUtils.format(totalPnl)}
              </p>
            </div>
            {totalPnl >= 0 ? (
              <TrendingUp className="w-8 h-8 text-green-500 opacity-20" />
            ) : (
              <TrendingDown className="w-8 h-8 text-red-500 opacity-20" />
            )}
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">P&L Total (%)</p>
              <p
                className={`text-2xl font-bold mt-1 ${totalPnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {totalPnlPercent >= 0 ? '+' : ''}
                {totalPnlPercent.toFixed(2)}%
              </p>
            </div>
            {totalPnlPercent >= 0 ? (
              <TrendingUp className="w-8 h-8 text-green-500 opacity-20" />
            ) : (
              <TrendingDown className="w-8 h-8 text-red-500 opacity-20" />
            )}
          </div>
        </div>
      </div>

      {/* Gráfico de Composição do Portfólio */}
      <div className="p-6 bg-white border border-slate-200 rounded-lg">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Composição do Portfólio</h3>
        <div className="flex gap-6 items-start">
          <div className="w-2/3">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={filteredComposition}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {filteredComposition.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index % colors.length]}
                      stroke="#fff"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-1/3">
            <div className="flex flex-col gap-2">
              {legendItems.map((it) => (
                <button
                  key={it.symbol}
                  onClick={() => toggleSymbol(it.symbol)}
                  className="flex items-center gap-3 text-left p-2 rounded hover:bg-slate-50"
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ background: it.color, opacity: visibleSymbols[it.symbol] ? 1 : 0.3 }}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{it.symbol}</div>
                    <div className="text-xs text-slate-500">
                      {CurrencyUtils.format(
                        portfolioData.find((p) => p.symbol === it.symbol)?.currentTotal || 0
                      )}
                    </div>
                  </div>
                  <div
                    className={`text-sm ${visibleSymbols[it.symbol] ? 'text-slate-700' : 'text-slate-400'}`}
                  >
                    {visibleSymbols[it.symbol] ? 'Visível' : 'Oculto'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de P&L por Ativo */}
      <div className="p-6 bg-white border border-slate-200 rounded-lg">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">P&L por Ativo</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={filteredPnlData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="symbol" />
            <YAxis />
            <Tooltip content={<BarTooltip />} />
            <Bar dataKey="unrealizedPnl" fill="#10b981" name="P&L (R$)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela de Detalhes */}
      <div className="p-6 bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Detalhes das Posições</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 px-3 font-semibold text-slate-700">Ativo</th>
              <th className="text-right py-2 px-3 font-semibold text-slate-700">Qtd</th>
              <th className="text-right py-2 px-3 font-semibold text-slate-700">Preço Médio</th>
              <th className="text-right py-2 px-3 font-semibold text-slate-700">Preço Atual</th>
              <th className="text-right py-2 px-3 font-semibold text-slate-700">Valor Investido</th>
              <th className="text-right py-2 px-3 font-semibold text-slate-700">Valor Atual</th>
              <th className="text-right py-2 px-3 font-semibold text-slate-700">P&L</th>
              <th className="text-right py-2 px-3 font-semibold text-slate-700">%</th>
            </tr>
          </thead>
          <tbody>
            {pnlData.map((item) => (
              <tr key={item.symbol} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-3 font-semibold text-slate-900">{item.symbol}</td>
                <td className="text-right py-3 px-3 text-slate-700">{item.quantity.toFixed(2)}</td>
                <td className="text-right py-3 px-3 text-slate-700">
                  {CurrencyUtils.format(item.costTotal / item.quantity)}
                </td>
                <td className="text-right py-3 px-3 text-slate-700">
                  {CurrencyUtils.format(item.currentTotal / item.quantity)}
                </td>
                <td className="text-right py-3 px-3 text-slate-700">
                  {CurrencyUtils.format(item.costTotal)}
                </td>
                <td className="text-right py-3 px-3 text-slate-700">
                  {CurrencyUtils.format(item.currentTotal)}
                </td>
                <td
                  className={`text-right py-3 px-3 font-semibold ${
                    item.unrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {item.unrealizedPnl >= 0 ? '+' : ''}
                  {CurrencyUtils.format(item.unrealizedPnl)}
                </td>
                <td
                  className={`text-right py-3 px-3 font-semibold ${
                    item.unrealizedPnlPercent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {item.unrealizedPnlPercent >= 0 ? '+' : ''}
                  {item.unrealizedPnlPercent.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
