# 🚀 Fayol - Gestor Financeiro Inteligente

![Fayol Banner](apps/web-app/public/logo.png)

> **Sistema Multiplataforma de Gestão Financeira Pessoal, Investimentos e Trading.**
> _Impulsionado por Inteligência Artificial e Arquitetura de Microsserviços._

---

## 📋 Sobre o Projeto

O **Fayol** é uma solução completa para quem deseja assumir o controle de suas finanças. Diferente de planilhas ou apps simples, ele integra gestão de contas, controle de orçamentos, acompanhamento de investimentos e sinais de trading em um único ecossistema, acessível via Web e Chatbots (Telegram).

A plataforma utiliza **IA** para categorizar transações automaticamente e gerar insights personalizados sobre seus hábitos de consumo.

---

## 🏗️ Arquitetura (Monorepo)

O projeto utiliza **TurboRepo** e **PNPM Workspaces** para orquestrar múltiplos serviços e pacotes compartilhados com máxima eficiência.

### 📱 Aplicações (`/apps`)

| Aplicação        | Tecnologia                   | Porta  | Descrição                                           |
| :--------------- | :--------------------------- | :----- | :-------------------------------------------------- |
| **web-app**      | Next.js 14, Tailwind, Shadcn | `3000` | Dashboard principal e interface do usuário.         |
| **backend**      | NestJS, Prisma, Postgres     | `3333` | API RESTful core, regras de negócio e autenticação. |
| **telegram-bot** | Telegraf, Node.js            | N/A    | Interface conversacional para lançamentos rápidos.  |

### 🐍 Microserviços (`/libs`)

| Serviço        | Tecnologia                    | Porta  | Descrição                                                       |
| :------------- | :---------------------------- | :----- | :-------------------------------------------------------------- |
| **python-ai**  | Python, FastAPI, Scikit-learn | `8000` | Motor de Inteligência Artificial para categorização e insights. |
| **bi-reports** | Python, Pandas                | N/A    | Gerador de relatórios analíticos avançados (PDF/Excel).         |

### 📦 Pacotes Compartilhados (`/packages`)

| Pacote                 | Função                                                               |
| :--------------------- | :------------------------------------------------------------------- |
| **database-models**    | Schema do Prisma (Single Source of Truth) e cliente gerado.          |
| **shared-types**       | Interfaces TypeScript (DTOs, Enums) isomórficas (Front/Back).        |
| **shared-utils**       | Funções puras utilitárias (formatação, datas, cálculos financeiros). |
| **validation-schemas** | Schemas Zod para validação de dados unificada.                       |
| **ai-services**        | Interfaces e lógica de negócio para comunicação com a IA.            |
| **integrations**       | Adaptadores para APIs externas (Open Finance, Market Data).          |
| **ui-components**      | Biblioteca de componentes React reutilizáveis.                       |

---

## 🛠️ Pré-requisitos

Antes de começar, garanta que você possui instalado:

- **Node.js** (v20 ou superior)
- **PNPM** (`npm install -g pnpm`)
- **Docker Desktop** (com Docker Compose V2 habilitado)
- **Git**

---

## 🚀 Inicialização Rápida

Siga estes passos para rodar o projeto localmente em modo de desenvolvimento.

### 1. Configuração de Ambiente

Copie o arquivo de exemplo `.env.example` para `.env` na raiz. As configurações padrão já são compatíveis com o Docker.

```bash
cp .env.example .env
```
