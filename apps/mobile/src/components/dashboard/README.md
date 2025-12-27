# Dashboard Components

Componentes reutilizáveis para a tela de Dashboard do Fayol Mobile.

## 📦 Componentes Disponíveis

### 1. BalanceCard
Card que exibe o saldo total e resumo de receitas/despesas.

```typescript
import { BalanceCard } from '@/components/dashboard';

<BalanceCard
  balance={5000}
  income={8000}
  expenses={3000}
  loading={false}
/>
```

**Props:**
- `balance` (number): Saldo total
- `income?` (number): Total de receitas (opcional)
- `expenses?` (number): Total de despesas (opcional)
- `loading?` (boolean): Estado de carregamento

**Features:**
- Formatação automática de moeda (pt-BR)
- Ícones coloridos para receitas (verde) e despesas (vermelho)
- Layout responsivo

---

### 2. TransactionCard
Card para exibir uma transação individual.

```typescript
import { TransactionCard } from '@/components/dashboard';

<TransactionCard
  transaction={{
    id: '123',
    description: 'Almoço',
    amount: 45.50,
    type: 'EXPENSE',
    date: '2025-12-26',
    category: {
      id: 'cat-1',
      name: 'Alimentação',
      icon: 'food',
      color: '#ef4444',
    },
    account: {
      id: 'acc-1',
      name: 'Nubank',
    },
  }}
  onPress={() => console.log('Pressed')}
/>
```

**Props:**
- `transaction` (Transaction): Objeto da transação
- `onPress?` (function): Callback ao clicar no card

**Features:**
- Cores diferentes por tipo (INCOME verde, EXPENSE vermelho, TRANSFER azul)
- Ícones customizáveis por categoria
- Formatação de data localizada (pt-BR)
- Avatar circular com ícone da categoria

---

### 3. CategoryCard
Card para exibir categoria com barra de progresso.

```typescript
import { CategoryCard } from '@/components/dashboard';

<CategoryCard
  category={{
    id: 'cat-1',
    name: 'Alimentação',
    icon: 'food',
    color: '#ef4444',
    amount: 1500,
    percentage: 30,
  }}
  totalAmount={5000}
/>
```

**Props:**
- `category` (Category): Objeto da categoria
- `totalAmount?` (number): Total para calcular porcentagem

**Features:**
- Barra de progresso com cor customizada
- Cálculo automático de porcentagem
- Formatação de moeda
- Ícone customizável

---

### 4. RevenueExpensesChart
Gráfico de linha mostrando receitas vs despesas.

```typescript
import { RevenueExpensesChart } from '@/components/dashboard';

<RevenueExpensesChart
  data={{
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    revenues: [3000, 3500, 2800, 4000, 3200, 4500],
    expenses: [2500, 2800, 2200, 3000, 2900, 3200],
  }}
  loading={false}
/>
```

**Props:**
- `data?` (ChartData): Dados do gráfico
- `loading?` (boolean): Estado de carregamento

**Features:**
- Gráfico de linha suave (bezier)
- Legenda colorizada
- Responsivo ao tamanho da tela
- Estado de loading

---

### 5. RecentTransactions
Lista de transações recentes com opção "Ver todas".

```typescript
import { RecentTransactions } from '@/components/dashboard';

<RecentTransactions
  transactions={[
    {
      id: '1',
      description: 'Almoço',
      amount: 45.50,
      type: 'EXPENSE',
      date: '2025-12-26',
      category: { id: 'cat-1', name: 'Alimentação' },
      account: { id: 'acc-1', name: 'Nubank' },
    },
    // ... mais transações
  ]}
  loading={false}
  onViewAll={() => navigate('Transactions')}
  onTransactionPress={(tx) => navigate('TransactionDetail', { id: tx.id })}
/>
```

**Props:**
- `transactions` (Transaction[]): Array de transações
- `loading?` (boolean): Estado de carregamento
- `onViewAll?` (function): Callback para "Ver todas"
- `onTransactionPress?` (function): Callback ao clicar em transação

**Features:**
- Estados de empty e loading
- Usa TransactionCard internamente
- Botão "Ver todas" opcional

---

### 6. TopCategories
Lista das top categorias de despesas.

