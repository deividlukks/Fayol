# 💰 Fayol - Funcionalidades Completas do Sistema

**Versão**: 0.1.0
**Data**: 2025-12-28
**Status**: Produção

---

## 📋 Índice

1. [Visão Geral do Projeto](#-visão-geral-do-projeto)
2. [Funcionalidades de Autenticação e Segurança](#-funcionalidades-de-autenticação-e-segurança)
3. [Gestão Financeira Pessoal](#-gestão-financeira-pessoal)
4. [Investimentos e Trading](#-investimentos-e-trading)
5. [Inteligência Artificial](#-inteligência-artificial)
6. [Relatórios e Analytics](#-relatórios-e-analytics)
7. [Integrações Externas](#-integrações-externas)
8. [Compliance e Privacidade](#-compliance-e-privacidade)
9. [Plataformas e Interfaces](#-plataformas-e-interfaces)
10. [Infraestrutura e DevOps](#-infraestrutura-e-devops)
11. [Detalhamento Técnico](#-detalhamento-técnico)

---

## 🎯 Visão Geral do Projeto

### O que é o Fayol?

**Fayol** é uma plataforma completa de gestão financeira pessoal que combina **Inteligência Artificial** com uma arquitetura moderna de microsserviços. O sistema oferece controle total sobre finanças pessoais através de múltiplas plataformas: **Web**, **Mobile** (iOS/Android) e **Telegram Bot**.

### Objetivos Principais

- **Automatização Inteligente**: Categorização automática de transações usando Machine Learning
- **Insights Preditivos**: Previsão de gastos futuros e detecção de anomalias financeiras
- **Multiplataforma**: Acesso unificado via web, mobile e Telegram
- **Privacidade First**: Compliance total com LGPD/GDPR
- **Open Source**: Código aberto, extensível e auditável

### Para Quem é Este Sistema?

- **Pessoas físicas** que desejam ter controle total sobre suas finanças pessoais
- **Investidores** que querem acompanhar carteira de ações, FIIs e criptomoedas
- **Famílias** que precisam gerenciar orçamentos compartilhados
- **Desenvolvedores** que querem uma base sólida para personalização
- **Empresas** que desejam white-label para seus clientes

---

## 🔐 Funcionalidades de Autenticação e Segurança

### 1. Sistema de Autenticação Completo

#### Login e Registro
- **Registro de novos usuários** com validação de senha forte
- **Login tradicional** com email e senha
- **Verificação de força de senha** em tempo real
- **Sugestões automáticas** para senhas fracas
- **Rate limiting** (5 tentativas por minuto por IP)

#### Recuperação de Senha
- **Esqueci minha senha** via email
- **Tokens únicos** com expiração de 1 hora
- **Reset seguro** de senha com nova validação

#### Sessão e Cookies
- **JWT (JSON Web Tokens)** para autenticação
- **Cookies httpOnly** para segurança contra XSS
- **SameSite strict** para proteção CSRF
- **Expiração automática** após 24 horas

### 2. Two-Factor Authentication (2FA)

#### Setup e Configuração
- **Geração de QR Code** para Google Authenticator/Authy
- **Secret TOTP** criptografado no banco de dados
- **Códigos de backup** (10 códigos únicos por usuário)
- **Regeneração de códigos** de backup sob demanda

#### Fluxo de Login com 2FA
1. Usuário faz login com email e senha
2. Sistema retorna `requiresTwoFactor: true`
3. Usuário fornece código TOTP de 6 dígitos
4. Sistema valida e concede acesso

#### Recuperação de Emergência
- **Códigos de backup** de uso único
- **Desabilitação do 2FA** com senha mestre
- **Auditoria completa** de uso de códigos de backup

### 3. Controle de Acesso Baseado em Roles (RBAC)

#### Roles Disponíveis
| Role | Descrição | Permissões |
|------|-----------|-----------|
| **USER** | Usuário padrão | CRUD completo de suas próprias finanças |
| **ADMIN** | Administrador | Gestão de usuários + todas permissões de USER |
| **FINANCEIRO** | Analista financeiro | Relatórios avançados + visualização de dados agregados |
| **SUPORTE** | Suporte técnico | Visualização de logs + assistência a usuários |
| **SUPER_ADMIN** | Administrador master | Acesso total ao sistema + gestão de roles |
| **TEST** | Conta de teste | Ambiente sandbox para desenvolvimento |

#### Sistema de Permissões
- **Guards customizados** para proteger rotas
- **Decorators** para verificar roles específicos
- **Middleware** de autorização em todas as rotas protegidas

### 4. Auditoria e Rastreabilidade

#### Logs de Auditoria (AuditLog)
Toda ação crítica no sistema é registrada:

**Ações Rastreadas**:
- `CREATE` - Criação de recursos
- `UPDATE` - Atualização de recursos
- `DELETE` - Exclusão de recursos
- `RESTORE` - Restauração de soft delete
- `LOGIN` - Login bem-sucedido
- `LOGOUT` - Logout do sistema
- `ACCESS` - Acesso a recursos sensíveis

**Informações Capturadas**:
- **userId**: Identificador do usuário
- **action**: Tipo de ação executada
- **entity**: Entidade afetada (User, Transaction, etc.)
- **entityId**: ID do recurso afetado
- **changes**: Diff JSON do antes/depois
- **metadata**: Contexto adicional
- **ipAddress**: IP de origem da requisição
- **userAgent**: Navegador/device utilizado
- **createdAt**: Timestamp da ação

#### Soft Delete Universal
- **Todos os recursos** suportam soft delete
- **Coluna deletedAt** em todas as tabelas principais
- **Recuperação de dados** via endpoint de restore
- **Filtros automáticos** para excluir registros deletados

---

## 💼 Gestão Financeira Pessoal

### 1. Gestão de Contas Bancárias

#### Tipos de Conta Suportados
- **Conta Corrente** (CHECKING)
- **Poupança** (SAVINGS)
- **Investimentos** (INVESTMENT)
- **Dinheiro em Espécie** (CASH)
- **Cartão de Crédito** (CREDIT_CARD)
- **Outras** (OTHER)

#### Funcionalidades de Contas
- **Saldo em tempo real** com precisão de 2 casas decimais
- **Múltiplas moedas** (BRL, USD, EUR, etc.)
- **Limite de crédito** para cartões de crédito
- **Personalização visual** (cor e ícone customizáveis)
- **Arquivamento de contas** sem perder histórico
- **Conexão com Open Banking** (Pluggy, em desenvolvimento)
- **Reconciliação automática** de saldos

#### Endpoints Disponíveis
- `GET /accounts` - Lista todas as contas do usuário
- `POST /accounts` - Cria nova conta
- `GET /accounts/:id` - Detalhes de uma conta
- `PATCH /accounts/:id` - Atualiza conta
- `DELETE /accounts/:id` - Soft delete de conta
- `POST /accounts/:id/restore` - Restaura conta deletada
- `GET /accounts/:id/balance` - Saldo atual com histórico

### 2. Transações Financeiras

#### Tipos de Transação
- **Receita** (INCOME) - Salário, freelance, vendas, etc.
- **Despesa** (EXPENSE) - Compras, contas, impostos, etc.
- **Transferência** (TRANSFER) - Entre contas do usuário

#### Atributos das Transações
- **Valor** com precisão de 2 casas decimais
- **Data da transação** (pode ser diferente da data de criação)
- **Categoria** (personalizável)
- **Tags** (múltiplas tags por transação)
- **Notas/Observações** em texto livre
- **Anexos** (URL de comprovante, recibo, etc.)
- **Status de pagamento** (paga ou pendente)
- **Recorrência** (diária, semanal, mensal, anual, customizada)

#### Transações Recorrentes
- **Criação automática** de transações futuras
- **Edição em lote** de série de recorrências
- **ID de recorrência** para agrupar transações relacionadas
- **Cancelamento de recorrência** sem afetar transações passadas

#### Funcionalidades Avançadas
- **Filtros complexos** por data, categoria, valor, status
- **Busca full-text** em descrições e notas
- **Importação de extratos** (OFX, CSV - planejado)
- **Exportação de dados** (PDF, Excel, CSV)
- **Conciliação bancária** automática
- **Detecção de duplicatas**

#### Endpoints Disponíveis
- `GET /transactions` - Lista paginada com filtros avançados
- `POST /transactions` - Cria nova transação
- `GET /transactions/:id` - Detalhes completos
- `PATCH /transactions/:id` - Atualiza transação
- `DELETE /transactions/:id` - Soft delete
- `POST /transactions/bulk` - Criação em lote
- `GET /transactions/stats` - Estatísticas agregadas
- `GET /transactions/by-category` - Agrupamento por categoria
- `GET /transactions/by-month` - Agrupamento mensal

### 3. Categorias Personalizáveis

#### Categorias do Sistema
O Fayol vem com **categorias padrão** pré-configuradas:

**Receitas**:
- Salário
- Freelance
- Investimentos
- Vendas
- Outros

**Despesas**:
- Alimentação
- Transporte
- Moradia
- Saúde
- Educação
- Lazer
- Compras
- Assinaturas
- Impostos
- Outros

#### Categorias Personalizadas
- **Criação de categorias** customizadas pelo usuário
- **Subcategorias** (hierarquia pai-filho)
- **Ícones e cores** personalizáveis
- **Categorias compartilhadas** (sistema vs. pessoais)
- **Tipos segregados** (receita vs. despesa)

#### Funcionalidades
- **Gestão de hierarquia** de categorias
- **Migração de categoria** (mover transações)
- **Estatísticas por categoria**
- **Orçamentos por categoria**

### 4. Orçamentos Inteligentes

#### Criação de Orçamentos
- **Orçamentos por categoria** ou globais
- **Período customizável** (início e fim)
- **Valor limite** definido pelo usuário
- **Threshold de alerta** (ex: avisar ao atingir 80%)

#### Monitoramento
- **Cálculo em tempo real** do gasto atual
- **Porcentagem consumida** do orçamento
- **Projeção de fim de período** (se vai estourar)
- **Comparação com período anterior**

#### Alertas e Notificações
- **Alerta de threshold** ao atingir limite configurado
- **Notificação de estouro** quando ultrapassar orçamento
- **Relatório semanal/mensal** de orçamentos

#### Endpoints Disponíveis
- `GET /budgets` - Lista todos os orçamentos
- `POST /budgets` - Cria novo orçamento
- `GET /budgets/:id` - Detalhes com status atual
- `PATCH /budgets/:id` - Atualiza orçamento
- `DELETE /budgets/:id` - Remove orçamento
- `GET /budgets/:id/progress` - Progresso em tempo real

### 5. Metas Financeiras

#### Tipos de Metas
- **Economia para viagem**
- **Reserva de emergência**
- **Compra de bem** (carro, casa, etc.)
- **Quitação de dívida**
- **Metas customizadas**

#### Atributos das Metas
- **Título** descritivo
- **Valor atual** acumulado
- **Valor alvo** a ser atingido
- **Prazo** (deadline opcional)
- **Cor personalizada** para identificação visual
- **Progresso automático** calculado em %

#### Funcionalidades
- **Acompanhamento visual** com progress bar
- **Depósitos manuais** para incrementar meta
- **Conexão com transações** (auto-incremento)
- **Notificações de milestone** (25%, 50%, 75%, 100%)
- **Histórico de contribuições**

#### Endpoints Disponíveis
- `GET /goals` - Lista todas as metas
- `POST /goals` - Cria nova meta
- `GET /goals/:id` - Detalhes da meta
- `PATCH /goals/:id` - Atualiza meta
- `POST /goals/:id/contribute` - Adiciona valor à meta
- `DELETE /goals/:id` - Remove meta

---

## 📈 Investimentos e Trading

### 1. Carteira de Investimentos

#### Tipos de Ativos Suportados
- **Ações** (STOCK) - Bolsa brasileira e internacional
- **FIIs** - Fundos Imobiliários
- **Criptomoedas** (CRYPTO) - Bitcoin, Ethereum, etc.
- **Renda Fixa** (FIXED_INCOME) - CDB, LCI, LCA, Tesouro
- **ETFs** - Fundos de índice
- **Outros** (OTHER)

#### Atributos dos Investimentos
- **Ticker/Símbolo** (ex: PETR4, AAPL, BTC)
- **Quantidade** com precisão de 8 casas decimais
- **Preço médio** de compra
- **Preço atual** (atualizado via API)
- **Data de compra**
- **Conta vinculada** (INVESTMENT account)

#### Funcionalidades
- **Cálculo automático** de lucro/prejuízo (P&L)
- **Rentabilidade** em % e R$
- **Alocação de carteira** (diversificação)
- **Histórico de cotações** (daily, intraday)
- **Alertas de preço** (stop-loss, take-profit)

#### Endpoints Disponíveis
- `GET /investments` - Lista carteira completa
- `POST /investments` - Adiciona novo ativo
- `GET /investments/:id` - Detalhes do investimento
- `PATCH /investments/:id` - Atualiza informações
- `DELETE /investments/:id` - Remove ativo
- `GET /investments/:id/performance` - Rentabilidade detalhada
- `GET /investments/portfolio` - Visão consolidada da carteira

### 2. Trading e Operações

#### Registro de Trades
Todas as compras e vendas são registradas no modelo `Trade`:

**Atributos**:
- **Ticker** do ativo
- **Tipo** (BUY ou SELL)
- **Quantidade** negociada
- **Preço** de execução
- **Taxas e corretagem**
- **Valor total** da operação
- **Data de execução**
- **Conexão com transação** (débito/crédito na conta)

#### Cálculo Automático
- **Preço médio** atualizado após cada compra
- **Posição líquida** (quantidade total após buy/sell)
- **Realização de lucro/prejuízo** em vendas parciais
- **FIFO** (First In, First Out) para cálculo de IR

#### Funcionalidades
- **Histórico completo** de trades
- **Relatório de operações** para IR (Imposto de Renda)
- **Análise de performance** por ativo
- **Estatísticas** (win rate, average gain, drawdown)

#### Endpoints Disponíveis
- `GET /trading/history` - Histórico de trades
- `POST /trading/buy` - Registra compra
- `POST /trading/sell` - Registra venda
- `GET /trading/stats` - Estatísticas de trading
- `GET /trading/tax-report` - Relatório para IR

### 3. Perfil de Investidor

#### Classificação
- **Conservador** (CONSERVATIVE) - Baixo risco, renda fixa
- **Moderado** (MODERATE) - Risco médio, misto
- **Agressivo** (AGGRESSIVE) - Alto risco, renda variável
- **Indefinido** (UNDEFINED) - Ainda não definiu

#### Funcionalidades
- **Questionário de suitability** (em desenvolvimento)
- **Recomendações personalizadas** baseadas no perfil
- **Alertas de risco** para investimentos incompatíveis
- **Rebalanceamento de carteira** sugerido

---

## 🧠 Inteligência Artificial

### 1. Categorização Automática de Transações

#### Como Funciona
O Fayol utiliza **Naive Bayes Classifier** para categorizar transações automaticamente:

1. **Análise de descrição** da transação
2. **Tokenização** de palavras-chave
3. **Comparação** com histórico do usuário
4. **Previsão** da categoria mais provável
5. **Sugestão** ao usuário (não aplica automaticamente)

#### Aprendizado Contínuo
- **Feedback do usuário** melhora o modelo
- **Treinamento incremental** com novos dados
- **Modelo personalizado** por usuário
- **Fallback** para categorias padrão

#### Endpoint
- `POST /ai/predict-category` - Sugere categoria para uma descrição

### 2. Detecção de Anomalias

#### Algoritmos Utilizados
- **Isolation Forest** para detecção de outliers
- **Z-Score** para identificar gastos fora do padrão
- **Time Series Analysis** para detectar mudanças bruscas

#### Alertas Gerados
- **Gasto incomum** em categoria específica
- **Transação duplicada** (possível erro)
- **Aumento súbito** de despesas
- **Padrão de fraude** potencial

### 3. Forecasting de Despesas

#### Previsão de Gastos Futuros
- **Análise de histórico** de 6-12 meses
- **Identificação de padrões** sazonais
- **Previsão para próximo mês** com intervalo de confiança
- **Alertas de possível déficit**

#### Modelos Utilizados
- **ARIMA** (AutoRegressive Integrated Moving Average)
- **Prophet** (Facebook) para séries temporais
- **Regressão Linear** para tendências

### 4. Insights Estatísticos Personalizados

#### Análises Disponíveis
- **Média de gastos** por categoria
- **Comparação** com usuários similares (anonimizado)
- **Tendências** (gastando mais ou menos?)
- **Oportunidades de economia** identificadas
- **Recomendações** de orçamento

#### Serviço Python AI

O Fayol possui um **microserviço dedicado em Python** (FastAPI) para IA:

**Localização**: `libs/python-ai/`
**Porta**: 8000
**Stack**: FastAPI, Scikit-learn, Pandas, NumPy

**Endpoints do AI Service**:
- `POST /predict/category` - Categorização de transação
- `POST /detect/anomalies` - Detecção de anomalias
- `POST /forecast/expenses` - Previsão de gastos
- `GET /insights/user/:userId` - Insights personalizados
- `POST /train/model` - Retreinamento de modelo

---

## 📊 Relatórios e Analytics

### 1. Dashboards Interativos

#### Visão Geral (Overview)
- **Saldo total** consolidado de todas as contas
- **Receitas vs. Despesas** do mês
- **Principais categorias** de gasto
- **Transações recentes**
- **Orçamentos ativos** com progresso
- **Metas financeiras** em andamento

#### Visualizações com Recharts
- **Gráfico de barras** - Receitas e despesas mensais
- **Gráfico de pizza** - Distribuição por categoria
- **Gráfico de linha** - Evolução do saldo
- **Gráfico de área** - Fluxo de caixa acumulado
- **Heatmap** - Gastos por dia/hora

### 2. Exportação de Relatórios

#### Formatos Disponíveis
- **PDF** - Relatório visual formatado
- **Excel (XLSX)** - Planilha com dados brutos
- **CSV** - Formato universal para importação

#### Tipos de Relatório
- **Extrato de Transações** - Período customizável
- **Relatório de Orçamentos** - Performance vs. planejado
- **Relatório de Investimentos** - Rentabilidade de carteira
- **Demonstrativo de Resultado** (DRE) - Receitas - Despesas
- **Fluxo de Caixa** - Entradas e saídas detalhadas

#### Serviço BI Reports

**Localização**: `libs/bi-reports/`
**Porta**: 8001
**Stack**: Python, FastAPI, Pandas, Openpyxl, ReportLab

**Endpoints do BI Service**:
- `POST /reports/transactions/pdf` - Gera PDF de transações
- `POST /reports/transactions/excel` - Gera Excel de transações
- `POST /reports/budget/pdf` - Relatório de orçamentos em PDF
- `POST /reports/investments/pdf` - Relatório de investimentos
- `POST /reports/dre/pdf` - DRE em PDF
- `GET /reports/:id/download` - Download de relatório gerado

### 3. Análise de Tendências

#### Comparativos
- **Mês atual vs. mês anterior**
- **Ano atual vs. ano anterior**
- **Projeção para fim do mês/ano**
- **Média móvel** de 3/6/12 meses

#### Indicadores Financeiros
- **Taxa de poupança** (% de receita economizada)
- **Índice de liquidez** (ativos líquidos / despesas mensais)
- **Burn rate** (velocidade de queima de reservas)
- **Patrimônio líquido** total

---

## 🌐 Integrações Externas

### 1. Open Banking

#### Pluggy Integration
**Status**: Em desenvolvimento
**Funcionalidades planejadas**:
- **Conexão** com mais de 300 instituições financeiras
- **Sincronização automática** de saldos e transações
- **Importação de extratos** em tempo real
- **Reconciliação** automática com dados do Fayol

**Endpoints**:
- `POST /integrations/pluggy/connect` - Inicia conexão
- `GET /integrations/pluggy/accounts` - Lista contas conectadas
- `POST /integrations/pluggy/sync` - Sincroniza dados
- `DELETE /integrations/pluggy/:id` - Desconecta conta

### 2. Pagamentos

#### Stripe Integration
**Status**: Implementado
**Funcionalidades**:
- **Processamento de pagamentos** de assinaturas
- **Webhooks** para eventos de cobrança
- **Gestão de planos** (Free, Pro, Premium)
- **Faturamento recorrente** automático

**Endpoints**:
- `POST /integrations/stripe/create-checkout` - Cria sessão de pagamento
- `POST /integrations/stripe/webhook` - Recebe eventos do Stripe
- `GET /integrations/stripe/subscription` - Status da assinatura

### 3. Market Data

#### Alpha Vantage API
**Status**: Implementado
**Funcionalidades**:
- **Cotações em tempo real** de ações
- **Histórico de preços** (daily, intraday)
- **Dados fundamentalistas** (em desenvolvimento)
- **Indicadores técnicos** (RSI, MACD, Bollinger Bands)

**Endpoints**:
- `GET /integrations/market-data/stock/quote?symbol=AAPL`
- `GET /integrations/market-data/stock/daily?symbol=PETR4`
- `GET /integrations/market-data/stock/intraday?symbol=BTCUSD`
- `GET /integrations/market-data/crypto/quote?symbol=BTC`

#### Yahoo Finance (Fallback)
**Status**: Implementado
**Funcionalidades**:
- **Cotações gratuitas** de ações e FIIs
- **Dados históricos** sem limite de chamadas
- **Criptomoedas** suportadas

### 4. Notificações

#### Email (Resend)
**Status**: Implementado
**Funcionalidades**:
- **Emails transacionais** (boas-vindas, reset de senha)
- **Alertas de orçamento** por email
- **Relatórios semanais/mensais** enviados
- **Templates customizáveis**

#### Push Notifications
**Status**: Planejado (Mobile)
**Funcionalidades planejadas**:
- **Notificações push** no app mobile
- **Alertas em tempo real** de transações
- **Lembretes** de vencimentos

#### Telegram Bot
**Status**: Implementado
**Funcionalidades**:
- **Consulta de saldo** via comando
- **Registro de transações** por mensagem
- **Detecção automática** de gastos em mensagens
- **Relatórios rápidos** via bot

---

## 🔒 Compliance e Privacidade

### 1. LGPD / GDPR Compliance

#### Gestão de Consentimentos

**Modelo UserConsent**:
- **Tipos de consentimento** rastreados:
  - `TERMS_OF_SERVICE` - Termos de serviço
  - `PRIVACY_POLICY` - Política de privacidade
  - `MARKETING` - Comunicações de marketing
  - `ANALYTICS` - Coleta de dados analíticos
  - `COOKIES` - Uso de cookies
  - `DATA_SHARING` - Compartilhamento com terceiros
  - `PROFILING` - Análise de perfil

**Estados de consentimento**:
- `GRANTED` - Concedido
- `DENIED` - Negado
- `WITHDRAWN` - Retirado
- `EXPIRED` - Expirado

**Atributos rastreados**:
- **Versão** do termo aceito
- **IP de origem** do aceite
- **User-Agent** utilizado
- **Data de concessão**
- **Data de expiração** (se aplicável)
- **Data de retirada** (se aplicável)

#### Funcionalidades
- **Histórico completo** de consentimentos
- **Renovação automática** quando termos mudam
- **Retirada de consentimento** a qualquer momento
- **Auditoria LGPD** completa

**Endpoints**:
- `GET /consent` - Lista consentimentos do usuário
- `POST /consent` - Registra novo consentimento
- `PATCH /consent/:id/withdraw` - Retira consentimento
- `GET /consent/history` - Histórico de mudanças

### 2. Portabilidade de Dados (Data Export)

#### Solicitação de Exportação

**Modelo DataExportRequest**:
- **Status**: PENDING → PROCESSING → COMPLETED/FAILED
- **Formatos suportados**: JSON, CSV, Excel, PDF
- **URL de download** gerada automaticamente
- **Expiração** do link após 7 dias
- **Rastreamento** completo de solicitações

**Dados incluídos na exportação**:
- Perfil completo do usuário
- Todas as contas bancárias
- Todas as transações
- Categorias personalizadas
- Orçamentos
- Metas financeiras
- Investimentos e trades
- Notificações
- Histórico de consentimentos
- Logs de auditoria

**Endpoints**:
- `POST /data-export/request` - Solicita exportação
- `GET /data-export/status/:id` - Status da solicitação
- `GET /data-export/download/:id` - Download do arquivo

### 3. Direito ao Esquecimento

#### Exclusão Permanente
- **Soft delete** padrão para todos os recursos
- **Hard delete** disponível sob solicitação
- **Anonimização** de dados em relatórios agregados
- **Remoção de backups** após período de retenção

**Endpoints**:
- `POST /users/delete-account` - Solicita exclusão total
- `POST /users/:id/anonymize` - Anonimiza dados históricos

### 4. Privacy Center

#### Painel de Privacidade
**Funcionalidades**:
- **Visualização de dados** coletados sobre o usuário
- **Gestão de consentimentos** em um único lugar
- **Solicitação de exportação** de dados
- **Solicitação de exclusão** de conta
- **Histórico de acessos** aos dados
- **Configurações de privacidade** granulares

**Localização**: `apps/web-app/src/app/privacy-center`

---

## 🖥️ Plataformas e Interfaces

### 1. Frontend Web (Next.js)

#### Stack Tecnológico
- **Framework**: Next.js 16 (Turbopack)
- **UI Library**: React 18
- **Styling**: TailwindCSS 3
- **Components**: Shadcn/UI (Radix UI)
- **Forms**: React Hook Form + Zod
- **Data Fetching**: TanStack Query (React Query)
- **Charts**: Recharts

#### Páginas Disponíveis

**Públicas**:
- `/` - Landing page
- `/features` - Demonstração de features
- `/pricing` - Planos e preços
- `/contact` - Formulário de contato
- `/status` - Status dos serviços
- `/legal/terms` - Termos de serviço
- `/legal/privacy` - Política de privacidade
- `/legal/lgpd` - Informações sobre LGPD

**Autenticação**:
- `/auth/login` - Login
- `/auth/register` - Cadastro
- `/auth/forgot-password` - Recuperação de senha
- `/auth/reset-password` - Reset de senha
- `/onboarding` - Fluxo de onboarding

**Dashboard** (protegido):
- `/dashboard` - Visão geral
- `/dashboard/transactions` - Gestão de transações
- `/dashboard/accounts` - Gestão de contas
- `/dashboard/budgets` - Orçamentos
- `/dashboard/goals` - Metas financeiras
- `/dashboard/investments` - Carteira de investimentos
- `/dashboard/reports` - Relatórios
- `/dashboard/insights` - Insights de IA
- `/dashboard/settings` - Configurações

**Admin** (apenas ADMIN role):
- `/admin` - Painel administrativo
- `/admin/users` - Gestão de usuários
- `/admin/audit-logs` - Logs de auditoria

**Privacy**:
- `/privacy-center` - Central de privacidade
- `/privacy-center/consents` - Gestão de consentimentos
- `/privacy-center/data-export` - Exportação de dados
- `/privacy-center/delete-account` - Exclusão de conta

#### Funcionalidades Especiais
- **Dark Mode** (planejado)
- **Responsive Design** (mobile-first)
- **PWA** (Progressive Web App) - instalável
- **Offline Mode** (planejado)
- **Real-time Updates** via WebSockets

### 2. Mobile App (React Native + Expo)

#### Stack Tecnológico
- **Framework**: React Native
- **Platform**: Expo 54
- **Navigation**: React Navigation 7
- **State**: TanStack Query
- **Forms**: React Hook Form
- **UI**: React Native Paper + custom components

#### Funcionalidades
- **Login biométrico** (Face ID, Touch ID)
- **Registro rápido** de transações
- **Consulta de saldo** em tempo real
- **Notificações push** (planejado)
- **Modo offline** (planejado)
- **Câmera** para digitalizar recibos (planejado)

#### Telas Principais
- Splash & Onboarding
- Login / Registro
- Dashboard
- Transações (lista e detalhes)
- Contas bancárias
- Orçamentos
- Metas
- Investimentos
- Configurações
- Perfil

#### Suporte de Plataformas
- **iOS** (App Store)
- **Android** (Google Play)
- **Web** (via Expo)

### 3. Telegram Bot

#### Stack Tecnológico
- **Library**: Telegraf 4.15
- **Runtime**: Node.js 20
- **Comunicação**: API HTTP com backend

#### Funcionalidades

**Autenticação**:
- `/start` - Inicia conversa
- `/login` - Login com email e senha
- `/logout` - Desconecta conta
- `/register` - Cadastro pelo bot

**Consultas**:
- `/saldo` - Consulta saldo de todas as contas
- `/extrato` - Últimas transações
- `/orcamentos` - Status de orçamentos
- `/metas` - Progresso de metas

**Registro de Transações**:
- **Detecção automática** em mensagens livres
  - Exemplo: "Gastei R$ 50 no mercado" → Detecta e sugere categorizar
- `/despesa` - Registra despesa manual
- `/receita` - Registra receita manual
- `/transferencia` - Registra transferência

**Relatórios Rápidos**:
- `/resumo` - Resumo financeiro do mês
- `/categorias` - Gastos por categoria
- `/relatorio` - Gera PDF e envia por Telegram

**Configurações**:
- `/contas` - Lista contas cadastradas
- `/categorias` - Lista categorias
- `/notificacoes` - Configura alertas

#### Scenes (Fluxos Conversacionais)
- **LoginScene** - Fluxo de autenticação guiado
- **OnboardingScene** - Configuração inicial pelo bot
- **TransactionScene** - Registro assistido de transação
- **ReportScene** - Geração de relatórios customizados

**Localização**: `apps/telegram-bot/`

---

## 🏗️ Infraestrutura e DevOps

### 1. Arquitetura de Microsserviços

#### Backend API (NestJS)
- **Porta**: 3333
- **Framework**: NestJS 11
- **ORM**: Prisma 7
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Queue**: BullMQ
- **WebSockets**: Socket.io
- **API Docs**: Swagger (OpenAPI 3.0)

#### AI Service (Python)
- **Porta**: 8000
- **Framework**: FastAPI
- **ML Library**: Scikit-learn
- **Data**: Pandas, NumPy

#### BI Reports Service (Python)
- **Porta**: 8001
- **Framework**: FastAPI
- **Excel**: Openpyxl
- **PDF**: ReportLab

### 2. Banco de Dados

#### PostgreSQL 15
**Modelos implementados**:
- User (usuários)
- Account (contas bancárias)
- Category (categorias)
- Transaction (transações)
- Budget (orçamentos)
- Investment (investimentos)
- Trade (operações de trading)
- Goal (metas financeiras)
- Notification (notificações)
- AuditLog (auditoria)
- UserConsent (consentimentos)
- DataExportRequest (solicitações de exportação)

**Otimizações**:
- Índices compostos estratégicos
- Soft delete universal
- Triggers para cálculos
- Particionamento (planejado)

#### Redis
**Uso**:
- Cache de sessões JWT
- Cache de cotações de mercado
- Rate limiting
- Queue de jobs (BullMQ)
- Pub/Sub para WebSockets

### 3. Observabilidade

#### Logging
- **Winston** para logs estruturados
- **Níveis**: error, warn, info, debug
- **Formato**: JSON para parsing

#### Monitoring
- **Sentry** para error tracking
- **OpenTelemetry** para traces
- **Prometheus** para métricas (planejado)
- **Health checks** em `/health`

#### Metrics
- **Endpoint**: `/metrics` (Prometheus format)
- **Métricas coletadas**:
  - Request count
  - Response time
  - Error rate
  - Database queries
  - Cache hit/miss

### 4. CI/CD

#### GitHub Actions
**Workflows implementados**:
- **Test**: Roda testes em PRs
- **Lint**: ESLint + Prettier
- **Type Check**: TypeScript validation
- **Build**: Valida builds de produção
- **Deploy**: Deploy automático (planejado)

### 5. Docker

#### Containers
- **PostgreSQL**: Banco de dados principal
- **Redis**: Cache e queue
- **PGAdmin**: Interface de gerenciamento DB
- **Backend API**: API NestJS (planejado)
- **Python AI**: Serviço de IA (planejado)
- **Python BI**: Serviço de relatórios (planejado)

**Arquivo**: `docker-compose.yml`

#### Scripts Docker
- `pnpm docker:start` - Inicia containers
- `pnpm docker:stop` - Para containers
- `pnpm docker:clean` - Remove volumes
- `pnpm docker:logs` - Visualiza logs

---

## 🔧 Detalhamento Técnico

### 1. Monorepo com TurboRepo

#### Estrutura
```
fayol/
├── apps/
│   ├── backend/           # NestJS API
│   ├── web-app/           # Next.js Web
│   ├── mobile/            # React Native Expo
│   └── telegram-bot/      # Telegraf Bot
├── libs/
│   ├── python-ai/         # AI Service
│   └── bi-reports/        # BI Service
├── packages/
│   ├── database-models/   # Prisma Client
│   ├── shared-types/      # TypeScript types
│   ├── shared-utils/      # Utilities
│   ├── shared-constants/  # Constants
│   ├── validation-schemas/# Zod schemas
│   ├── ui-components/     # Design System
│   ├── api-client/        # HTTP Client (Web)
│   ├── integrations/      # Third-party integrations
│   ├── ai-services/       # AI Integration Client
│   └── assets/            # Shared assets
└── configs/
    ├── eslint/            # ESLint shared config
    ├── typescript/        # TSConfig shared
    └── tailwind/          # Tailwind shared config
```

#### Vantagens
- **Code sharing** entre apps
- **Build caching** inteligente
- **Dependency management** centralizado
- **Type safety** entre packages
- **Atomic commits** para features

### 2. Type Safety End-to-End

#### Shared Types
Todos os tipos são compartilhados via `@fayol/shared-types`:

```typescript
// DTOs, Enums, Interfaces compartilhados
export { UserRole, AccountType, LaunchType, ... }
export type { CreateTransactionDto, UpdateUserDto, ... }
```

#### Validation com Zod
Schemas de validação compartilhados em `@fayol/validation-schemas`:

```typescript
export const createTransactionSchema = z.object({
  accountId: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().min(3),
  ...
});
```

### 3. Design System

#### Shadcn/UI Customizado
**Localização**: `packages/ui-components/`

**Componentes disponíveis**:
- Button, Card, Input, Select
- Dialog, Modal, Toast
- Table, DataTable
- Form, FormField
- Charts (Recharts wrappers)
- Loading states, Skeletons

**Temas**:
- Light mode (padrão)
- Dark mode (em desenvolvimento)
- Customização via CSS variables

### 4. Testes

#### Backend (NestJS)
- **Framework**: Jest 30
- **Coverage**: 550 testes passando
- **Tipos**: Unit, Integration, E2E

#### Frontend (Next.js)
- **Framework**: Jest + Testing Library
- **E2E**: Playwright

#### Comandos
- `pnpm test` - Todos os testes
- `pnpm test:coverage` - Com cobertura
- `pnpm test:e2e` - End-to-end

### 5. Segurança

#### Proteções Implementadas
- **Rate Limiting** - Proteção contra brute force
- **CORS** - Configurado para origens permitidas
- **Helmet** - Security headers
- **CSRF** - Tokens anti-CSRF
- **XSS** - Sanitização de inputs
- **SQL Injection** - Prisma ORM (prepared statements)
- **Secrets Management** - Env variables criptografadas

#### Autenticação
- **JWT** com RS256 (chaves assimétricas)
- **Refresh Tokens** (planejado)
- **Session Management** via Redis
- **2FA** com TOTP

---

## 📊 Estatísticas do Projeto

### Código
- **Linhas de código**: ~50.000+
- **Arquivos TypeScript**: 300+
- **Componentes React**: 100+
- **Endpoints API**: 80+
- **Modelos Prisma**: 12
- **Testes**: 550+

### Performance
- **Build Backend**: 41.7s
- **Build Frontend**: 2m26s
- **Tempo de resposta API**: <100ms (média)
- **Uptime**: 99.9% (alvo)

### Tecnologias
- **Linguagens**: TypeScript, Python, SQL
- **Frameworks**: NestJS, Next.js, React Native, FastAPI
- **Banco de Dados**: PostgreSQL, Redis
- **Cloud**: Oracle Cloud, Vercel, Railway (opções)

---

## 🚀 Como Usar o Sistema

### Para Usuários Finais

1. **Acesse** a plataforma web ou baixe o app mobile
2. **Cadastre-se** com email e senha forte
3. **Complete o onboarding**:
   - Defina sua moeda principal (BRL, USD, etc.)
   - Selecione seu perfil de investidor
   - Configure suas contas bancárias iniciais
4. **Registre transações**:
   - Manualmente pelo dashboard
   - Via upload de extrato (futuro)
   - Por mensagem no Telegram Bot
5. **Configure orçamentos** por categoria
6. **Defina metas** financeiras
7. **Acompanhe investimentos**
8. **Visualize insights** gerados por IA
9. **Exporte relatórios** em PDF/Excel

### Para Desenvolvedores

1. **Clone** o repositório
2. **Instale** dependências: `pnpm install`
3. **Configure** `.env` com suas variáveis
4. **Inicie** infraestrutura: `pnpm docker:start`
5. **Execute migrations**: `pnpm prisma migrate dev`
6. **Inicie** serviços: `pnpm dev`
7. **Acesse**:
   - Web: http://localhost:3000
   - API: http://localhost:3333
   - Swagger: http://localhost:3333/api/docs

---

## 📄 Conclusão

O **Fayol** é uma plataforma completa e moderna de gestão financeira pessoal que combina:

- ✅ **Gestão financeira** tradicional (contas, transações, orçamentos)
- ✅ **Investimentos** (ações, FIIs, crypto, renda fixa)
- ✅ **Inteligência Artificial** (categorização, forecasting, anomalias)
- ✅ **Múltiplas plataformas** (Web, Mobile, Telegram)
- ✅ **Compliance LGPD/GDPR** (consentimentos, portabilidade)
- ✅ **Segurança robusta** (2FA, auditoria, criptografia)
- ✅ **Arquitetura moderna** (microsserviços, monorepo, CI/CD)
- ✅ **Open Source** (código aberto, extensível)

**Ideal para**:
- Pessoas físicas que querem controle total de suas finanças
- Investidores que precisam acompanhar rentabilidade
- Desenvolvedores que querem um projeto sólido para aprender/contribuir
- Empresas que buscam white-label para clientes

---

**Desenvolvido com 💙 por Deivid Lucas**
**Licença**: MIT
**Versão**: 0.1.0
**Status**: Produção (MVP concluído, features avançadas em andamento)
