# Fayol Web App

Aplicação web frontend do sistema Fayol de gestão financeira pessoal e empresarial.

## Tecnologias Utilizadas

- **Framework**: Next.js 16 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Gerenciamento de Estado**: React Query (TanStack Query)
- **Formulários**: React Hook Form + Zod
- **Gráficos**: Recharts
- **Ícones**: Lucide React

## Estrutura do Projeto

```
apps/web-app/
├── src/
│   ├── app/                      # App Router (Next.js 16)
│   │   ├── auth/                 # Páginas de autenticação
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── dashboard/            # Páginas do dashboard
│   │   │   ├── accounts/         # Gestão de contas bancárias
│   │   │   ├── budgets/          # Orçamentos
│   │   │   ├── goals/            # Metas financeiras
│   │   │   ├── investments/      # Investimentos
│   │   │   ├── reports/          # Relatórios e exportação
│   │   │   ├── settings/         # Configurações
│   │   │   ├── transactions/     # Transações
│   │   │   └── page.tsx          # Dashboard principal
│   │   └── layout.tsx            # Layout global
│   ├── components/               # Componentes React
│   │   ├── auth/                 # Componentes de autenticação
│   │   ├── forms/                # Formulários reutilizáveis
│   │   ├── layout/               # Componentes de layout
│   │   ├── settings/             # Componentes de configurações
│   │   └── ui/                   # Componentes UI base
│   ├── contexts/                 # Contextos React
│   │   └── auth.context.tsx      # Contexto de autenticação
│   ├── hooks/                    # Hooks customizados
│   │   ├── useAccounts.ts
│   │   ├── useBudgets.ts
│   │   ├── useGoals.ts
│   │   ├── useInvestments.ts
│   │   └── useTransactions.ts
│   ├── lib/                      # Utilitários
│   │   └── api.ts                # Cliente HTTP com interceptors
│   └── providers/                # Providers React
│       └── react-query-provider.tsx
├── public/                       # Arquivos estáticos
└── package.json
```

## Packages Compartilhados Consumidos

O web-app consome os seguintes packages compartilhados do monorepo:

### 1. @fayol/api-client
Biblioteca de serviços para consumo da API REST.

```typescript
import { AuthService, TransactionsService, AccountsService } from '@fayol/api-client';

// Exemplo de uso
const response = await AuthService.login({ email, password });
const transactions = await TransactionsService.getAll();
```

### 2. @fayol/shared-types
Tipos TypeScript compartilhados entre backend e frontend.

```typescript
import { User, Transaction, Account, Budget, Goal } from '@fayol/shared-types';
```

### 3. @fayol/validation-schemas
Schemas de validação Zod compartilhados.

```typescript
import { loginSchema, registerSchema, transactionSchema } from '@fayol/validation-schemas';
```

### 4. @fayol/shared-utils
Utilitários para formatação e cálculos.

```typescript
import { CurrencyUtils, DateUtils, FinancialUtils } from '@fayol/shared-utils';

// Exemplo de uso
const formatted = CurrencyUtils.format(1500.50); // "R$ 1.500,50"
const date = DateUtils.formatDate(new Date());
const progress = FinancialUtils.calculateBudgetProgress(spent, limit);
```

### 5. @fayol/shared-constants
Constantes compartilhadas do sistema.

```typescript
import { APP_CONFIG } from '@fayol/shared-constants';
```

## Funcionalidades Implementadas

### Autenticação
- ✅ Login com email/telefone/CPF
- ✅ Registro de usuários
- ✅ Recuperação de senha
- ✅ Reset de senha
- ✅ Proteção de rotas com AuthContext
- ✅ Interceptors HTTP para tokens

### Dashboard
- ✅ Visão geral com métricas principais
- ✅ Gráficos de fluxo de caixa
- ✅ Distribuição de despesas por categoria
- ✅ Últimas transações
- ✅ Insights da IA (integração futura)
- ✅ Orçamento global
- ✅ Progresso de metas

### Transações
- ✅ Listagem com filtros e busca
- ✅ CRUD completo (Create, Read, Update, Delete)
- ✅ Categorização
- ✅ Status de pagamento
- ✅ Modal de edição

