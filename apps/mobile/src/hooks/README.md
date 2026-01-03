# React Query Hooks - Fayol Mobile

Documentação completa dos hooks de data fetching usando TanStack React Query.

## 📦 Estrutura

```
hooks/
├── queries/              # Hooks para buscar dados (GET)
│   ├── useTransactions.ts
│   ├── useAccounts.ts
│   ├── useBudgets.ts
│   ├── useCategories.ts
│   └── useDashboard.ts
├── mutations/            # Hooks para modificar dados (POST, PUT, PATCH, DELETE)
│   ├── useTransactionMutations.ts
│   ├── useAccountMutations.ts
│   ├── useBudgetMutations.ts
│   └── useCategoryMutations.ts
├── useAuth.ts           # Hook de autenticação
└── index.ts             # Exportações centralizadas
```

## 🔍 Queries (Buscar Dados)

### Transações

```typescript
import { useTransactions, useTransaction } from '@/hooks';

// Listar todas as transações
const { data, isLoading, error, refetch } = useTransactions({ limit: 10 });

// Buscar uma transação específica
const { data: transaction } = useTransaction(transactionId);
```

### Contas

```typescript
import { useAccounts, useAccount } from '@/hooks';

// Listar todas as contas
const { data, isLoading } = useAccounts();

// Buscar uma conta específica
const { data: account } = useAccount(accountId);
```

### Orçamentos

```typescript
import {
  useBudgets,
  useBudget,
  useBudgetsProgress,
  useBudgetAlerts,
} from '@/hooks';

// Listar todos os orçamentos
const { data } = useBudgets();

// Buscar um orçamento específico
const { data: budget } = useBudget(budgetId);

// Buscar progresso de todos os orçamentos
const { data: progress } = useBudgetsProgress();

// Buscar alertas ativos
const { data: alerts } = useBudgetAlerts();
```

### Categorias

```typescript
import { useCategories, useCategory } from '@/hooks';

// Listar todas as categorias
const { data } = useCategories();

// Buscar uma categoria específica
const { data: category } = useCategory(categoryId);
```

### Dashboard e Relatórios

```typescript
import {
  useDashboardSummary,
  useExpensesByCategory,
  useCashFlow,
  useInsights,
} from '@/hooks';

// Resumo do dashboard
const { data: summary } = useDashboardSummary();

// Despesas por categoria
const { data: expenses } = useExpensesByCategory({ period: 'monthly' });

// Fluxo de caixa
const { data: cashFlow } = useCashFlow({ startDate, endDate });

// Insights de IA
const { data: insights } = useInsights();
```

## ✏️ Mutations (Modificar Dados)

### Transações

```typescript
import {
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction
} from '@/hooks';

function TransactionForm() {
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const handleCreate = async () => {
    try {
      await createTransaction.mutateAsync({
        description: 'Almoço',
        amount: 45.50,
        type: 'EXPENSE',
        categoryId: 'cat-123',
        accountId: 'acc-456',
      });
      Alert.alert('Sucesso', 'Transação criada!');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao criar transação');
    }
  };

  const handleUpdate = async (id: string) => {
    await updateTransaction.mutateAsync({
      id,
      data: { description: 'Almoço Atualizado' },
    });
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction.mutateAsync(id);
  };

  return (
    <View>
      <Button
        onPress={handleCreate}
        loading={createTransaction.isPending}
      >
        Criar Transação
      </Button>
    </View>
  );
}
```

### Contas

```typescript
import { useCreateAccount, useUpdateAccount, useDeleteAccount } from '@/hooks';

const createAccount = useCreateAccount();
const updateAccount = useUpdateAccount();
const deleteAccount = useDeleteAccount();

// Criar conta
await createAccount.mutateAsync({
  name: 'Nubank',
  type: 'CHECKING',
  balance: 1000,
  currency: 'BRL',
});

// Atualizar conta
await updateAccount.mutateAsync({
  id: accountId,
  data: { balance: 2000 },
});

// Deletar conta
await deleteAccount.mutateAsync(accountId);
```

### Orçamentos

```typescript
import { useCreateBudget, useUpdateBudget, useDeleteBudget } from '@/hooks';

const createBudget = useCreateBudget();
const updateBudget = useUpdateBudget();
const deleteBudget = useDeleteBudget();

// Criar orçamento
await createBudget.mutateAsync({
  name: 'Alimentação',
  amount: 1500,
  period: 'MONTHLY',
  categoryId: 'cat-123',
});

// Atualizar orçamento
await updateBudget.mutateAsync({
  id: budgetId,
  data: { amount: 2000 },
});

// Deletar orçamento
await deleteBudget.mutateAsync(budgetId);
```

### Categorias

