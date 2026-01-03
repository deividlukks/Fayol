# ☁️ Guia Completo de Hospedagem Gratuita - Fayol

> Deploy do projeto Fayol para Beta Fechado utilizando recursos gratuitos

---

## 📋 Índice

1. [Visão Geral da Estratégia](#-visão-geral-da-estratégia)
2. [Comparativo de Provedores](#-comparativo-de-provedores)
3. [Arquitetura Recomendada](#-arquitetura-recomendada)
4. [Setup por Componente](#-setup-por-componente)
5. [Deploy Passo a Passo](#-deploy-passo-a-passo)
6. [Configuração de Domínio](#-configuração-de-domínio)
7. [Monitoramento Gratuito](#-monitoramento-gratuito)
8. [Limitações e Workarounds](#-limitações-e-workarounds)
9. [Custos Estimados](#-custos-estimados)

---

## 🎯 Visão Geral da Estratégia

Para um **beta fechado gratuito**, vamos utilizar uma arquitetura **"Best of
Breed"**, aproveitando os melhores tiers gratuitos de diferentes provedores:

| Componente                | Provedor                 | Tier Gratuito | Limitação              |
| ------------------------- | ------------------------ | ------------- | ---------------------- |
| **Frontend (Next.js)**    | Vercel                   | Ilimitado     | 100GB bandwidth/mês    |
| **Backend (NestJS)**      | Render / Railway         | 750h/mês      | Sleep após inatividade |
| **Database (PostgreSQL)** | Neon / Supabase          | 500MB - 500MB | Storage limitado       |
| **Cache (Redis)**         | Upstash                  | 10k req/dia   | Requests limitados     |
| **AI Service (Python)**   | Render / Fly.io          | 750h/mês      | Sleep após inatividade |
| **Storage (Arquivos)**    | Cloudflare R2 / Supabase | 10GB          | Storage limitado       |
| **Email**                 | Resend                   | 3k emails/mês | Volume limitado        |
| **Mobile (Build)**        | Expo EAS                 | Ilimitado     | -                      |

---

## 📊 Comparativo de Provedores

### 1. Frontend (Next.js / Static Sites)

| Provedor             | Plano Gratuito | Bandwidth | Deploy         | Domínio | Limite            |
| -------------------- | -------------- | --------- | -------------- | ------- | ----------------- |
| **Vercel** 🥇        | ✅             | 100GB/mês | Auto (Git)     | Custom  | 100 deploys/dia   |
| **Netlify**          | ✅             | 100GB/mês | Auto (Git)     | Custom  | 300 min build/mês |
| **Cloudflare Pages** | ✅             | Ilimitado | Auto (Git)     | Custom  | 500 builds/mês    |
| **GitHub Pages**     | ✅             | 100GB/mês | Manual/Actions | Custom  | Só static         |

**Recomendação: Vercel** - Melhor integração com Next.js, criadores do
framework.

---

### 2. Backend (Node.js / Python)

| Provedor             | Plano Gratuito | Compute      | RAM   | Sleep?              | Docker? |
| -------------------- | -------------- | ------------ | ----- | ------------------- | ------- |
| **Render** 🥇        | ✅ 750h/mês    | 0.1 CPU      | 512MB | Sim (15min)         | ✅      |
| **Railway**          | ✅ $5 trial    | Variável     | 512MB | Não                 | ✅      |
| **Fly.io**           | ✅ 3 VMs       | Shared CPU   | 256MB | Não                 | ✅      |
| **Heroku**           | ❌ (Removido)  | -            | -     | -                   | -       |
| **Oracle Cloud** 🔥  | ✅ Always Free | 4 CPUs (ARM) | 24GB  | Não                 | ✅      |
| **Google Cloud Run** | ✅ 2M req/mês  | 1 vCPU       | 512MB | Sim (scale-to-zero) | ✅      |

**Recomendação: Render** (simples) ou **Oracle Cloud** (mais poderoso, mas
requer setup manual).

---

### 3. Banco de Dados (PostgreSQL)

| Provedor        | Plano Gratuito    | Storage | Compute    | Conexões   | Backup       |
| --------------- | ----------------- | ------- | ---------- | ---------- | ------------ |
| **Neon** 🥇     | ✅                | 500MB   | Serverless | Ilimitadas | 7 dias       |
| **Supabase**    | ✅                | 500MB   | Pausável   | 50 diretas | Não incluído |
| **Aiven**       | ✅ 30 dias trial  | 10GB    | 1 CPU      | 25         | Sim          |
| **ElephantSQL** | ✅                | 20MB    | Shared     | 5          | Não          |
| **Railway**     | ✅ (com $5 trial) | 5GB     | Shared     | 20         | Sim          |

**Recomendação: Neon** - Melhor tier gratuito, serverless, sem sleep.

---

### 4. Cache & Queue (Redis)

| Provedor        | Plano Gratuito | Storage | Conexões    | Eviction |
| --------------- | -------------- | ------- | ----------- | -------- |
| **Upstash** 🥇  | ✅             | 256MB   | 10k req/dia | LRU      |
| **Redis Cloud** | ✅             | 30MB    | 30 conexões | LRU      |
| **Railway**     | ✅ (com trial) | 100MB   | Ilimitadas  | Não      |

**Recomendação: Upstash** - Serverless, REST API, muito generoso.

---

### 5. Object Storage (Arquivos / Uploads)

| Provedor             | Plano Gratuito | Storage | Transfer         | API           |
| -------------------- | -------------- | ------- | ---------------- | ------------- |
| **Cloudflare R2** 🥇 | ✅             | 10GB    | Ilimitado egress | S3-compatible |
| **Supabase Storage** | ✅             | 1GB     | 2GB/mês          | REST API      |
| **Backblaze B2**     | ✅             | 10GB    | 1GB/dia          | S3-compatible |

**Recomendação: Cloudflare R2** - Zero custos de egress, compatível com S3.

---

## 🏗️ Arquitetura Recomendada

### Opção 1: Arquitetura Distribuída (100% Gratuita - Recomendada para Beta)

```
                           ┌─────────────────┐
                           │   Cloudflare    │
                           │   DNS + CDN     │
                           └────────┬────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
          ┌─────────▼──────────┐        ┌──────────▼─────────┐
          │   Vercel (CDN)      │        │  Render (Backend)   │
          │   Next.js Web App   │───────>│    NestJS API       │
          │   Port: 443 (HTTPS) │        │    Port: 3333       │
          └─────────────────────┘        └──────────┬─────────┘
                                                     │
                    ┌────────────────────────────────┼────────────────┐
                    │                                │                │
          ┌─────────▼──────────┐        ┌───────────▼─────┐  ┌───────▼────────┐
          │  Neon PostgreSQL    │        │ Upstash Redis   │  │ Render Python  │
          │  Database           │        │ Cache + Queue   │  │ AI Service     │
          │  Port: 5432         │        │ Port: 6379      │  │ Port: 8000     │
          └─────────────────────┘        └─────────────────┘  └────────────────┘
                    │
          ┌─────────▼──────────┐
          │  Cloudflare R2      │
          │  File Storage       │
          │  (S3-compatible)    │
          └─────────────────────┘
```

**Vantagens:**

- ✅ 100% gratuito (sem cartão de crédito na maioria)
- ✅ Fácil de configurar
- ✅ CDN global incluído

**Desvantagens:**

- ⚠️ Backend entra em sleep (Render free tier)
- ⚠️ Cold start de ~30s após inatividade
- ⚠️ Storage limitado (500MB PostgreSQL)

---

### Opção 2: Oracle Cloud Free Tier (Mais Poderoso - Requer Setup Manual)

**Oracle Cloud Always Free** oferece:

- 4 OCPUs ARM (Ampere A1)
- 24GB RAM
- 200GB storage
- Always-on (sem sleep!)

```
                    ┌─────────────────────────────────────────┐
                    │    Oracle Cloud Free Tier VM (Ubuntu)    │
                    │    - 4 vCPUs ARM | 24GB RAM              │
                    │                                           │
                    │  ┌─────────────────────────────────────┐ │
                    │  │      Docker Compose Services:        │ │
                    │  │  - NestJS Backend (port 3333)        │ │
                    │  │  - Python AI (port 8000)             │ │
                    │  │  - PostgreSQL (port 5432)            │ │
                    │  │  - Redis (port 6379)                 │ │
                    │  │  - Nginx Reverse Proxy (port 80/443) │ │
                    │  └─────────────────────────────────────┘ │
                    └───────────────────┬─────────────────────┘
                                        │
                              ┌─────────▼──────────┐
                              │   Vercel (CDN)      │
                              │   Next.js Web App   │───> API: https://api.fayol.app
                              └─────────────────────┘
```

**Vantagens:**

- ✅ Always-on (sem sleep)
- ✅ Recursos generosos (24GB RAM!)
- ✅ Controle total (Docker Compose)

**Desvantagens:**

- ⚠️ Requer configuração manual (Linux, Docker, Nginx)
- ⚠️ Mais complexo para manter
- ⚠️ Requer cartão de crédito (mas não cobra)

---

## 🛠️ Setup por Componente

### 1. Frontend - Vercel (Next.js)

#### Passo a Passo:

**1.1. Preparação do Código**

```bash
# Certifique-se de que o app Next.js está em apps/web-app
cd apps/web-app

# Teste build localmente
pnpm build
```

**1.2. Deploy no Vercel**

1. Acesse [vercel.com](https://vercel.com)
2. Clique em "Add New... > Project"
3. Importe seu repositório GitHub
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web-app`
   - **Build Command**: `pnpm build` (ou deixe automático)
   - **Output Directory**: `.next` (automático)
   - **Install Command**: `pnpm install --filter web-app`

**1.3. Variáveis de Ambiente**

```env
# Vercel Dashboard > Settings > Environment Variables

# API URL (será a URL do seu backend no Render)
NEXT_PUBLIC_API_URL=https://fayol-api.onrender.com/api

# Site URL (URL gerada pela Vercel)
NEXT_PUBLIC_SITE_URL=https://fayol.vercel.app

# (Opcional) Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

**1.4. Domínio Personalizado (Opcional)**

1. Vercel Dashboard > Settings > Domains
2. Adicione seu domínio (ex: `app.fayol.app`)
3. Configure DNS conforme instruções

---

### 2. Banco de Dados - Neon (PostgreSQL)

#### Passo a Passo:

**2.1. Criar Projeto no Neon**

1. Acesse [neon.tech](https://neon.tech)
2. Crie uma conta (free)
3. Crie um novo projeto: **fayol-db**
4. Região: Escolha a mais próxima (ex: `us-east-1`)

**2.2. Obter Connection String**

```env
# Copie a DATABASE_URL fornecida:
DATABASE_URL="postgresql://user:password@ep-xxxxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

**2.3. Executar Migrations**

```bash
# Configure a DATABASE_URL no seu .env local
echo 'DATABASE_URL="postgresql://user:password@ep-xxxxx.us-east-1.aws.neon.tech/neondb?sslmode=require"' >> .env

# Execute migrations
pnpm --filter @fayol/database-models run migrate:deploy

# (Opcional) Seed de dados iniciais
pnpm --filter @fayol/database-models run seed
```

**2.4. Verificar Tabelas**

Use o **SQL Editor** do Neon ou conecte via **pgAdmin**:

```bash
# String de conexão:
Host: ep-xxxxx.us-east-1.aws.neon.tech
Database: neondb
User: user
Password: password
Port: 5432
SSL: Require
```

---

### 3. Cache - Upstash (Redis)

#### Passo a Passo:

**3.1. Criar Database**

1. Acesse [upstash.com](https://upstash.com)
2. Crie conta
3. Create Database:
   - **Name**: fayol-redis
   - **Type**: Regional
   - **Region**: Mesma do backend (ex: `us-east-1`)

**3.2. Obter Credenciais**

```env
# Copie do dashboard:
REDIS_HOST=loving-xxx-12345.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=AXCDxxxxxxxxxxxxxx

# Ou use REST API (serverless):
UPSTASH_REDIS_REST_URL=https://loving-xxx-12345.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXCDxxxxxxxxxxxxxx
```

**3.3. Testar Conexão**

```bash
# Via redis-cli (se tiver instalado)
redis-cli -h loving-xxx-12345.upstash.io -p 6379 -a AXCDxxxxxxxxxxxxxx

# Ou via código Node.js
node -e "const Redis = require('ioredis'); const redis = new Redis('rediss://:PASSWORD@HOST:PORT'); redis.ping().then(console.log);"
```

---

### 4. Backend - Render (NestJS)

#### Passo a Passo:

**4.1. Preparar Build**

```bash
# Certifique-se de que o backend builda corretamente
cd apps/backend
pnpm build

# Teste produção local
NODE_ENV=production pnpm start
```

**4.2. Criar Web Service no Render**

1. Acesse [render.com](https://render.com)
2. New > Web Service
3. Conecte GitHub repository
4. Configure:
   - **Name**: fayol-backend
   - **Region**: Oregon (US West) ou próxima
   - **Branch**: main
   - **Root Directory**: `/` (monorepo)
   - **Runtime**: Node
   - **Build Command**:
     ```bash
     pnpm install && pnpm --filter backend run build
     ```
   - **Start Command**:
     ```bash
     cd apps/backend && node dist/main.js
     ```
   - **Plan**: Free

**4.3. Variáveis de Ambiente**

```env
# Render Dashboard > Environment > Environment Variables

NODE_ENV=production
PORT_BACKEND=3333

# Database (Neon)
DATABASE_URL=postgresql://user:password@ep-xxxxx.us-east-1.aws.neon.tech/neondb?sslmode=require

# Redis (Upstash)
REDIS_HOST=loving-xxx-12345.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=AXCDxxxxxxxxxxxxxx

# JWT Secrets (IMPORTANTE: Use valores fortes!)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345678
REFRESH_TOKEN_SECRET=your_super_secret_refresh_key_change_this_in_production_12345678

# Two-Factor Encryption
TWO_FACTOR_ENCRYPTION_KEY=your_32_character_key_here_12345

# AI Service URL (será criado depois)
AI_SERVICE_URL=https://fayol-ai.onrender.com

# CORS
CORS_ORIGINS=https://fayol.vercel.app,https://app.fayol.app

# Stripe (se usar)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Resend)
RESEND_API_KEY=re_...
MAIL_FROM_ADDRESS=noreply@fayol.app

# Sentry (opcional)
SENTRY_DSN=https://xxx@oXXX.ingest.sentry.io/XXX
```

**4.4. Deploy**

- Render fará deploy automático a cada push na branch main
- URL gerada: `https://fayol-backend.onrender.com`

**4.5. Health Check**

```bash
curl https://fayol-backend.onrender.com/api/health
# Resposta esperada: {"status":"ok"}
```

---

### 5. AI Service - Render (Python)

#### Passo a Passo:

**5.1. Preparar Dockerfile**

O projeto já tem `libs/python-ai/Dockerfile`. Certifique-se de que está
otimizado:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY src/ ./src/

# Expose port
EXPOSE 8000

# Run
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**5.2. Deploy no Render**

1. New > Web Service
2. Configure:
   - **Name**: fayol-ai
   - **Region**: Mesma do backend
   - **Root Directory**: `libs/python-ai`
   - **Runtime**: Docker
   - **Dockerfile Path**: `./Dockerfile`
   - **Plan**: Free

**5.3. Variáveis de Ambiente**

```env
PYTHONUNBUFFERED=1
AI_MODEL_PATH=/app/data/models
AI_CONFIDENCE_THRESHOLD=0.7
```

**5.4. Atualizar Backend**

Volte ao Render dashboard do backend e atualize:

```env
AI_SERVICE_URL=https://fayol-ai.onrender.com
```

---

### 6. Storage - Cloudflare R2 (Opcional)

#### Para uploads de anexos

**6.1. Criar Bucket**

1. Cloudflare Dashboard > R2
2. Create Bucket: `fayol-attachments`

**6.2. Gerar API Token**

1. R2 > Manage R2 API Tokens
2. Create API Token:
   - Permissions: Read & Write
   - Scope: `fayol-attachments`

**6.3. Configurar no Backend**

```env
# AWS S3-compatible
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=fayol-attachments
AWS_S3_REGION=auto
AWS_S3_ENDPOINT=https://xxx.r2.cloudflarestorage.com
```

---

## 📝 Deploy Passo a Passo (Resumo)

### Checklist de Deploy

```bash
# 1. Banco de Dados
☐ Criar projeto no Neon
☐ Copiar DATABASE_URL
☐ Rodar migrations: pnpm --filter @fayol/database-models run migrate:deploy
☐ (Opcional) Seed: pnpm --filter @fayol/database-models run seed

# 2. Cache
☐ Criar database no Upstash
☐ Copiar credenciais Redis

# 3. Backend
☐ Criar Web Service no Render
☐ Configurar build command
☐ Adicionar variáveis de ambiente (DATABASE_URL, REDIS, JWT, etc.)
☐ Deploy automático
☐ Testar: curl https://fayol-backend.onrender.com/api/health

# 4. AI Service
☐ Criar Web Service no Render (Docker)
☐ Configurar root directory: libs/python-ai
☐ Deploy automático
☐ Atualizar AI_SERVICE_URL no backend

# 5. Frontend
☐ Importar projeto no Vercel
☐ Configurar root directory: apps/web-app
☐ Adicionar NEXT_PUBLIC_API_URL (URL do backend)
☐ Deploy automático
☐ Testar acesso: https://fayol.vercel.app

# 6. Mobile (Opcional)
☐ Configurar EAS Build
☐ eas build --platform android
☐ Distribuir APK para beta testers
```

---

## 🌐 Configuração de Domínio

### Domínio Personalizado (Opcional)

**1. Comprar Domínio** (ex: fayol.app)

- **Registrar**: Namecheap, Google Domains, Cloudflare Registrar

**2. Configurar DNS**

```dns
# Apontar para Vercel (Frontend)
Type: CNAME
Name: app (ou @)
Value: cname.vercel-dns.com

# Apontar para Render (Backend)
Type: CNAME
Name: api
Value: fayol-backend.onrender.com

# SSL será provisionado automaticamente
```

**3. URLs Finais**

- Frontend: `https://app.fayol.app`
- Backend: `https://api.fayol.app`

**4. Atualizar Variáveis**

```env
# Vercel
NEXT_PUBLIC_API_URL=https://api.fayol.app/api
NEXT_PUBLIC_SITE_URL=https://app.fayol.app

# Render (Backend)
CORS_ORIGINS=https://app.fayol.app
```

---

## 📊 Monitoramento Gratuito

### 1. Uptime Monitoring

**Opção 1: UptimeRobot** (Recomendado)

- 50 monitores gratuitos
- Check a cada 5 minutos
- Alertas via email

```
https://uptimerobot.com

Monitores:
- Backend: https://fayol-backend.onrender.com/api/health
- AI Service: https://fayol-ai.onrender.com/
- Frontend: https://fayol.vercel.app
```

**Opção 2: Betterstack (ex-Checkly)**

- 10 checks gratuitos
- Mais avançado

---

### 2. Error Tracking

**Sentry (Recomendado)**

- 5k eventos/mês gratuitos
- Já configurado no projeto

```bash
# Criar projeto em sentry.io
# Copiar DSN
SENTRY_DSN=https://xxx@oXXX.ingest.sentry.io/XXX
```

---

### 3. Logs

**Render Logs**

- Logs nativos no dashboard
- Retenção de 7 dias (free tier)

**Alternativa: Better Stack Logs**

- 1GB/mês gratuito

---

## ⚠️ Limitações e Workarounds

### 1. Sleep do Backend (Render Free)

**Problema**: Após 15 minutos de inatividade, o serviço entra em sleep. Cold
start: ~30s.

**Workarounds**:

1. **Ping Automático** (não recomendado oficialmente):

   ```bash
   # Crie um cron job no cron-job.org
   URL: https://fayol-backend.onrender.com/api/health
   Interval: A cada 14 minutos
   ```

2. **Upgrade para Render Paid** ($7/mês) - Always-on

3. **Migrar para Oracle Cloud Free Tier** - Always-on gratuito

---

### 2. Storage Limitado (PostgreSQL 500MB)

**Workarounds**:

1. Implementar auto-cleanup de dados antigos
2. Armazenar anexos no R2 (não no DB)
3. Upgrade para Neon Pro ($19/mês) se necessário

---

### 3. Redis Requests Limitados (Upstash 10k/dia)

**Workarounds**:

1. Configurar TTL agressivo
2. Cache apenas dados críticos
3. Upgrade para Upstash Pro se necessário

---

### 4. Build Minutes (Render/Vercel)

**Workarounds**:

1. Evitar rebuilds desnecessários
2. Usar cache de build
3. Fazer squash de commits antes do deploy

---

## 💰 Custos Estimados

### Cenário 1: 100% Gratuito

| Componente | Provedor      | Custo            |
| ---------- | ------------- | ---------------- |
| Frontend   | Vercel        | $0               |
| Backend    | Render        | $0               |
| Database   | Neon          | $0               |
| Redis      | Upstash       | $0               |
| AI Service | Render        | $0               |
| Storage    | Cloudflare R2 | $0               |
| Email      | Resend        | $0               |
| Domínio    | (Opcional)    | ~$12/ano         |
| **Total**  |               | **$0 - $12/ano** |

**Usuários suportados**: 10-50 (beta fechado)

---

### Cenário 2: Produção Básica

| Componente | Provedor          | Custo           |
| ---------- | ----------------- | --------------- |
| Frontend   | Vercel Pro        | $20/mês         |
| Backend    | Render Standard   | $7/mês          |
| Database   | Neon Pro          | $19/mês         |
| Redis      | Upstash Pay-as-go | ~$5/mês         |
| AI Service | Render Standard   | $7/mês          |
| Storage    | Cloudflare R2     | ~$1/mês         |
| Email      | Resend            | $0 (ou $10/mês) |
| Domínio    |                   | $12/ano         |
| **Total**  |                   | **~$60-70/mês** |

**Usuários suportados**: 100-500

---

## 🚀 Próximos Passos

Após deploy completo:

1. **Teste end-to-end**:
   - Criar usuário
   - Adicionar transação
   - Testar categorização AI
   - Exportar relatório

2. **Configure monitoramento**:
   - UptimeRobot
   - Sentry

3. **Adicione beta testers**:
   - Envie link: `https://app.fayol.app`
   - Colete feedback

4. **Documente issues conhecidas**:
   - GitHub Issues
   - Roadmap de melhorias

---

## 📞 Suporte

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Neon Docs**: [neon.tech/docs](https://neon.tech/docs)
- **Upstash Docs**: [docs.upstash.com](https://docs.upstash.com)

---

**Boa sorte com o deploy! 🎉**

**[⬆ Voltar ao topo](#-guia-completo-de-hospedagem-gratuita---fayol)**
