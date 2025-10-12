# Fayol Mobile App

Aplicativo móvel do Fayol Gestor desenvolvido com React Native e Expo.

## Pré-requisitos

- Node.js 20+
- Expo CLI
- React Native development environment

## Instalação

```bash
pnpm install
```

## Desenvolvimento

```bash
# Iniciar o servidor Expo
pnpm start

# Executar no Android
pnpm android

# Executar no iOS
pnpm ios

# Executar no navegador
pnpm web
```

## Estrutura do Projeto

```
mobile-app/
├── app/              # Expo Router - rotas da aplicação
├── src/
│   ├── components/   # Componentes reutilizáveis
│   ├── screens/      # Telas da aplicação
│   ├── services/     # Serviços e API
│   ├── store/        # Zustand store
│   └── utils/        # Utilitários
├── assets/           # Imagens, fontes, etc
└── app.json          # Configuração do Expo
```

## Stack Tecnológica

- React Native
- Expo & Expo Router
- TypeScript
- Zustand (gerenciamento de estado)
- Axios (requisições HTTP)
