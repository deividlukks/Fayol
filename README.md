<div align="center">

# 💰 Fayol

### Sistema Multiplataforma de Gestão Financeira Pessoal com IA

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/deividlukks/fayol)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Features](#-features) •
[Arquitetura](#-arquitetura) •
[Início Rápido](#-início-rápido) •
[Documentação](#-documentação) •
[Tecnologias](#-tecnologias) •
[Roadmap](#-roadmap)

</div>

---

## 📖 Sobre o Projeto

**Fayol** é uma plataforma completa de gestão financeira pessoal que combina o poder da **Inteligência Artificial** com uma arquitetura moderna de microsserviços. O sistema oferece controle total sobre suas finanças através de múltiplas plataformas: **Web**, **Mobile** e **Telegram Bot**.

### 🎯 Objetivos

- **Automatização Inteligente**: Categorização automática de transações usando Machine Learning
- **Insights Preditivos**: Previsão de gastos futuros e detecção de anomalias
- **Multiplataforma**: Acesso via web, mobile (iOS/Android) e Telegram
- **Privacidade First**: Compliance total com LGPD/GDPR
- **Open Source**: Código aberto e extensível

---

## ✨ Features

### 🧠 Inteligência Artificial
- ✅ **Categorização Automática** de transações com **93-96% de acurácia** (Ensemble: XGBoost, LightGBM, CatBoost, Naive Bayes)
- ✅ **Aprendizado Contínuo** com feedback do usuário
- ✅ **Detecção de Anomalias** usando Isolation Forest e LOF
- ✅ **Forecasting** de despesas futuras (Ensemble: Prophet, Auto-ARIMA, Exponential Smoothing, Ridge Regression)
- ✅ **Insights Estatísticos** personalizados com análise de padrões e tendências

### 💼 Gestão Financeira
- ✅ **Múltiplas Contas**: Corrente, Poupança, Investimentos, Cartão de Crédito, Dinheiro
- ✅ **Múltiplas Moedas**: BRL, USD, EUR com conversão automática
- ✅ **Transações Recorrentes**: Diária, Semanal, Mensal, Anual, Customizada
- ✅ **Orçamentos Inteligentes**: Alertas configuráveis (threshold personalizado)
- ✅ **Metas Financeiras**: Acompanhamento visual de objetivos
- ✅ **Categorias Personalizadas**: Crie e organize do seu jeito
- 🔜 **Importação de Extratos**: OFX, CSV (planejado)

### 📊 Investimentos
- ✅ **Carteira de Ativos**: Ações BR/US, FIIs, Criptomoedas, Renda Fixa, ETFs
- ✅ **Histórico de Trades**: Controle completo de compras e vendas (BUY/SELL)
- ✅ **Cálculo Automático**: Preço médio, rendimento (yield), P&L
- ✅ **Portfolio Chart**: Visualização de diversificação
- 🔜 **Cotações em Tempo Real**: Alpha Vantage/Yahoo Finance (planejado - atualmente mock)

### 📈 Relatórios & Analytics
- ✅ **Dashboards Interativos**: Visualizações com Recharts
- ✅ **Exportação de Dados**: PDF, Excel, CSV
- ✅ **Análise de Tendências**: Comparativos mensais/anuais
- ✅ **Relatórios Customizáveis**: Geração via serviço Python

### 🔒 Segurança & Compliance
- ✅ **Two-Factor Authentication (2FA)**: TOTP via Google Authenticator
- ✅ **Auditoria Completa**: Rastreamento de todas as ações
- ✅ **LGPD/GDPR Compliance**: Gestão de consentimentos
- ✅ **Portabilidade de Dados**: Exportação completa sob demanda
- ✅ **Soft Delete**: Recuperação de dados excluídos

### 🌐 Integrações
- ✅ **Email**: Resend (SMTP/Gmail/Ethereal) com templates HTML
- ✅ **Telegram Bot**: Lançamento rápido com detecção inteligente (90+ palavras-chave)
- ✅ **Market Data**: Currency conversion em tempo real
- 🔜 **Open Banking**: Pluggy, Belvo (Fase 15 - planejado)
- 🔜 **Pagamentos**: Stripe, PagSeguro, PIX (planejado)
- 🔜 **Cotações**: Alpha Vantage, Yahoo Finance (planejado)
- 🔜 **Push Notifications**: Firebase Cloud Messaging (mobile - planejado)

---

## 🏗️ Arquitetura

### Visão Geral

O Fayol é construído como um **monorepo moderno** utilizando **TurboRepo**, com microsserviços especializados para cada domínio:

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Next.js  │  │  Mobile  │  │ Telegram │  │   API    │   │
│  │   Web    │  │  (Expo)  │  │   Bot    │  │  Docs    │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼─────────────┼─────────────┼─────────────┼──────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                          │
        ┌─────────────────▼─────────────────────────────┐
        │         GATEWAY & API (NestJS)                │
        │  ┌─────────────────────────────────────────┐  │
        │  │ REST API │ WebSockets │ Authentication │  │
        │  │ Rate Limiting │ CORS │ Validation      │  │
        │  └─────────────────────────────────────────┘  │
        └───────┬────────────────────────────┬──────────┘
                │                            │
    ┌───────────▼──────────┐     ┌──────────▼──────────┐
    │  MICROSERVICES       │     │  INFRASTRUCTURE      │
    │  ┌────────────────┐  │     │  ┌────────────────┐ │
    │  │  Python AI     │  │     │  │  PostgreSQL    │ │
    │  │  (FastAPI)     │  │     │  │  (Database)    │ │
    │  ├────────────────┤  │     │  ├────────────────┤ │
    │  │  BI Reports    │  │     │  │  Redis         │ │
    │  │  (Python)      │  │     │  │  (Cache/Queue) │ │
    │  └────────────────┘  │     │  └────────────────┘ │
    └──────────────────────┘     └─────────────────────┘
```

### Stack Tecnológico por Camada

| Camada | Tecnologias | Porta |
|--------|-------------|-------|
| **Frontend Web** | Next.js 16, React 18, TailwindCSS, Shadcn/UI | 3000 |
| **Mobile** | React Native, Expo 54, React Navigation 7 | - |
| **Backend API** | NestJS 10, Prisma ORM, PostgreSQL 15 | 3333 |
| **AI Service** | Python 3.11, FastAPI, Scikit-learn, Pandas | 8000 |
| **BI Service** | Python 3.11, FastAPI, Pandas, Openpyxl | 8001 |
| **Database** | PostgreSQL 15 (Alpine) | 5432 |
| **Cache/Queue** | Redis 7 + BullMQ | 6379 |
| **Telegram Bot** | Telegraf 4.15, Node.js 20 | - |

### Packages Compartilhados

```
packages/
├── database-models/       # Prisma Client & Schema
├── shared-types/          # TypeScript DTOs & Interfaces
├── shared-utils/          # Funções utilitárias
├── shared-constants/      # Constantes globais
├── shared-errors/         # Error handling
├── validation-schemas/    # Zod schemas
├── ui-components/         # Design System (Shadcn/UI)
├── api-client/            # HTTP Client (Web)
├── api-client-mobile/     # HTTP Client (Mobile)
├── ai-services/           # AI Integration Client
└── integrations/          # Third-party integrations
```

---

## 🚀 Início Rápido

### Pré-requisitos

Certifique-se de ter instalado:

- **Node.js** >= 20.0.0 ([Download](https://nodejs.org/))
- **PNPM** >= 9.0.0 (`npm install -g pnpm@latest`)
- **Docker** & **Docker Compose** ([Download](https://www.docker.com/))
- **Git** ([Download](https://git-scm.com/))

### Instalação Automatizada (Recomendado)

#### Windows (PowerShell)
```powershell
# Clone o repositório
git clone https://github.com/deividlukks/fayol.git
cd fayol

# Execute o script de inicialização automática
.\scripts\start.ps1
```

#### Linux / macOS
```bash
# Clone o repositório
git clone https://github.com/deividlukks/fayol.git
cd fayol

# Execute o script de inicialização
chmod +x scripts/start.sh
./scripts/start.sh
```

O script automatizado irá:
1. ✅ Verificar pré-requisitos (Docker, Node, PNPM)
2. ✅ Criar arquivo `.env` a partir do `.env.example`
3. ✅ Instalar dependências com `pnpm install`
4. ✅ Iniciar infraestrutura (PostgreSQL, Redis)
5. ✅ Executar migrations do banco de dados
6. ✅ Fazer seed de dados iniciais
7. ✅ Iniciar todos os serviços

### Instalação Manual

<details>
<summary>Clique para expandir instruções manuais</summary>

#### 1. Clone o Repositório
```bash
git clone https://github.com/deividlukks/fayol.git
cd fayol
```

#### 2. Configure Variáveis de Ambiente
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o .env com suas configurações
# Para desenvolvimento local, os valores padrão funcionam
```

#### 3. Instale Dependências
```bash
# Instale todas as dependências do monorepo
pnpm install
```

#### 4. Inicie a Infraestrutura
```bash
# Inicie PostgreSQL e Redis via Docker
pnpm docker:start

# Aguarde os serviços ficarem prontos (healthcheck)
pnpm docker:status
```

#### 5. Configure o Banco de Dados
```bash
# Gere o Prisma Client
pnpm --filter @fayol/database-models run generate

# Execute migrations
pnpm --filter @fayol/database-models run migrate:dev

# (Opcional) Popule com dados de exemplo
pnpm --filter @fayol/database-models run seed
```

#### 6. Inicie os Serviços
```bash
# Inicie todos os serviços em modo desenvolvimento
pnpm dev
```

</details>

### Acessar a Aplicação

Após a inicialização, os serviços estarão disponíveis em:

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| 🌐 **Frontend Web** | http://localhost:3000 | - |
| 🔌 **Backend API** | http://localhost:3333/api | - |
| 📘 **API Docs (Swagger)** | http://localhost:3333/api/docs | - |
| 🤖 **AI Service** | http://localhost:8000 | - |
| 📊 **BI Reports** | http://localhost:8001 | - |
| 🗄️ **PGAdmin** | http://localhost:5050 | admin@fayol.app / admin_pg_secure |
| 📱 **Expo DevTools** | http://localhost:19006 | - |

### Usuário de Teste

Se você executou o seed, um usuário de teste foi criado:

- **Email**: `admin@fayol.app`
- **Senha**: `Admin@123`

---

## 📚 Documentação

### Guias Principais

- 📖 **[Guia de Desenvolvimento](docs/DEV_GUIDE.md)** - Setup detalhado, arquitetura e boas práticas
- 🚀 **[Guia de Deploy](docs/HOSTING_GUIDE.md)** - Opções de hospedagem gratuita (Oracle, Vercel, Railway, etc.)
- 🏗️ **[Arquitetura](docs/ARCHITECTURE.md)** - Diagramas e decisões arquiteturais
- 🔌 **[API Reference](http://localhost:3333/api/docs)** - Documentação Swagger (após iniciar o backend)

### Documentação por Aplicação

- **Backend (NestJS)**: [apps/backend/README.md](apps/backend/README.md)
- **Frontend Web (Next.js)**: [apps/web-app/README.md](apps/web-app/README.md)
- **Mobile (React Native)**: [apps/mobile/README.md](apps/mobile/README.md)
- **AI Service (Python)**: [libs/python-ai/README.md](libs/python-ai/README.md)

---

## 🛠️ Tecnologias

### Backend & Infrastructure

![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)

### Frontend & Mobile

![Next.js](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?logo=tailwindcss&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-61DAFB?logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-000020?logo=expo&logoColor=white)

### AI & Data Science

![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![Scikit Learn](https://img.shields.io/badge/Scikit_Learn-F7931E?logo=scikitlearn&logoColor=white)
![Pandas](https://img.shields.io/badge/Pandas-150458?logo=pandas&logoColor=white)

### DevOps & Observability

![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?logo=githubactions&logoColor=white)
![Sentry](https://img.shields.io/badge/Sentry-362D59?logo=sentry&logoColor=white)
![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-000000?logo=opentelemetry&logoColor=white)
![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?logo=prometheus&logoColor=white)

### Tools & Utilities

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?logo=zod&logoColor=white)
![TurboRepo](https://img.shields.io/badge/TurboRepo-EF4444?logo=turborepo&logoColor=white)
![PNPM](https://img.shields.io/badge/PNPM-F69220?logo=pnpm&logoColor=white)

---

## 📋 Scripts Disponíveis

### Desenvolvimento

```bash
# Iniciar todos os serviços em modo desenvolvimento
pnpm dev

# Iniciar apenas o backend
pnpm --filter backend run dev

# Iniciar apenas o frontend
pnpm --filter web-app run dev

# Iniciar aplicativo mobile
pnpm --filter mobile run start
```

### Build & Produção

```bash
# Build de todos os workspaces
pnpm build

# Build otimizado para produção
NODE_ENV=production pnpm build

# Iniciar em modo produção
pnpm start
```

### Testes

```bash
# Executar todos os testes
pnpm test

# Testes unitários
pnpm test:unit

# Testes de integração
pnpm test:integration

# Testes E2E
pnpm test:e2e

# Cobertura de código
pnpm test:coverage
```

### Qualidade de Código

```bash
# Lint (ESLint)
pnpm lint

# Formatação (Prettier)
pnpm format

# Type Check (TypeScript)
pnpm type-check
```

### Docker

```bash
# Iniciar todos os containers
pnpm docker:start

# Parar containers
pnpm docker:stop

# Ver status
pnpm docker:status

# Ver logs em tempo real
pnpm docker:logs

# Limpar tudo (incluindo volumes)
pnpm docker:clean
```

### Banco de Dados

```bash
# Gerar Prisma Client
pnpm --filter @fayol/database-models run generate

# Criar nova migration
pnpm --filter @fayol/database-models run migrate:dev

# Executar migrations em produção
pnpm --filter @fayol/database-models run migrate:deploy

# Abrir Prisma Studio (GUI)
pnpm --filter @fayol/database-models run studio

# Seed do banco de dados
pnpm --filter @fayol/database-models run seed
```

---

## 🗺️ Roadmap

### ✅ Fase 1: MVP (Concluído)
- [x] Autenticação e autorização com JWT
- [x] CRUD de contas, transações e categorias
- [x] Dashboard básico
- [x] Serviço de IA para categorização
- [x] App mobile básico

### ✅ Fase 2: Recursos Avançados (95% Concluído)
- [x] Two-Factor Authentication (2FA) com TOTP
- [x] Orçamentos inteligentes com alertas configuráveis
- [x] Metas financeiras com tracking
- [x] Carteira de investimentos completa
- [x] Trading (BUY/SELL) com cálculo de preço médio
- [x] Exportação de relatórios (PDF/Excel/CSV)
- [x] Telegram Bot com lançamento rápido inteligente
- [x] Insights de IA (categorização, anomalias, forecasting)
- [x] WebSockets para atualizações em tempo real
- [x] LGPD Compliance (consentimentos, portabilidade, exclusão)
- [ ] Integração com Open Banking (Fase 15)
- [ ] Importação de extratos (OFX, CSV) (Fase 15)
- [ ] Cotações em tempo real via API
- [ ] Notificações push no mobile
- [ ] Modo offline no mobile

### 📅 Fase 3: Expansão (Planejado)
- [ ] Marketplace de integrações
- [ ] White-label para empresas
- [ ] API pública com rate limiting
- [ ] Suporte multi-idiomas (i18n)
- [ ] Tema dark mode personalizado
- [ ] Assistente de IA conversacional
- [ ] Compartilhamento de orçamentos (famílias)

### 🔮 Fase 4: Enterprise (Futuro)
- [ ] Multi-tenancy
- [ ] SSO (Single Sign-On)
- [ ] Auditoria avançada
- [ ] SLA e uptime monitoring
- [ ] Suporte para múltiplas moedas

---

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Veja nosso [Guia de Contribuição](CONTRIBUTING.md) para começar.

### Como Contribuir

1. **Fork** o projeto
2. Crie uma **branch** para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'feat: Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. Abra um **Pull Request**

### Padrão de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação, ponto e vírgula, etc
- `refactor`: Refatoração de código
- `test`: Testes
- `chore`: Manutenção

---

## 📄 Licença

Este projeto está licenciado sob a licença **MIT** - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 👨‍💻 Autor

Desenvolvido com 💙 por **Deivid Lucas**

- GitHub: [@deividlukks](https://github.com/deividlukks)
- LinkedIn: [Deivid Lucas](https://linkedin.com/in/deividlukks)
- Email: [contato@deividlucas.dev](mailto:contato@deividlucas.dev)

---

## 🙏 Agradecimentos

- [NestJS](https://nestjs.com/) - Framework backend incrível
- [Next.js](https://nextjs.org/) - O melhor framework React
- [Prisma](https://www.prisma.io/) - ORM moderno e type-safe
- [Shadcn/UI](https://ui.shadcn.com/) - Componentes UI lindos
- [TurboRepo](https://turbo.build/) - Monorepo veloz
- Comunidade Open Source 💚

---

## ⭐ Star History

Se este projeto te ajudou, considere dar uma ⭐ no repositório!

[![Star History Chart](https://api.star-history.com/svg?repos=deividlukks/fayol&type=Date)](https://star-history.com/#deividlukks/fayol&Date)

---

<div align="center">

**[⬆ Voltar ao topo](#-fayol)**

Made with ❤️ using Fayol

</div>
