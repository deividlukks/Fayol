# @fayol/api-client-mobile

API Client adaptado para React Native com armazenamento seguro de tokens.

## 📦 Sobre

Este package é um wrapper do `@fayol/api-client` adaptado para React Native,
utilizando:

- **expo-secure-store** (Keychain/Keystore) para armazenamento seguro de tokens
- **AsyncStorage** para cache e dados não-sensíveis
- Métodos assíncronos compatíveis com React Native

## 🚀 Instalação

```bash
pnpm add @fayol/api-client-mobile
```

## 📖 Uso Básico

### 1. Autenticação

```typescript
import { authService } from '@fayol/api-client-mobile';

// Login
const login = async (email: string, password: string) => {
  try {
    const response = await authService.login({ email, password });

    if (response.success) {
      // Token é automaticamente armazenado no SecureStore
      console.log('Usuário autenticado:', response.data.user);
    }
  } catch (error) {
    console.error('Erro no login:', error);
  }
};

// Logout
const logout = async () => {
  await authService.logout();
  // Token é automaticamente removido do SecureStore
};

// Verificar se está autenticado
const isAuth = await authService.isAuthenticated();
```

### 2. Transações

```typescript
import { transactionsService } from '@fayol/api-client-mobile';

// Listar transações
const fetchTransactions = async () => {
  const response = await transactionsService.findAll();
  return response.data;
};

// Criar transação
const createTransaction = async (data) => {
  const response = await transactionsService.create({
    description: 'Almoço',
    amount: 45.5,
    type: 'EXPENSE',
    categoryId: 'cat-123',
    accountId: 'acc-456',
    date: new Date().toISOString(),
  });
  return response.data;
};

// Atualizar transação
const updateTransaction = async (id: string, data) => {
  const response = await transactionsService.update(id, data);
  return response.data;
};

// Deletar transação
const deleteTransaction = async (id: string) => {
  await transactionsService.remove(id);
};
```

### 3. Contas

```typescript
import { accountsService } from '@fayol/api-client-mobile';

// Listar contas
const fetchAccounts = async () => {
  const response = await accountsService.findAll();
  return response.data;
};

// Criar conta
const createAccount = async (data) => {
  const response = await accountsService.create({
    name: 'Nubank',
    type: 'CHECKING',
    balance: 1000,
    currency: 'BRL',
  });
  return response.data;
};
```

### 4. Orçamentos

```typescript
import { budgetsService } from '@fayol/api-client-mobile';

// Listar orçamentos
const fetchBudgets = async () => {
  const response = await budgetsService.findAll();
  return response.data;
};

// Obter progresso dos orçamentos
const getBudgetsProgress = async () => {
  const response = await budgetsService.getProgress();
  return response.data;
};

// Obter alertas ativos
const getActiveAlerts = async () => {
  const response = await budgetsService.getAlerts();
  return response.data;
};
```

### 5. Relatórios

```typescript
import { reportsService } from '@fayol/api-client-mobile';

// Resumo do dashboard
const getDashboardSummary = async () => {
  const response = await reportsService.getSummary();
  return response.data;
};

// Despesas por categoria
const getExpensesByCategory = async () => {
  const response = await reportsService.getExpensesByCategory();
  return response.data;
};

// Insights de IA
const getAIInsights = async () => {
  const response = await reportsService.getInsights();
  return response.data;
};
```

## 🔧 Uso Avançado

### Storage Adapter Direto

```typescript
import { mobileStorage } from '@fayol/api-client-mobile';

// Armazenar dados genéricos
await mobileStorage.setItem('myKey', 'myValue');
const value = await mobileStorage.getItem('myKey');

// Armazenar objetos JSON
await mobileStorage.setObject('user', { name: 'John' });
const user = await mobileStorage.getObject('user');

// Limpar storage
await mobileStorage.clear();
```

### Cliente HTTP Customizado

```typescript
import { HttpClientMobile } from '@fayol/api-client-mobile';

class MyCustomService extends HttpClientMobile {
  constructor() {
    super({
      baseURL: 'https://api.meuservico.com',
      timeout: 30000,
      enableRetry: true,
      enableCache: true,
    });
  }

  async myCustomMethod() {
    return this.get('/my-endpoint');
  }
}
```

