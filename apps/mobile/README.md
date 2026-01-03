# 📱 Fayol Mobile App

![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)
![Expo](https://img.shields.io/badge/Expo-54.x-000020.svg)
![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg)

**Versão do Documento:** 1.0 **Última Atualização:** 27 de Dezembro de 2025

Aplicativo móvel multiplataforma do Fayol para gerenciamento financeiro
inteligente, construído com **React Native** e **Expo**

## 📱 Sobre

Este é o aplicativo móvel nativo para iOS e Android do Fayol, desenvolvido com
Expo e React Native.

## 🏗️ Arquitetura

- **Framework**: Expo SDK 54
- **Linguagem**: TypeScript 5.9
- **UI Library**: React Native Paper 5.14 (Material Design 3)
- **Navegação**: React Navigation 7.x
- **Gerenciamento de Estado**: React Context + TanStack React Query (será
  adicionado na Fase 5)
- **Armazenamento**: expo-secure-store + AsyncStorage
- **Autenticação Biométrica**: expo-local-authentication

## 📂 Estrutura de Pastas

```
apps/mobile/
├── src/
│   ├── components/        # Componentes reutilizáveis
│   ├── screens/           # Telas do app
│   │   ├── auth/          # Telas de autenticação
│   │   ├── dashboard/     # Dashboard principal
│   │   ├── transactions/  # Gestão de transações
│   │   ├── accounts/      # Gestão de contas
│   │   ├── budgets/       # Orçamentos
│   │   └── more/          # Tela de mais opções
│   ├── navigation/        # Configuração de navegação
│   ├── contexts/          # Contextos React (Auth, etc.)
│   ├── hooks/             # Hooks customizados
│   ├── services/          # Services layer (API calls)
│   ├── utils/             # Funções utilitárias
│   ├── types/             # Tipos TypeScript específicos
│   ├── constants/         # Constantes da aplicação
│   └── theme/             # Configuração de tema (cores, tipografia)
├── assets/                # Imagens, ícones, fontes
├── .env.development       # Variáveis de ambiente (dev)
├── .env.production        # Variáveis de ambiente (prod)
├── app.json               # Configuração do Expo
├── App.tsx                # Componente raiz
└── package.json           # Dependências
```

## 🚀 Scripts Disponíveis

### Desenvolvimento

```bash
pnpm start              # Iniciar Expo Dev Server
pnpm dev                # Iniciar com cache limpo
pnpm android            # Abrir no emulador Android
pnpm ios                # Abrir no simulador iOS (requer macOS)
pnpm web                # Abrir no navegador
```

### Build

```bash
pnpm build:android      # Build para Android (EAS)
pnpm build:ios          # Build para iOS (EAS)
pnpm build:all          # Build para ambas plataformas
```

### Qualidade de Código

```bash
pnpm lint               # Executar ESLint
pnpm format             # Formatar código com Prettier
pnpm type-check         # Verificar tipos TypeScript
```

### Testes

```bash
pnpm test               # Executar testes
pnpm test:watch         # Executar testes em modo watch
pnpm test:coverage      # Executar testes com cobertura
```

## 🎨 Tema

O app utiliza as cores oficiais do Fayol:

- **Primary**: #3b82f6 (Blue 500)
- **Secondary**: #64748b (Slate 500)
- **Success**: #10b981 (Green 500)
- **Warning**: #f59e0b (Amber 500)
- **Error**: #ef4444 (Red 500)

## 🔧 Configuração

### Variáveis de Ambiente

Copie `.env.example` para `.env.development` e configure:

```env
# API Configuration
API_URL=http://localhost:3333/api
WEBSOCKET_URL=http://localhost:3333

# App Environment
NODE_ENV=development
EXPO_PUBLIC_ENV=development
```

### Dependências do Workspace

O mobile app utiliza os seguintes packages compartilhados:

- `@fayol/shared-types` - Tipos e interfaces
- `@fayol/shared-constants` - Constantes
- `@fayol/shared-utils` - Funções utilitárias
- `@fayol/validation-schemas` - Schemas de validação Zod

## 📋 Status do Desenvolvimento

### ✅ Fase 1: Setup e Infraestrutura (CONCLUÍDA)

- [x] Estrutura do app Expo criada
- [x] Configuração TypeScript + ESLint
- [x] Integração com TurboRepo
- [x] React Native Paper + tema Fayol
- [x] Navegação básica (Auth/App)
- [x] Telas placeholder
- [x] Variáveis de ambiente

### 🔄 Próximas Fases

#### Fase 2: Navegação e Tema

- Melhorias na navegação
- Animações de transição

#### Fase 3: Packages Compartilhados Mobile

- `@fayol/api-client-mobile` - API client para mobile

#### Fase 4: Autenticação

- Telas de Login/Registro
- Context de autenticação
- Autenticação biométrica
- 2FA

#### Fase 5: React Query & Data Fetching

- Setup TanStack React Query
- Hooks customizados

#### Fase 6: Dashboard Principal

- Resumo financeiro
- Gráficos
- Insights de IA

#### Fase 7-9: Features Core

- Transações (CRUD, filtros, IA)
- Contas (gestão completa)
- Orçamentos (com alertas)

#### Fase 10: Push Notifications

- Setup FCM
- Notificações de alertas

#### Fase 12: Offline-First

- WatermelonDB setup
- Sincronização bidirecional

## 🧪 Testando o App

### Expo Go (Desenvolvimento Rápido)

1. Instale o Expo Go no seu dispositivo móvel
2. Execute `pnpm start`
3. Escaneie o QR code com o Expo Go

### Emulador/Simulador

```bash
# Android (requer Android Studio + emulador configurado)
pnpm android

# iOS (requer macOS + Xcode)
pnpm ios
```

## 🔐 Segurança

- Tokens JWT armazenados em `expo-secure-store` (Keychain/Keystore)
- Suporte a autenticação biométrica (Face ID, Touch ID, Fingerprint)
- Todas as comunicações via HTTPS em produção
- Validação de dados com Zod

## 📚 Documentação

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [React Navigation](https://reactnavigation.org/)
- [Plano de Implementação Completo](../../.claude/plans/elegant-sauteeing-leaf.md)

## 🤝 Contribuindo

Este projeto segue os padrões de código do monorepo Fayol:

- TypeScript strict mode
- ESLint + Prettier
- 98.5%+ de cobertura de testes (meta)
- Commits convencionais

## 📄 Licença

Proprietary - Fayol © 2025
