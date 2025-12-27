'use client';

import { useState } from 'react';
import {
  Modal,
  Tooltip,
  Spinner,
  Alert,
  LineChart,
  PieChart,
  useDebounce,
  useLocalStorage,
  useMediaQuery,
} from '@fayol/ui-components';

/**
 * Exemplo de uso dos componentes do @fayol/ui-components
 */
export function UIComponentsExample() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  // Hook de debounce para otimizar buscas
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Media query para responsividade
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Dados de exemplo para o LineChart
  const lineChartData = [
    { label: 'Jan', value: 1200 },
    { label: 'Fev', value: 1900 },
    { label: 'Mar', value: 1500 },
    { label: 'Abr', value: 2200 },
    { label: 'Mai', value: 2800 },
    { label: 'Jun', value: 2400 },
  ];

  // Dados de exemplo para o PieChart
  const pieChartData = [
    { label: 'Alimentação', value: 1200, color: '#3b82f6' },
    { label: 'Transporte', value: 800, color: '#10b981' },
    { label: 'Lazer', value: 500, color: '#f59e0b' },
    { label: 'Contas', value: 1500, color: '#ef4444' },
  ];

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Exemplos de UI Components</h1>

      {/* Alerts */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Alerts</h2>
        <Alert variant="info" title="Informação">
          Este é um alerta informativo.
        </Alert>
        <Alert variant="success" title="Sucesso">
          Operação realizada com sucesso!
        </Alert>
        <Alert variant="warning" title="Atenção">
          Você está próximo do limite do orçamento.
        </Alert>
        <Alert variant="error" title="Erro">
          Ocorreu um erro ao processar sua solicitação.
        </Alert>
      </section>

      {/* Modal */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Modal</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Abrir Modal
        </button>
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Exemplo de Modal"
          size="md"
        >
          <p className="mb-4">Este é um exemplo de modal usando @fayol/ui-components.</p>
          <p>O modal suporta:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Diferentes tamanhos (sm, md, lg, xl, full)</li>
            <li>Bloqueio de scroll do body</li>
            <li>Fechamento com ESC</li>
            <li>Click fora para fechar</li>
          </ul>
        </Modal>
      </section>

      {/* Tooltip */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Tooltip</h2>
        <div className="flex gap-4">
          <Tooltip content="Tooltip no topo" position="top">
            <button className="px-4 py-2 bg-gray-600 text-white rounded">Topo</button>
          </Tooltip>
          <Tooltip content="Tooltip na direita" position="right">
            <button className="px-4 py-2 bg-gray-600 text-white rounded">Direita</button>
          </Tooltip>
          <Tooltip content="Tooltip embaixo" position="bottom">
            <button className="px-4 py-2 bg-gray-600 text-white rounded">Embaixo</button>
          </Tooltip>
          <Tooltip content="Tooltip na esquerda" position="left">
            <button className="px-4 py-2 bg-gray-600 text-white rounded">Esquerda</button>
          </Tooltip>
        </div>
      </section>

      {/* Spinner */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Spinner</h2>
        <div className="flex items-center gap-4">
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
          {/* Corrigido: Usar 'primary' em vez de 'blue' */}
          <Spinner size="xl" color="primary" />
        </div>
      </section>

      {/* Charts */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Charts</h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-medium mb-4">Line Chart - Receitas</h3>
            <LineChart data={lineChartData} color="#3b82f6" height={300} showGrid showDots />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Pie Chart - Categorias</h3>
            <PieChart
              data={pieChartData}
              size={300}
              // Corrigido: Substituído 'donut' (inválido) por 'innerRadius'
              innerRadius={0.6}
              showLegend
            />
          </div>
        </div>
      </section>

      {/* Hooks */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Hooks Personalizados</h2>

        <div className="space-y-4">
          {/* useDebounce */}
          <div className="border p-4 rounded">
            <h3 className="font-medium mb-2">useDebounce</h3>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite para testar debounce..."
              className="w-full px-3 py-2 border rounded"
            />
            <p className="mt-2 text-sm text-gray-600">Valor original: {searchTerm}</p>
            <p className="text-sm text-gray-600">Valor debounced (500ms): {debouncedSearch}</p>
          </div>

          {/* useLocalStorage */}
          <div className="border p-4 rounded">
            <h3 className="font-medium mb-2">useLocalStorage</h3>
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Tema atual: {theme} (Clique para alternar)
            </button>
            <p className="mt-2 text-sm text-gray-600">
              O valor é salvo no localStorage e persiste entre recarregamentos.
            </p>
          </div>

          {/* useMediaQuery */}
          <div className="border p-4 rounded">
            <h3 className="font-medium mb-2">useMediaQuery</h3>
            <p className="text-sm">Dispositivo: {isMobile ? 'Mobile' : 'Desktop'}</p>
            <p className="text-sm text-gray-600">Redimensione a janela para ver a mudança.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
