# 🤖 Fayol WhatsApp Bot

Assistente financeiro pessoal inteligente via WhatsApp, com detecção automática de transações e integração com IA.

## 📋 Índice

- [Sobre](#sobre)
- [Características](#características)
- [Arquitetura](#arquitetura)
- [Setup Local](#setup-local)
- [Docker](#docker)
- [Comandos Disponíveis](#comandos-disponíveis)
- [Uso](#uso)
- [Troubleshooting](#troubleshooting)
- [Testes](#testes)
- [Roadmap](#roadmap)

## 🎯 Sobre

O Fayol WhatsApp Bot permite que usuários gerenciem suas finanças pessoais diretamente pelo WhatsApp, com recursos como:

- ✨ **Detecção Inteligente**: Reconhece automaticamente se uma mensagem é receita ou despesa
- 💬 **Lançamento Rápido**: "Almoço 35" → registra automaticamente como despesa
- 📊 **Consultas**: Saldo, extrato, gastos por categoria, insights de IA
- 📄 **Relatórios**: PDF e Excel gerados em segundos
- 🔒 **Segurança**: Autenticação JWT e sessões criptografadas

## ✨ Características

### Implementado

- ✅ Autenticação via e-mail/celular + senha
- ✅ Onboarding completo (nome, conta, perfil)
- ✅ Lançamento rápido de transações com detecção automática
- ✅ Comandos financeiros: `/saldo`, `/extrato`, `/categorias`, `/insights`
- ✅ Geração de relatórios PDF e Excel
- ✅ Suporte a grupos (limitado)
- ✅ Rate limiting anti-spam (30 msgs/min)
- ✅ Sessões persistentes (QR Code único)
- ✅ Reconexão automática

### Em Desenvolvimento

- 🚧 OCR para comprovantes (imagens)
- 🚧 Speech-to-Text (áudios)
- 🚧 Migração para API Oficial Meta (quando estável)
- 🚧 Sessões em Redis (produção)

## 🏗️ Arquitetura

```
apps/whatsapp-bot/
├── src/
│   ├── main.ts                      # Entry point
│   ├── providers/
│   │   ├── IWhatsAppProvider.ts     # Interface abstrata (Strategy Pattern)
│   │   └── BaileysProvider.ts       # Implementação Baileys v6.7.9
│   ├── services/
│   │   ├── whatsapp.service.ts      # Orquestração principal
│   │   ├── session.service.ts       # Gerenciamento de sessões
│   │   └── bot-api.service.ts       # Cliente HTTP para backend
│   ├── handlers/
│   │   ├── command.handler.ts       # Comandos /saldo, /extrato, etc
│   │   ├── message.handler.ts       # Lançamento rápido + scenes
│   │   ├── media.handler.ts         # Imagens, áudio (placeholder)
│   │   └── group.handler.ts         # Suporte a grupos
│   ├── scenes/
│   │   ├── login.scene.ts           # Wizard de login
│   │   └── onboarding.scene.ts      # Wizard de configuração inicial
│   ├── utils/
│   │   └── transaction-detector.ts  # Detecção inteligente de tipo
│   └── middlewares/
│       └── rate-limit.middleware.ts # Anti-spam
└── tests/                           # Testes unitários e integração
```

### Design Patterns

- **Strategy Pattern**: `IWhatsAppProvider` permite trocar entre Baileys e Meta API sem alterar lógica
- **Dependency Injection**: Handlers recebem provider e sessionService via construtor
- **Wizard Pattern**: Scenes gerenciam fluxos multi-step (login, onboarding)
- **Repository Pattern**: `BotApiService` abstrai comunicação com backend

## 🚀 Setup Local

### Pré-requisitos

- Node.js 20+
- PNPM 9+
- Backend Fayol rodando (`apps/backend`)

### Instalação

1. **Clone o repositório (se ainda não fez):**
   ```bash
   git clone <repo-url>
   cd Fayol
   ```

2. **Instale dependências do monorepo:**
   ```bash
   pnpm install
   ```

3. **Configure variáveis de ambiente:**

   Copie o `.env.example` na raiz do monorepo:
   ```bash
   cp apps/whatsapp-bot/.env.example .env
   ```

   Edite `.env` e configure:
   ```bash
   # Backend API
   API_BASE_URL=http://localhost:3333/api

   # WhatsApp Bot
   WHATSAPP_PROVIDER=baileys
   WHATSAPP_SESSION_DIR=./auth_info_baileys
   WHATSAPP_BOT_NAME="Fayol Bot"
   WHATSAPP_LOG_LEVEL=info

   # Rate Limiting
   RATE_LIMIT_MESSAGES_PER_MINUTE=30

   # Grupos
   ENABLE_GROUP_SUPPORT=true
   GROUP_ADMIN_ONLY=false

   # Mídia
   MAX_MEDIA_SIZE_MB=16
   ```

4. **Inicie o bot em modo desenvolvimento:**
   ```bash
   pnpm --filter whatsapp-bot dev
   ```

5. **Escaneie o QR Code:**

   Na primeira execução, um QR Code será exibido no terminal. Abra o WhatsApp no seu celular e escaneie:

   - **WhatsApp** → **Dispositivos Conectados** → **Conectar Dispositivo**
   - Aponte a câmera para o QR Code no terminal
   - Aguarde a mensagem "✅ WhatsApp Bot conectado com sucesso!"

6. **Teste o bot:**

   Envie uma mensagem para o número do bot:
   ```
   /start
   ```

## 🐳 Docker

### Build

```bash
# Da raiz do monorepo
docker build -f apps/whatsapp-bot/Dockerfile -t fayol-whatsapp-bot .
```

### Run

```bash
docker run -d \
  --name fayol-whatsapp-bot \
  -v $(pwd)/auth_info_baileys:/app/auth_info_baileys \
  -e API_BASE_URL=http://host.docker.internal:3333/api \
  fayol-whatsapp-bot
```

**Importante**: Use `host.docker.internal` (macOS/Windows) ou `172.17.0.1` (Linux) para acessar o backend local.

### Ver logs

```bash
docker logs -f fayol-whatsapp-bot
```

### Parar

```bash
docker stop fayol-whatsapp-bot
docker rm fayol-whatsapp-bot
```

## 📱 Comandos Disponíveis

### Públicos (sem login)

| Comando | Descrição |
|---------|-----------|
| `/start` | Inicia o bot e faz login |
| `/help` ou `/ajuda` | Mostra ajuda completa |
| `/exemplos` | Exemplos práticos de uso |
| `/dicas` | Dicas para usar melhor o bot |

### Privados (requer login)

| Comando | Descrição |
|---------|-----------|
| `/saldo` | Saldo atual e resumo mensal |
| `/extrato` | Últimas 5 transações |
| `/categorias` | Gastos por categoria (top 5) |
| `/insights` | Análise inteligente com IA |
| `/relatorio` | Gerar PDF do mês |
| `/excel` | Exportar planilha Excel |
| `/receita` | Instruções para adicionar receita |
| `/despesa` | Instruções para adicionar despesa |
| `/logout` | Sair da conta |

### Lançamento Rápido

Não precisa de comando! Apenas digite a descrição e valor:

**Exemplos de Receitas (detectadas automaticamente):**
- `Salário 5000`
- `Freelance 1500`
- `Venda notebook 2800`
- `Dividendos 250.50`

**Exemplos de Despesas (detectadas automaticamente):**
- `Almoço 45`
- `Uber 28.50`
- `Mercado 235.90`
- `Netflix 39.90`
- `Gasolina 180`

**Forçar tipo com prefixo:**
- `+ Estorno 89.90` → Receita
- `- Pagamento 450` → Despesa

## 💡 Uso

### 1. Primeiro Acesso

1. Envie `/start` para o bot
2. Digite seu e-mail ou celular cadastrado
3. Digite sua senha
4. Complete o onboarding:
   - Nome
   - Nome da conta principal
   - Saldo inicial
   - Perfil de investidor (1-3)

### 2. Lançamento Rápido

Simplesmente digite:
```
Almoço 35.50
```

O bot detecta automaticamente que é uma despesa e salva.

### 3. Consultas

```
/saldo
💰 Saldo Atual: R$ 2.450,00

📅 Resumo do Mês:
📈 Receitas: R$ 5.000,00
💸 Despesas: R$ 2.550,00
───────────────
🟢 Resultado: R$ 2.450,00
```

### 4. Relatórios

```
/relatorio
```

Recebe PDF com:
- Resumo financeiro
- Gráficos de gastos por categoria
- Lista de transações do mês

## 🔧 Troubleshooting

### QR Code não aparece

**Problema:** Terminal vazio após iniciar o bot.

**Solução:**
1. Verifique se o backend está rodando
2. Limpe a pasta de sessão:
   ```bash
   rm -rf auth_info_baileys/*
   ```
3. Reinicie o bot

### Sessão expirada

**Problema:** Bot pede para escanear QR Code novamente.

**Causa:** WhatsApp desconectou após 14 dias de inatividade ou logout manual.

**Solução:** Escaneie o QR Code novamente (processo automático).

### Erro "ECONN"

**Problema:** Mensagem "🔌 O servidor do Fayol parece estar offline."

**Solução:**
1. Verifique se o backend está rodando:
   ```bash
   curl http://localhost:3333/health
   ```
2. Confirme que `API_BASE_URL` no `.env` está correta
3. Se usando Docker, use `host.docker.internal` ao invés de `localhost`

### Rate limit atingido

**Problema:** "⏱️ Você está enviando mensagens muito rápido."

**Causa:** Mais de 30 mensagens por minuto (proteção anti-spam).

**Solução:** Aguarde 60 segundos.

### Comando não funciona

**Problema:** Bot não responde a comandos.

**Soluções:**
1. Verifique se está autenticado (digite `/start`)
2. Comandos devem começar com `/` (barra)
3. Use `/ajuda` para ver lista atualizada

## 🧪 Testes

### Rodar todos os testes

```bash
pnpm --filter whatsapp-bot test
```

### Testes com coverage

```bash
pnpm --filter whatsapp-bot test:coverage
```

**Meta:** 98% de cobertura (mantido do Telegram Bot).

### Apenas testes unitários

```bash
pnpm --filter whatsapp-bot test:unit
```

### Apenas testes de integração

```bash
pnpm --filter whatsapp-bot test:integration
```

## 🗺️ Roadmap

### Próximas Features

1. **OCR (Tesseract.js ou Google Vision API)**
   - Upload de comprovante → extrai valor e descrição automaticamente
   - Detecção de QR Codes PIX

2. **Speech-to-Text (Whisper API)**
   - Envie áudio → bot transcreve e registra transação
   - Exemplo: "Almoço vinte e cinco reais" → Despesa de R$ 25,00

3. **Migração para API Oficial Meta**
   - Implementar `MetaAPIProvider` (Strategy Pattern já preparado)
   - Webhooks ao invés de polling
   - Suporte oficial e estável

4. **Sessões em Redis**
   - Substituir `Map` em memória por Redis
   - Permite múltiplas instâncias do bot (horizontal scaling)

5. **Notificações Proativas**
   - Alertas de gastos acima da média
   - Lembrete de faturas a vencer
   - Resumo semanal automático

## 📚 Referências

- **Baileys**: [WhiskeySockets/Baileys](https://github.com/WhiskeySockets/Baileys)
- **Telegram Bot**: `apps/telegram-bot/` (arquitetura base)
- **Backend API**: `apps/backend/src/modules/`
- **Packages Compartilhados**: `packages/@fayol/*`

## 📄 Licença

MIT © Fayol

---

**Desenvolvido com ❤️ usando Baileys v6.7.9 e TypeScript**
