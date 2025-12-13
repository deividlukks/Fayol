'use client';

import { useState } from 'react';
import {
  StripePaymentProvider,
  PagSeguroPaymentProvider,
  PaymentMethod,
  PaymentStatus,
  PaymentResult,
  CreatePaymentData,
} from '@fayol/integrations';
import { Alert, Spinner } from '@fayol/ui-components';

/**
 * Exemplo de uso das integrações de pagamento do @fayol/integrations
 */
export function PaymentIntegrationExample() {
  const [selectedProvider, setSelectedProvider] = useState<'stripe' | 'pagseguro'>('stripe');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.CREDIT_CARD);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Inicializa os provedores (use suas credenciais reais em produção)
  const stripeProvider = new StripePaymentProvider({
    secretKey: process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY || 'sk_test_...',
    publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || 'pk_test_...',
  });

  const pagseguroProvider = new PagSeguroPaymentProvider({
    email: process.env.NEXT_PUBLIC_PAGSEGURO_EMAIL || 'seu@email.com',
    token: process.env.NEXT_PUBLIC_PAGSEGURO_TOKEN || 'token_aqui',
    sandbox: true, // Modo de teste
  });

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);
    setPaymentResult(null);

    try {
      // Dados do pagamento de exemplo
      const paymentData: CreatePaymentData = {
        amount: 10000, // R$ 100,00 em centavos
        method: selectedMethod,
        customer: {
          name: 'João Silva',
          email: 'joao@example.com',
          phone: '(11) 98765-4321',
          document: '123.456.789-00',
        },
        description: 'Pagamento de exemplo - Fayol',
        metadata: {
          orderId: 'ORD-123',
          userId: 'user-456',
        },
      };

      // Adiciona dados específicos para cartão
      if (selectedMethod === PaymentMethod.CREDIT_CARD) {
        paymentData.card = {
          number: '4111111111111111', // Cartão de teste
          holderName: 'JOAO SILVA',
          expirationMonth: 12,
          expirationYear: 2025,
          cvv: '123',
        };
      }

      // Processa pagamento com o provedor selecionado
      const provider = selectedProvider === 'stripe' ? stripeProvider : pagseguroProvider;
      const result = await provider.createPayment(paymentData);

      setPaymentResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: PaymentStatus) => {
    const colors = {
      [PaymentStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [PaymentStatus.PROCESSING]: 'bg-blue-100 text-blue-800',
      [PaymentStatus.SUCCEEDED]: 'bg-green-100 text-green-800',
      [PaymentStatus.FAILED]: 'bg-red-100 text-red-800',
      [PaymentStatus.CANCELED]: 'bg-gray-100 text-gray-800',
      [PaymentStatus.REFUNDED]: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const translateStatus = (status: PaymentStatus) => {
    const translations = {
      [PaymentStatus.PENDING]: 'Pendente',
      [PaymentStatus.PROCESSING]: 'Processando',
      [PaymentStatus.SUCCEEDED]: 'Aprovado',
      [PaymentStatus.FAILED]: 'Falhou',
      [PaymentStatus.CANCELED]: 'Cancelado',
      [PaymentStatus.REFUNDED]: 'Reembolsado',
    };
    return translations[status] || status;
  };

  const translateMethod = (method: PaymentMethod) => {
    const translations = {
      [PaymentMethod.CREDIT_CARD]: 'Cartão de Crédito',
      [PaymentMethod.DEBIT_CARD]: 'Cartão de Débito',
      [PaymentMethod.PIX]: 'PIX',
      [PaymentMethod.BOLETO]: 'Boleto',
      [PaymentMethod.BANK_TRANSFER]: 'Transferência Bancária',
    };
    return translations[method] || method;
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <h1 className="text-3xl font-bold">Exemplos de Integração de Pagamentos</h1>

      {/* Seleção de Provedor */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Provedor de Pagamento</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setSelectedProvider('stripe')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              selectedProvider === 'stripe'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Stripe
          </button>
          <button
            onClick={() => setSelectedProvider('pagseguro')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              selectedProvider === 'pagseguro'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            PagSeguro
          </button>
        </div>
      </section>

      {/* Método de Pagamento */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Método de Pagamento</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.values(PaymentMethod).map((method) => (
            <button
              key={method}
              onClick={() => setSelectedMethod(method)}
              disabled={
                selectedProvider === 'stripe' &&
                (method === PaymentMethod.PIX || method === PaymentMethod.BOLETO)
              }
              className={`px-4 py-3 rounded-lg font-medium transition ${
                selectedMethod === method
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {translateMethod(method)}
            </button>
          ))}
        </div>
        {selectedProvider === 'stripe' && (
          <p className="text-sm text-gray-600">
            * Stripe suporta principalmente cartões. PIX e Boleto são mais comuns no PagSeguro.
          </p>
        )}
      </section>

      {/* Processar Pagamento */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Processar Pagamento</h2>
        <div className="border rounded-lg p-6 bg-gray-50">
          <div className="space-y-3 mb-4">
            <p>
              <span className="font-medium">Valor:</span> R$ 100,00
            </p>
            <p>
              <span className="font-medium">Provedor:</span>{' '}
              {selectedProvider === 'stripe' ? 'Stripe' : 'PagSeguro'}
            </p>
            <p>
              <span className="font-medium">Método:</span> {translateMethod(selectedMethod)}
            </p>
          </div>

          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Spinner size="sm" color="white" />
                Processando...
              </>
            ) : (
              'Processar Pagamento de Teste'
            )}
          </button>
        </div>
      </section>

      {/* Resultado */}
      {error && (
        <Alert variant="error" title="Erro no Pagamento">
          {error}
        </Alert>
      )}

      {paymentResult && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Resultado do Pagamento</h2>
          <div className="border rounded-lg p-6 bg-white">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    paymentResult.status
                  )}`}
                >
                  {translateStatus(paymentResult.status)}
                </span>
              </div>
              <p>
                <span className="font-medium">ID da Transação:</span> {paymentResult.id}
              </p>
              <p>
                <span className="font-medium">Valor:</span> R${' '}
                {(paymentResult.amount / 100).toFixed(2)}
              </p>
              <p>
                <span className="font-medium">Método:</span> {translateMethod(paymentResult.method)}
              </p>
              <p>
                <span className="font-medium">Cliente:</span> {paymentResult.customer.name} (
                {paymentResult.customer.email})
              </p>
              <p>
                <span className="font-medium">Criado em:</span>{' '}
                {paymentResult.createdAt.toLocaleString('pt-BR')}
              </p>

              {/* Informações específicas do método */}
              {paymentResult.qrCode && (
                <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
                  <p className="font-medium text-blue-900 mb-2">QR Code PIX:</p>
                  <p className="text-sm text-blue-800 break-all">{paymentResult.qrCode}</p>
                </div>
              )}

              {paymentResult.paymentUrl && (
                <div className="mt-4 p-4 bg-green-50 rounded border border-green-200">
                  <p className="font-medium text-green-900 mb-2">Link de Pagamento:</p>
                  <a
                    href={paymentResult.paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-700 underline break-all"
                  >
                    {paymentResult.paymentUrl}
                  </a>
                </div>
              )}

              {paymentResult.barcode && (
                <div className="mt-4 p-4 bg-yellow-50 rounded border border-yellow-200">
                  <p className="font-medium text-yellow-900 mb-2">Código de Barras:</p>
                  <p className="text-sm text-yellow-800 break-all">{paymentResult.barcode}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Informações das Integrações */}
      <div className="bg-purple-50 border border-purple-200 rounded p-4">
        <h3 className="font-medium text-purple-900 mb-3">Recursos das Integrações de Pagamento:</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-purple-800 mb-2">Stripe Provider:</h4>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Cartões de crédito/débito internacionais</li>
              <li>• PaymentIntents API</li>
              <li>• Webhooks para eventos</li>
              <li>• Reembolsos automáticos</li>
              <li>• Suporte a múltiplas moedas</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-purple-800 mb-2">PagSeguro Provider:</h4>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• PIX instantâneo com QR Code</li>
              <li>• Boleto bancário</li>
              <li>• Cartões nacionais</li>
              <li>• Modo sandbox para testes</li>
              <li>• Split de pagamento</li>
            </ul>
          </div>
        </div>
      </div>

      <Alert variant="info" title="Ambiente de Desenvolvimento">
        Este é um exemplo em modo de teste. Configure as variáveis de ambiente com suas credenciais
        reais para processar pagamentos em produção.
      </Alert>
    </div>
  );
}