```typescript
import {
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks';

const createCategory = useCreateCategory();

// Criar categoria
await createCategory.mutateAsync({
  name: 'Transporte',
  type: 'EXPENSE',
  color: '#3b82f6',
  icon: 'car',
});
```

## 🔄 Invalidação de Cache

As mutations automaticamente invalidam as queries relacionadas:

| Mutation            | Queries Invalidadas                                |
| ------------------- | -------------------------------------------------- |
| `createTransaction` | `transactions`, `accounts`, `dashboard`, `reports` |
| `updateTransaction` | `transactions`, `accounts`, `dashboard`, `reports` |
| `deleteTransaction` | `transactions`, `accounts`, `dashboard`, `reports` |
| `createAccount`     | `accounts`, `dashboard`, `reports`                 |
| `updateAccount`     | `accounts`, `dashboard`, `reports`                 |
| `deleteAccount`     | `accounts`, `dashboard`, `reports`                 |
| `createBudget`      | `budgets`, `dashboard`                             |
| `updateBudget`      | `budgets`, `progress`, `alerts`, `dashboard`       |
| `deleteBudget`      | `budgets`, `progress`, `alerts`, `dashboard`       |

## 🎯 Exemplo Completo

```typescript
import React from 'react';
import { View, FlatList, Alert } from 'react-native';
import { Button, ActivityIndicator } from 'react-native-paper';
import {
  useTransactions,
  useCreateTransaction,
  useDeleteTransaction
} from '@/hooks';

export default function TransactionsScreen() {
  // Fetch transactions
  const {
    data,
    isLoading,
    error,
    refetch
  } = useTransactions();

  // Mutations
  const createTransaction = useCreateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const handleCreate = async () => {
    try {
      await createTransaction.mutateAsync({
        description: 'Nova transação',
        amount: 100,
        type: 'EXPENSE',
      });
      Alert.alert('Sucesso!');
    } catch (error) {
      Alert.alert('Erro', error.message);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Confirmar',
      'Deletar transação?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          onPress: async () => {
            await deleteTransaction.mutateAsync(id);
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <ActivityIndicator />;
  }

  if (error) {
    return (
      <View>
        <Text>Erro ao carregar</Text>
        <Button onPress={() => refetch()}>
          Tentar Novamente
        </Button>
      </View>
    );
  }

  return (
    <View>
      <Button onPress={handleCreate}>
        Nova Transação
      </Button>
      <FlatList
        data={data?.data}
        renderItem={({ item }) => (
          <TransactionCard
            transaction={item}
            onDelete={() => handleDelete(item.id)}
          />
        )}
      />
    </View>
  );
}
```

## ⚙️ Configuração do QueryClient

O QueryClient está configurado com:

- **staleTime**: 5 minutos (dados considerados frescos por 5min)
- **gcTime**: 10 minutos (cache é limpo após 10min de inatividade)
- **retry**: 2 tentativas em caso de erro
- **refetchOnWindowFocus**: true (refaz query ao retornar ao app)
- **refetchOnReconnect**: true (refaz query quando internet volta)

## 🔑 Query Keys

Cada entidade tem sua estrutura de query keys para facilitar invalidação:

```typescript
// Transactions
transactionKeys.all; // ['transactions']
transactionKeys.lists(); // ['transactions', 'list']
transactionKeys.list(filters); // ['transactions', 'list', filters]
transactionKeys.detail(id); // ['transactions', 'detail', id]

// Accounts
accountKeys.all; // ['accounts']
accountKeys.list(); // ['accounts', 'list']
accountKeys.detail(id); // ['accounts', 'detail', id]

// Budgets
budgetKeys.all; // ['budgets']
budgetKeys.list(); // ['budgets', 'list']
budgetKeys.progress(); // ['budgets', 'progress']
budgetKeys.alerts(); // ['budgets', 'alerts']
```

## 📝 Boas Práticas

1. **Use os hooks diretamente nos componentes**

   ```typescript
   const { data } = useTransactions();
   ```

2. **Sempre trate estados de loading e erro**

   ```typescript
   if (isLoading) return <ActivityIndicator />;
   if (error) return <ErrorView />;
   ```

3. **Use pull-to-refresh para refetch manual**

   ```typescript
   <ScrollView
     refreshControl={
       <RefreshControl refreshing={isLoading} onRefresh={refetch} />
     }
   />
   ```

4. **Para mutations, use try/catch**

   ```typescript
   try {
     await mutation.mutateAsync(data);
   } catch (error) {
     Alert.alert('Erro', error.message);
   }
   ```

5. **Conditional queries com enabled**
   ```typescript
   const { data } = useTransaction(id, !!id); // só busca se id existir
   ```