```typescript
import { TopCategories } from '@/components/dashboard';

<TopCategories
  categories={[
    {
      id: 'cat-1',
      name: 'Alimentação',
      icon: 'food',
      color: '#ef4444',
      amount: 1500,
    },
    // ... mais categorias
  ]}
  loading={false}
  onViewAll={() => navigate('Categories')}
/>
```

**Props:**
- `categories` (Category[]): Array de categorias
- `loading?` (boolean): Estado de carregamento
- `onViewAll?` (function): Callback para "Ver todas"

**Features:**
- Cálculo automático de porcentagem
- Estados de empty e loading
- Usa CategoryCard internamente

---

### 7. InsightsCard
Card de insights gerados por IA.

```typescript
import { InsightsCard } from '@/components/dashboard';

<InsightsCard
  insights={[
    {
      id: 'insight-1',
      type: 'SUCCESS',
      title: 'Ótima economia!',
      message: 'Você economizou 20% mais que o mês passado em alimentação.',
      icon: 'trophy',
    },
    {
      id: 'insight-2',
      type: 'WARNING',
      title: 'Atenção ao orçamento',
      message: 'Você já gastou 80% do seu orçamento de transporte este mês.',
    },
  ]}
  loading={false}
/>
```

**Props:**
- `insights` (Insight[]): Array de insights
- `loading?` (boolean): Estado de carregamento

**Features:**
- 4 tipos de insights (SUCCESS, WARNING, INFO, DANGER)
- Cores e ícones diferentes por tipo
- Badge "AI" no header
- Estados de empty e loading

**Tipos de Insight:**
- `SUCCESS` - Verde, sucesso financeiro
- `WARNING` - Amarelo, atenção necessária
- `INFO` - Azul, informação relevante
- `DANGER` - Vermelho, alerta crítico

---

## 🎨 Paleta de Cores

```typescript
const colors = {
  income: '#10b981',      // Verde - Receitas
  expense: '#ef4444',     // Vermelho - Despesas
  transfer: '#3b82f6',    // Azul - Transferências
  primary: '#3b82f6',     // Azul Fayol
  warning: '#f59e0b',     // Laranja - Avisos
  success: '#10b981',     // Verde - Sucesso
};
```

## 📐 Padrões de Design

### Formatação de Moeda
Todos os componentes usam formatação pt-BR:

```typescript
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};
```

### Formatação de Data
Usando date-fns com locale pt-BR:

```typescript
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formattedDate = format(date, "d 'de' MMM", { locale: ptBR });
```

### Ícones
Usando `react-native-vector-icons/MaterialCommunityIcons`:

```typescript
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

<MaterialCommunityIcons name="wallet" size={24} color="#3b82f6" />
```

## 🔧 Uso Completo (Dashboard Screen)

```typescript
import React from 'react';
import { ScrollView } from 'react-native';
import { FAB } from 'react-native-paper';
import {
  BalanceCard,
  RevenueExpensesChart,
  RecentTransactions,
  TopCategories,
  InsightsCard,
} from '@/components/dashboard';

export default function DashboardScreen() {
  return (
    <ScrollView>
      <BalanceCard
        balance={5000}
        income={8000}
        expenses={3000}
      />

      <RevenueExpensesChart data={chartData} />

      <RecentTransactions
        transactions={recentTransactions}
        onViewAll={() => navigate('Transactions')}
      />

      <TopCategories
        categories={topCategories}
        onViewAll={() => navigate('Categories')}
      />

      <InsightsCard insights={aiInsights} />

      <FAB
        icon="plus"
        label="Nova Transação"
        onPress={() => navigate('CreateTransaction')}
      />
    </ScrollView>
  );
}
```

## 📱 Responsividade

Todos os componentes são responsivos e se adaptam a diferentes tamanhos de tela:

- **Gráficos**: Usam `Dimensions.get('window').width` para calcular largura
- **Cards**: Usam `flex: 1` para expandir conforme necessário
- **Listas**: Usam `FlatList` ou `ScrollView` para conteúdo dinâmico

## ♿ Acessibilidade

- Todos os textos são renderizados com componentes do React Native Paper
- Cores possuem contraste adequado
- Ícones possuem labels descritivos
- Touchables possuem área mínima de 44x44pt

## 🧪 Testes

Para testar os componentes em isolamento:

```typescript
import { BalanceCard } from '@/components/dashboard';

// Mock data
const mockData = {
  balance: 5000,
  income: 8000,
  expenses: 3000,
};

// Render
<BalanceCard {...mockData} />
```
