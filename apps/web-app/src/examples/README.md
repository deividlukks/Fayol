# 📚 Exemplos de Uso das Packages Fayol

Este diretório contém exemplos práticos de como utilizar as packages avançadas do Fayol.

## 🎨 UI Components Example

**Arquivo:** `ui-components-example.tsx`

Demonstra o uso de todos os componentes do `@fayol/ui-components`:

### Componentes Base:
- **Modal** - Modais configuráveis com diferentes tamanhos
- **Tooltip** - Tooltips com posicionamento (top/bottom/left/right)
- **Spinner** - Loading spinners com tamanhos variados
- **Alert** - Alertas com variantes (info/success/warning/error)

### Charts:
- **LineChart** - Gráfico de linhas SVG com grid e tooltips
- **PieChart** - Gráfico de pizza/donut com legenda

### Hooks Personalizados:
- **useDebounce** - Otimização de performance com delay
- **useLocalStorage** - Sincronização com localStorage
- **useMediaQuery** - Detecção de breakpoints responsivos
- **useClickOutside** - Detecção de cliques externos

### Como usar:

```tsx
import { UIComponentsExample } from '@/examples';

export default function Page() {
  return <UIComponentsExample />;
}
```

---

## 🤖 AI Services Example

**Arquivo:** `ai-services-example.tsx`

Demonstra os serviços de IA do `@fayol/ai-services`:

### Financial Insights Service:
Gera insights automáticos sobre transações:
- Picos de gastos (desvio padrão)
- Categorias com gastos incomuns
- Alertas de orçamento (90%+ utilizado)
- Oportunidades de economia
- Variação de renda
- Despesas recorrentes

### Spending Predictor Service:
Previsão de gastos futuros usando:
- Média móvel
- Análise de tendências (regressão linear)
- Ajuste sazonal
- Cálculo de confiança

### Trend Analyzer Service:
Análise avançada de séries temporais:
- Detecção de tipo de tendência (Linear/Exponencial/Cíclico/Volátil/Estável)
- Estatísticas descritivas completas
- Detecção de padrões cíclicos (autocorrelação)
- Previsões para 3 e 6 meses
- Detecção de anomalias

### Como usar:

```tsx
import { financialInsightsService, spendingPredictorService } from '@fayol/ai-services';

// Gerar insights
const insights = financialInsightsService.generateInsights(transactions, {
  periodDays: 30,
  budgets: new Map([['alimentação', 1000]])
});

// Prever gastos
const prediction = spendingPredictorService.predictSpending(historicalData);

// Analisar tendências
const trend = trendAnalyzerService.analyzeTrend(dataPoints);
```

---

## 💳 Payment Integration Example

**Arquivo:** `payment-integration-example.tsx`

Demonstra as integrações de pagamento do `@fayol/integrations`:

### Provedores Disponíveis:

#### Stripe Provider:
- Cartões de crédito/débito
- PaymentIntents API
- Reembolsos
- Múltiplas moedas

#### PagSeguro Provider:
- PIX com QR Code
- Boleto bancário
- Cartões nacionais
- Modo sandbox

### Métodos de Pagamento:
- CREDIT_CARD
- DEBIT_CARD
- PIX
- BOLETO
- BANK_TRANSFER

### Como usar:

```tsx
import { StripePaymentProvider, PagSeguroPaymentProvider } from '@fayol/integrations';

// Inicializar provedor
const stripe = new StripePaymentProvider({
  secretKey: process.env.STRIPE_SECRET_KEY,
  publicKey: process.env.STRIPE_PUBLIC_KEY,
});

// Criar pagamento
const payment = await stripe.createPayment({
  amount: 10000, // R$ 100,00 em centavos
  method: PaymentMethod.CREDIT_CARD,
  customer: {
    name: 'João Silva',
    email: 'joao@example.com',
  },
  card: {
    number: '4111111111111111',
    holderName: 'JOAO SILVA',
    expirationMonth: 12,
    expirationYear: 2025,
    cvv: '123',
  },
});

// Consultar pagamento
const status = await stripe.getPayment(payment.id);

// Reembolsar
const refund = await stripe.refundPayment({
  paymentId: payment.id,
  amount: 5000, // Reembolso parcial de R$ 50,00
});
```

---

## 🚀 Como Rodar os Exemplos

### 1. Criar uma Página de Teste

```tsx
// app/examples/page.tsx
import { UIComponentsExample } from '@/examples';

export default function ExamplesPage() {
  return (
    <div>
      <UIComponentsExample />
    </div>
  );
}
```

### 2. Acessar no Navegador

```bash
pnpm dev
```

Acesse: `http://localhost:3000/examples`

### 3. Alternar entre Exemplos

Você pode criar abas ou botões para navegar entre os exemplos:

```tsx
'use client';

import { useState } from 'react';
import {
  UIComponentsExample,
  AIServicesExample,
  PaymentIntegrationExample,
} from '@/examples';

export default function ExamplesPage() {
  const [activeTab, setActiveTab] = useState('ui');

  return (
    <div>
      <nav className="flex gap-4 p-4 border-b">
        <button onClick={() => setActiveTab('ui')}>UI Components</button>
        <button onClick={() => setActiveTab('ai')}>AI Services</button>
        <button onClick={() => setActiveTab('payment')}>Payments</button>
      </nav>

      {activeTab === 'ui' && <UIComponentsExample />}
      {activeTab === 'ai' && <AIServicesExample />}
      {activeTab === 'payment' && <PaymentIntegrationExample />}
    </div>
  );
}
```

---

## 📦 Packages Utilizadas

Todos os exemplos fazem uso das seguintes packages do monorepo:

- `@fayol/ui-components` - Componentes UI, Charts e Hooks
- `@fayol/ai-services` - IA para insights e previsões
- `@fayol/integrations` - Integrações de pagamento
- `@fayol/shared-utils` - Utilitários compartilhados
- `@fayol/shared-constants` - Constantes compartilhadas
- `@fayol/validation-schemas` - Validações com Zod

---

## 🔧 Configuração

### Variáveis de Ambiente

Para testar os exemplos de pagamento, configure as variáveis de ambiente:

```env
# Stripe
NEXT_PUBLIC_STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...

# PagSeguro
NEXT_PUBLIC_PAGSEGURO_EMAIL=seu@email.com
NEXT_PUBLIC_PAGSEGURO_TOKEN=seu_token_aqui
```

---

## 📝 Notas

- Os exemplos são **totalmente funcionais** e prontos para uso
- Use dados de teste para pagamentos (cartão: 4111111111111111)
- Os insights de IA são gerados com algoritmos reais
- Todos os componentes são responsivos e acessíveis

---

## 🎓 Próximos Passos

1. Adaptar os exemplos para suas necessidades
2. Integrar com o backend do Fayol
3. Adicionar validações customizadas
4. Implementar tratamento de erros robusto
5. Adicionar testes unitários e de integração
