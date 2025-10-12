# ❓ FAQ & Troubleshooting - Fayol

> Perguntas frequentes e soluções rápidas para problemas comuns

---

## 📋 Índice Rápido

- [Instalação & Setup](#instalação--setup)
- [Banco de Dados](#banco-de-dados)
- [Backend (NestJS)](#backend-nestjs)
- [Frontend (Next.js)](#frontend-nextjs)
- [Bot Telegram](#bot-telegram)
- [Deploy & Produção](#deploy--produção)
- [Performance](#performance)
- [Segurança](#segurança)

---

## 🔧 Instalação & Setup

### ❓ Erro "pnpm: command not found"

**Solução:**
```bash
npm install -g pnpm
```

### ❓ Erro ao instalar dependências no Windows

**Causa:** Problemas com compilação de pacotes nativos

**Solução:**
```bash
# Instale build tools do Windows
npm install --global windows-build-tools

# Ou use WSL2
wsl --install
```

### ❓ "MODULE_NOT_FOUND" após instalação

**Solução:**
```bash
# Limpe tudo e reinstale
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## 🗄️ Banco de Dados

### ❓ Erro "Prisma Client not found"

**Solução:**
```bash
cd apps/backend
pnpm prisma generate
```

### ❓ Erro ao executar migrations

**Causa 1:** Banco não existe
```bash
# Crie o banco manualmente
createdb fayol_development
```

**Causa 2:** DATABASE_URL incorreta
```bash
# Verifique o .env
cat .env | grep DATABASE_URL

# Formato correto:
# postgresql://usuario:senha@localhost:5432/database
```

### ❓ Como resetar o banco de dados?

```bash
cd apps/backend

# CUIDADO: Apaga TODOS os dados!
pnpm prisma migrate reset

# Ou manualmente:
pnpm prisma migrate reset --skip-seed
pnpm prisma migrate deploy
pnpm prisma db seed
```

### ❓ Erro "relation does not exist"

**Causa:** Schema desatualizado

**Solução:**
```bash
pnpm prisma migrate deploy
```

### ❓ Como fazer backup do banco?

```bash
# PostgreSQL
pg_dump -U usuario fayol_production > backup.sql

# Com senha
PGPASSWORD=senha pg_dump -U usuario -h localhost fayol_production > backup.sql

# Compactado
pg_dump -U usuario fayol_production | gzip > backup.sql.gz
```

---

## 🔴 Backend (NestJS)

### ❓ Backend não inicia - "Port 3000 already in use"

**Solução:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID [número-do-pid] /F

# Linux/Mac
lsof -i :3000
kill -9 [PID]

# Ou use outra porta
PORT=3001 pnpm start
```

### ❓ Erro "Cannot connect to Redis"

**Solução 1:** Redis não está rodando
```bash
# Verificar
redis-cli ping

# Iniciar (Linux)
sudo systemctl start redis

# Windows (se instalado)
redis-server
```

**Solução 2:** Desabilitar Redis temporariamente
```typescript
// src/app.module.ts
// Comente o RedisModule
```

### ❓ Erro "JWT malformed" ou "invalid signature"

**Causa:** Token inválido ou JWT_SECRET incorreto

**Solução:**
```bash
# 1. Verifique JWT_SECRET no .env
cat .env | grep JWT_SECRET

# 2. Faça login novamente para gerar novo token

# 3. Se persistir, gere nova chave
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### ❓ Logs não aparecem

**Solução:**
```bash
# Ative logs no .env
LOG_LEVEL=debug

# Verifique diretório de logs
mkdir -p logs

# Reinicie
pnpm start
```

### ❓ "Credenciais inválidas" no login

**Verificações:**
```bash
# 1. Verifique se usuário existe
pnpm prisma studio
# Veja tabela User

# 2. Teste senha
# A senha padrão do seed é: admin@123

# 3. Verifique bcrypt
# Senha deve estar hasheada no banco

# 4. Resetar senha de admin
cd apps/backend
node -e "
const bcrypt = require('bcryptjs');
console.log(bcrypt.hashSync('admin@123', 10));
"
# Copie o hash e atualize no banco
```

---

## 🌐 Frontend (Next.js)

### ❓ Página em branco após build

**Causa:** Variáveis de ambiente não configuradas

**Solução:**
```bash
# Crie .env.local
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3000
EOF

# Rebuild
pnpm build
```

### ❓ CORS Error ao chamar API

**Solução no Backend:**
```typescript
// apps/backend/src/main.ts
app.enableCors({
  origin: 'http://localhost:3001',
  credentials: true,
});
```

**No .env:**
```bash
CORS_ORIGIN=http://localhost:3001,http://localhost:3000
```

### ❓ Erro "Module not found" no Next.js

**Solução:**
```bash
cd apps/admin-panel
rm -rf .next node_modules
pnpm install
pnpm dev
```

### ❓ Build falha com "out of memory"

**Solução:**
```bash
# Aumente memória do Node.js
NODE_OPTIONS="--max-old-space-size=4096" pnpm build
```

---

## 📱 Bot Telegram

### ❓ Bot não responde

**Verificações:**
```bash
# 1. Token correto?
echo $TELEGRAM_BOT_TOKEN

# 2. Bot está rodando?
pm2 status fayol-telegram-bot

# 3. Logs
pm2 logs fayol-telegram-bot

# 4. Webhook configurado?
curl https://api.telegram.org/bot[TOKEN]/getWebhookInfo
```

### ❓ Erro "409 Conflict: terminated by other getUpdates"

**Causa:** Múltiplas instâncias do bot rodando

**Solução:**
```bash
# Deletar webhook
curl -X POST https://api.telegram.org/bot[TOKEN]/deleteWebhook

# Parar todas instâncias
pm2 delete fayol-telegram-bot

# Iniciar apenas uma
pm2 start apps/telegram-bot/src/index.ts --name fayol-telegram-bot
```

### ❓ Bot recebe mensagens mas não conecta com backend

**Verificações:**
```bash
# 1. API_BASE_URL correto no .env?
cat apps/telegram-bot/.env | grep API_BASE_URL

# 2. Backend está rodando?
curl http://localhost:3000/api/v1/health

# 3. Token de autenticação
# Verifique se bot consegue fazer login
```

---

## 🚀 Deploy & Produção

### ❓ 502 Bad Gateway no domínio

**Verificações:**
```bash
# 1. Aplicação rodando?
pm2 status

# 2. Porta correta?
curl http://localhost:3000/api/v1/health

# 3. Proxy reverso configurado?
cat /home/usuario/public_html/api/.htaccess

# 4. mod_proxy habilitado?
# Contate suporte da hospedagem
```

### ❓ SSL não funciona / "Not Secure"

**Solução:**
```bash
# cPanel → SSL/TLS Status
# Run AutoSSL

# Forçar HTTPS no .htaccess
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

### ❓ PM2 não inicia após reboot

**Solução:**
```bash
# Configure auto-start
pm2 startup
# Execute o comando que aparecer

pm2 save
```

### ❓ Aplicação morre após um tempo

**Causa:** Limite de memória

**Solução:**
```bash
# Limite no PM2
pm2 restart fayol-backend --max-memory-restart 500M

# No ecosystem.config.js
max_memory_restart: '500M'
```

### ❓ Como fazer deploy de nova versão?

```bash
# Usando script automático
./scripts/deploy.sh

# Manual
cd ~/fayol
git pull
pnpm install
pnpm build
pm2 restart all
```

---

## ⚡ Performance

### ❓ API está lenta

**Diagnóstico:**
```bash
# 1. Verificar CPU/RAM
pm2 monit

# 2. Logs de performance
pm2 logs fayol-backend | grep "took"

# 3. Queries lentas no Prisma
# Ative query logs no schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  log      = ["query", "info", "warn", "error"]
}
```

**Otimizações:**
```bash
# 1. Aumente instances do PM2
pm2 scale fayol-backend 4

# 2. Configure Redis cache

# 3. Otimize queries
# Use 'select' para pegar apenas campos necessários
# Use 'include' com cuidado
```

### ❓ Banco de dados lento

**Soluções:**
```sql
-- Criar índices
CREATE INDEX idx_transactions_user_id ON "Transaction"("userId");
CREATE INDEX idx_transactions_date ON "Transaction"("effectiveDate");

-- Vacuum
VACUUM ANALYZE;
```

---

## 🔒 Segurança

### ❓ Como gerar senha forte?

```bash
# Método 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Método 2: OpenSSL
openssl rand -hex 32

# Método 3: Online
# https://randomkeygen.com/
```

### ❓ Como rotacionar JWT_SECRET?

```bash
# 1. Gere nova chave
NEW_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# 2. Atualize .env
JWT_SECRET=$NEW_SECRET

# 3. Reinicie
pm2 restart fayol-backend

# 4. IMPORTANTE: Todos os usuários terão que fazer login novamente
```

### ❓ Detectei tentativa de invasão

**Ações Imediatas:**
```bash
# 1. Rotacione todas as senhas
# 2. Rotacione JWT_SECRET
# 3. Verifique logs de acesso

pm2 logs fayol-backend | grep "401\|403\|500"

# 4. Bloquei
e IP no firewall/cPanel

# 5. Ative rate limiting
RATE_LIMIT_MAX=50

# 6. Desabilite Swagger em produção
ENABLE_SWAGGER=false
```

### ❓ Como proteger contra SQL Injection?

**Já protegido:** Prisma usa prepared statements automaticamente

**Verificação:**
```typescript
// ❌ NUNCA faça isso:
await prisma.$queryRaw(`SELECT * FROM User WHERE email = '${email}'`);

// ✅ SEMPRE use assim:
await prisma.$queryRaw`SELECT * FROM User WHERE email = ${email}`;
// Ou use Prisma queries normais
await prisma.user.findUnique({ where: { email } });
```

---

## 🔍 Debug

### ❓ Como ativar debug mode?

```bash
# Backend
LOG_LEVEL=debug pnpm start

# Prisma
DEBUG=prisma:* pnpm start

# Node.js
NODE_DEBUG=* pnpm start
```

### ❓ Como inspecionar requisições HTTP?

**Ferramenta:** Use Postman ou Insomnia

**cURL:**
```bash
# GET com token
curl -H "Authorization: Bearer TOKEN_AQUI" \
  https://api.seudominio.com/api/v1/users/me

# POST
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_AQUI" \
  -d '{"name":"Teste"}' \
  https://api.seudominio.com/api/v1/accounts
```

### ❓ Como ver SQL queries do Prisma?

```typescript
// main.ts
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

---

## 📞 Ainda com Problemas?

### 1. Verificar Logs Completos
```bash
# Backend
tail -f ~/fayol/apps/backend/logs/out.log
tail -f ~/fayol/apps/backend/logs/err.log

# PM2
pm2 logs --lines 500

# Sistema
dmesg | tail
journalctl -xe
```

### 2. Health Check Completo
```bash
./scripts/health-check.sh
```

### 3. Documentação
- [Guia de Instalação](./02_GUIA_INSTALACAO.md)
- [Guia de Produção](./GUIA_PRODUCAO_CPANEL.md)
- [Arquitetura](./01_ARQUITETURA.md)

### 4. Criar Issue no GitHub
- Inclua: logs, versões, passos para reproduzir
- Remova informações sensíveis (senhas, tokens)

---

**Última atualização**: 2025-10-12
**Versão**: 1.0.0