## 📚 Services Disponíveis

Todos os services são singleton instances prontos para uso:

| Service               | Descrição     | Métodos Principais                                           |
| --------------------- | ------------- | ------------------------------------------------------------ |
| `authService`         | Autenticação  | `login()`, `register()`, `logout()`, `me()`                  |
| `transactionsService` | Transações    | `findAll()`, `findOne()`, `create()`, `update()`, `remove()` |
| `accountsService`     | Contas        | `findAll()`, `findOne()`, `create()`, `update()`, `remove()` |
| `budgetsService`      | Orçamentos    | `findAll()`, `create()`, `getProgress()`, `getAlerts()`      |
| `categoriesService`   | Categorias    | `findAll()`, `findOne()`, `create()`, `update()`, `remove()` |
| `goalsService`        | Metas         | `findAll()`, `create()`, `updateAmount()`                    |
| `reportsService`      | Relatórios    | `getSummary()`, `getExpensesByCategory()`, `getInsights()`   |
| `investmentsService`  | Investimentos | `findAll()`, `create()`, `getPortfolioProfitability()`       |
| `tradingService`      | Trading       | `getPortfolio()`, `getTrades()`, `createTrade()`             |
| `usersService`        | Usuários      | `getProfile()`, `updateProfile()`, `changePassword()`        |

## 🔐 Segurança

### Armazenamento de Tokens

- **Tokens de autenticação**: Armazenados no **expo-secure-store** (Keychain no
  iOS, Keystore no Android)
- **Refresh tokens**: Também armazenados no **expo-secure-store**
- **Dados do usuário**: Armazenados no **AsyncStorage** (não-sensível)
- **Cache**: Armazenado no **AsyncStorage**

### Boas Práticas

```typescript
// ✅ BOM: Sempre usar await com métodos de storage
const token = await authService.getToken();

// ❌ RUIM: Não usar await pode causar race conditions
const token = authService.getToken(); // Retorna Promise, não o valor!

// ✅ BOM: Verificar autenticação antes de chamadas protegidas
if (await authService.isAuthenticated()) {
  const data = await transactionsService.findAll();
}

// ✅ BOM: Limpar tokens no logout
await authService.logout(); // Limpa tokens + cache
```

## 🔄 Integração com React Query

Exemplo de uso com TanStack React Query:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsService } from '@fayol/api-client-mobile';

// Hook para listar transações
export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await transactionsService.findAll();
      return response.data;
    },
  });
}

// Hook para criar transação
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await transactionsService.create(data);
      return response.data;
    },
    onSuccess: () => {
      // Invalida cache após criar
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}
```

## 🐛 Tratamento de Erros

```typescript
import {
  ApiError,
  UnauthorizedError,
  ValidationError,
  NetworkError,
} from '@fayol/api-client-mobile';

try {
  await transactionsService.create(data);
} catch (error) {
  if (error instanceof UnauthorizedError) {
    // Token expirado - redirecionar para login
    await authService.logout();
    navigation.navigate('Login');
  } else if (error instanceof ValidationError) {
    // Erros de validação
    console.log('Erros:', error.errors);
  } else if (error instanceof NetworkError) {
    // Sem conexão
    Alert.alert('Sem conexão', 'Verifique sua internet');
  } else {
    // Erro genérico
    console.error('Erro:', error);
  }
}
```

## 📝 Configuração do Ambiente

Configure a URL da API no `.env`:

```env
# .env.development
API_URL=http://localhost:3333/api

# .env.production
API_URL=https://api.fayol.app.br/api
```

## 🔗 Dependências

- `@fayol/api-client` - Cliente HTTP base
- `@fayol/shared-types` - Tipos compartilhados
- `@react-native-async-storage/async-storage` - Storage assíncrono
- `expo-secure-store` - Armazenamento seguro
- `axios` - Cliente HTTP

## 📄 Licença

Proprietary - Fayol © 2025