### Contas
- ✅ Gestão de múltiplas contas
- ✅ Suporte a diferentes tipos (corrente, poupança, investimento, etc)
- ✅ Cartões de crédito com limite
- ✅ Multi-moeda (BRL, USD)
- ✅ Saldos consolidados

### Orçamentos
- ✅ Criação de orçamentos por categoria ou global
- ✅ Acompanhamento de gastos vs limite
- ✅ Barra de progresso visual
- ✅ Alertas de estouro

### Investimentos
- ✅ Carteira de investimentos
- ✅ Ações (BR e US), FIIs, Tesouro, Crypto
- ✅ Cálculo de rentabilidade
- ✅ Patrimônio consolidado

### Metas
- ✅ Criação de metas financeiras
- ✅ Acompanhamento de progresso
- ✅ Definição de prazos
- ✅ Cores personalizadas

### Relatórios
- ✅ Exportação em PDF
- ✅ Exportação em Excel (XLSX)
- ✅ Seleção de período
- ✅ Dados detalhados para análise

### Configurações
- ✅ Edição de perfil
- ✅ Upload de foto de perfil
- ✅ Gerenciamento de categorias
- ✅ Criação de subcategorias
- ✅ Preferências de notificações
- ✅ Informações de assinatura

## Hooks Customizados

O web-app implementa hooks customizados para facilitar o consumo da API:

```typescript
// Transações
const { data: transactions } = useTransactions();
const createMutation = useCreateTransaction();
const updateMutation = useUpdateTransaction();
const deleteMutation = useDeleteTransaction();

// Contas
const { data: accounts } = useAccounts();
const createMutation = useCreateAccount();

// Orçamentos
const { data: budgets } = useBudgets();

// Metas
const { data: goals } = useGoals();

// Investimentos
const { data: investments } = useInvestments();
```

## Contextos

### AuthContext
Gerencia o estado de autenticação da aplicação.

```typescript
const { user, isAuthenticated, isLoading, login, logout, updateUser } = useAuth();
```

## Componentes UI Reutilizáveis

O web-app possui componentes UI base construídos com Tailwind CSS:

- `Button`: Botões com variantes (default, outline, ghost, etc)
- `Card`: Cards com header, content e footer
- `Input`: Campos de entrada
- `Select`: Seleção dropdown
- `Modal`: Modais reutilizáveis
- `Badge`: Badges coloridos
- `Progress`: Barra de progresso
- `Switch`: Toggle switch
- `Tabs`: Sistema de abas
- `Accordion`: Acordeão expansível

## Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev

# Build de produção
pnpm build

# Iniciar produção
pnpm start

# Lint
pnpm lint
```

## Variáveis de Ambiente

Crie um arquivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3333/api
```

## Integração com Backend

O web-app se comunica com o backend através da lib `api.ts` que:

1. Configura axios com baseURL
2. Adiciona interceptor de request para incluir token
3. Adiciona interceptor de response para tratar erros 401
4. Redireciona para login em caso de token expirado

```typescript
// apps/web-app/src/lib/api.ts
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api',
});

// Injeta token em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## Princípios de Design

### 1. Consumo de Packages Compartilhados
Todo código reutilizável está nos packages compartilhados para evitar duplicação.

### 2. Separação de Responsabilidades
- Componentes de UI são genéricos e reutilizáveis
- Lógica de negócio está nos hooks customizados
- Validação de formulários usa schemas compartilhados
- Formatação usa utilitários compartilhados

### 3. Type Safety
Uso extensivo de TypeScript com tipos compartilhados do backend.

### 4. Performance
- React Query para cache e sincronização
- Lazy loading de componentes
- Otimização de imagens com Next.js Image

### 5. UX
- Feedback visual de loading
- Mensagens de erro claras
- Animações suaves
- Responsivo mobile-first

## Próximos Passos

- [ ] Implementar testes unitários (Jest + React Testing Library)
- [ ] Implementar testes E2E (Playwright)
- [ ] Adicionar modo escuro
- [ ] Implementar PWA (Progressive Web App)
- [ ] Otimizar bundle size
- [ ] Implementar analytics

## Contribuindo

Este projeto faz parte do monorepo Fayol. Consulte o README principal para instruções de desenvolvimento.
