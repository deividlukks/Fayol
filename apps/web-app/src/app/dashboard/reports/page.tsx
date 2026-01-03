'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FileText, FileSpreadsheet, Calendar, Loader2, Download } from 'lucide-react';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState<'PDF' | 'EXCEL' | null>(null);

  // Datas padrão: Início e fim do mês atual
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const handleDownload = async (type: 'PDF' | 'EXCEL') => {
    setIsLoading(type);
    try {
      const response = await api.get('/reports/export', {
        params: {
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          type,
        },
        responseType: 'blob', // Importante para arquivos binários
      });

      // Cria um link temporário para forçar o download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      const ext = type === 'PDF' ? 'pdf' : 'xlsx';
      link.href = url;
      link.setAttribute('download', `fayol_relatorio_${startDate}_${endDate}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro ao baixar relatório:', error);
      alert('Erro ao gerar o relatório. Tente novamente.');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Relatórios</h1>
        <p className="text-slate-500">
          Exporte seus dados financeiros para análise ou arquivamento.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seletor de Período */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-blue-600" /> Período do Relatório
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Data Início</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Data Fim</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Selecione o intervalo de datas que deseja incluir no relatório.
            </p>
          </CardContent>
        </Card>

        {/* Ações de Exportação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Download className="h-5 w-5 text-emerald-600" /> Formato de Exportação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => handleDownload('PDF')}
              disabled={!!isLoading}
              className="w-full justify-between bg-slate-900 hover:bg-slate-800"
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> Relatório em PDF
              </span>
              {isLoading === 'PDF' && <Loader2 className="h-4 w-4 animate-spin" />}
            </Button>

            <Button
              onClick={() => handleDownload('EXCEL')}
              disabled={!!isLoading}
              variant="outline"
              className="w-full justify-between border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
            >
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" /> Planilha Excel (XLSX)
              </span>
              {isLoading === 'EXCEL' && <Loader2 className="h-4 w-4 animate-spin" />}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Dica / Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
        <div className="bg-blue-100 p-2 rounded-full h-fit">
          <FileText className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h4 className="font-semibold text-blue-900 text-sm">O que está incluído?</h4>
          <p className="text-sm text-blue-700 mt-1">
            O relatório PDF contém um resumo visual de receitas, despesas e saldo, além de uma lista
            detalhada de transações categorizadas. A planilha Excel contém os dados brutos para você
            manipular como quiser.
          </p>
        </div>
      </div>
    </div>
  );
}
