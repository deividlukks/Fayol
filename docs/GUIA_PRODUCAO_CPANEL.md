# 🚀 Guia de Produção - Fayol com cPanel

> Guia completo passo a passo para colocar o projeto Fayol em produção utilizando hospedagem com cPanel

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Preparação do Ambiente Local](#preparação-do-ambiente-local)
3. [Configuração do Servidor cPanel](#configuração-do-servidor-cpanel)
4. [Deploy do Backend (NestJS)](#deploy-do-backend-nestjs)
5. [Deploy do Admin Panel (Next.js)](#deploy-do-admin-panel-nextjs)
6. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
7. [Configuração do Redis](#configuração-do-redis)
8. [Deploy do Serviço de IA (Python/FastAPI)](#deploy-do-serviço-de-ia-pythonfastapi)
9. [Configuração de SSL/HTTPS](#configuração-de-sslhttps)
10. [Configuração de Domínios e Subdomínios](#configuração-de-domínios-e-subdomínios)
11. [Variáveis de Ambiente](#variáveis-de-ambiente)
12. [Testes de Produção](#testes-de-produção)
13. [Monitoramento e Logs](#monitoramento-e-logs)
14. [Backup e Recuperação](#backup-e-recuperação)
15. [Troubleshooting](#troubleshooting)

---

## 🎯 Pré-requisitos

### Hospedagem cPanel Recomendada

**Especificações Mínimas:**
- **CPU**: 2 cores
- **RAM**: 4GB (8GB recomendado)
- **Armazenamento**: 20GB SSD
- **Node.js**: v18.x ou superior
- **Python**: 3.9 ou superior
- **PostgreSQL**: 14.x ou superior
- **Redis**: 6.x ou superior
- **SSL**: Gratuito (Let's Encrypt)

**Provedores Recomendados:**
- HostGator (Plano Cloud ou superior)
- Bluehost (VPS ou Dedicated)
- A2 Hosting (Turbo ou superior)
- SiteGround (GoGeek ou Cloud)

### Domínios Necessários

Você precisará configurar:
- `api.seudominio.com` → Backend (NestJS)
- `admin.seudominio.com` → Admin Panel (Next.js)
- `ai.seudominio.com` → Serviço de IA (FastAPI)
- `seudominio.com` → App Web (opcional)

---

## 📦 Preparação do Ambiente Local

### 1. Build de Produção

```bash
# 1. Navegue até o diretório do projeto
cd C:\Users\Deivid Lucas\Documents\Projetos\Fayol

# 2. Instale dependências
pnpm install

# 3. Build do Backend
cd apps/backend
pnpm build

# 4. Build do Admin Panel
cd ../admin-panel
pnpm build

# 5. Volte para a raiz
cd ../..
```

### 2. Criar Arquivo de Ambiente de Produção

Crie `.env.production` na raiz:

```bash
# .env.production

# ============================================
# AMBIENTE
# ============================================
NODE_ENV=production

# ============================================
# DATABASE
# ============================================
DATABASE_URL="postgresql://fayol_user:SENHA_FORTE_AQUI@localhost:5432/fayol_production?schema=public"

# ============================================
# JWT
# ============================================
JWT_SECRET="seu-jwt-secret-super-seguro-aqui-com-no-minimo-32-caracteres"
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET="seu-jwt-refresh-secret-super-seguro-aqui"
JWT_REFRESH_EXPIRES_IN=7d

# ============================================
# API URLs
# ============================================
API_BASE_URL=https://api.seudominio.com
ADMIN_PANEL_URL=https://admin.seudominio.com
AI_SERVICE_URL=https://ai.seudominio.com

# ============================================
# CORS
# ============================================
CORS_ORIGIN=https://admin.seudominio.com,https://seudominio.com

# ============================================
# REDIS
# ============================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=sua-senha-redis-aqui

# ============================================
# TELEGRAM BOT
# ============================================
TELEGRAM_BOT_TOKEN=seu-bot-token-aqui
TELEGRAM_WEBHOOK_URL=https://api.seudominio.com/telegram/webhook

# ============================================
# EMAIL (para notificações)
# ============================================
SMTP_HOST=smtp.seudominio.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@seudominio.com
SMTP_PASS=senha-email-aqui
EMAIL_FROM=noreply@seudominio.com

# ============================================
# LIMITES E SEGURANÇA
# ============================================
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
MAX_FILE_SIZE=5242880

# ============================================
# LOGS
# ============================================
LOG_LEVEL=info
```

### 3. Compactar Projeto

```bash
# Windows PowerShell
Compress-Archive -Path apps, packages, node_modules, package.json, pnpm-lock.yaml, .env.production -DestinationPath fayol-production.zip

# Ou use WinRAR/7zip para criar o arquivo
```

---

## ⚙️ Configuração do Servidor cPanel

### 1. Acesso ao cPanel

1. Acesse seu cPanel: `https://seudominio.com/cpanel`
2. Login com suas credenciais
3. Navegue até a página inicial

### 2. Configurar Node.js

#### Método 1: Via cPanel Node.js Selector (se disponível)

1. **Acessar Setup Node.js**
   ```
   cPanel → Software → Setup Node.js App
   ```

2. **Criar Nova Aplicação Node.js**
   - Clique em "Create Application"
   - **Node.js version**: 18.x ou 20.x
   - **Application mode**: Production
   - **Application root**: `fayol/apps/backend`
   - **Application URL**: `api.seudominio.com`
   - **Application startup file**: `dist/main.js`
   - **Passenger log file**: Ativado

3. **Adicionar Variáveis de Ambiente**
   - Copie todas as variáveis do `.env.production`
   - Cole no campo "Environment variables"

#### Método 2: Via SSH (Recomendado para maior controle)

```bash
# 1. Conecte via SSH
ssh usuario@seudominio.com

# 2. Instale Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# 3. Instale Node.js
nvm install 20
nvm use 20
nvm alias default 20

# 4. Instale pnpm globalmente
npm install -g pnpm

# 5. Instale PM2 (Process Manager)
npm install -g pm2

# 6. Verifique instalações
node --version  # v20.x.x
pnpm --version  # 8.x.x
pm2 --version   # 5.x.x
```

### 3. Configurar Python (para Serviço de IA)

```bash
# Via SSH

# 1. Instale Python 3.9+ (se não estiver instalado)
python3 --version

# 2. Instale pip
python3 -m ensurepip --upgrade

# 3. Instale virtualenv
pip3 install virtualenv

# 4. Verifique
python3 --version  # Python 3.9+
pip3 --version     # pip 21+
```

---

## 🗄️ Configuração do Banco de Dados

### 1. Criar Banco PostgreSQL via cPanel

1. **Acessar PostgreSQL Databases**
   ```
   cPanel → Databases → PostgreSQL Databases
   ```

2. **Criar Novo Banco**
   - **Database Name**: `fayol_production`
   - Clique em "Create Database"

3. **Criar Usuário**
   - **Username**: `fayol_user`
   - **Password**: Gere senha forte (mínimo 16 caracteres)
   - Clique em "Create User"

4. **Adicionar Usuário ao Banco**
   - Selecione usuário `fayol_user`
   - Selecione banco `fayol_production`
   - Privilégios: **ALL PRIVILEGES**
   - Clique em "Add User to Database"

5. **Anotar Credenciais**
   ```
   Host: localhost
   Port: 5432
   Database: fayol_production
   User: fayol_user
   Password: [senha gerada]
   ```

### 2. Executar Migrations via SSH

```bash
# 1. Conecte via SSH
ssh usuario@seudominio.com

# 2. Navegue até o backend
cd ~/fayol/apps/backend

# 3. Configure DATABASE_URL
export DATABASE_URL="postgresql://fayol_user:SENHA@localhost:5432/fayol_production?schema=public"

# 4. Execute migrations
pnpm prisma migrate deploy

# 5. Execute seed (dados iniciais)
pnpm prisma db seed

# 6. Verifique
pnpm prisma studio --port 5555
# Acesse: http://seudominio.com:5555
```

---

## 📤 Deploy do Backend (NestJS)

### Método 1: Upload via File Manager

1. **Acesse File Manager**
   ```
   cPanel → Files → File Manager
   ```

2. **Upload do Projeto**
   - Navegue até `/home/usuario/`
   - Crie pasta `fayol`
   - Upload `fayol-production.zip`
   - Extrair arquivo

3. **Via SSH - Configurar e Iniciar**

```bash
# 1. Conecte via SSH
ssh usuario@seudominio.com

# 2. Navegue até o backend
cd ~/fayol/apps/backend

# 3. Instale dependências (production only)
pnpm install --prod

# 4. Copie arquivo de ambiente
cp ../../.env.production .env

# 5. Compile TypeScript (se necessário)
pnpm build

# 6. Inicie com PM2
pm2 start dist/main.js --name fayol-backend --env production

# 7. Configure auto-start
pm2 startup
pm2 save

# 8. Verificar status
pm2 status
pm2 logs fayol-backend

# 9. Verificar se está rodando
curl http://localhost:3000/api/v1/health
```

### Método 2: Via Git (Recomendado)

```bash
# 1. Conecte via SSH
ssh usuario@seudominio.com

# 2. Clone repositório
cd ~
git clone https://github.com/seu-usuario/fayol.git

# 3. Configure ambiente
cd fayol
cp .env.production .env

# 4. Instale dependências
pnpm install

# 5. Build
pnpm build

# 6. Inicie backend
cd apps/backend
pm2 start ecosystem.config.js --env production
```

### Criar `ecosystem.config.js` (PM2 Config)

Crie em `apps/backend/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'fayol-backend',
      script: './dist/main.js',
      instances: 2, // ou 'max' para usar todos os cores
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
    },
  ],
};
```

---

## 🌐 Deploy do Admin Panel (Next.js)

### 1. Build Estático

```bash
# No seu computador local

cd apps/admin-panel

# 1. Configure variáveis de ambiente
cat > .env.production.local << EOF
NEXT_PUBLIC_API_URL=https://api.seudominio.com
NEXT_PUBLIC_APP_NAME=Fayol
NEXT_PUBLIC_APP_VERSION=1.0.0
EOF

# 2. Build para produção
pnpm build

# 3. O Next.js gera pasta 'out' (se usando output: 'export')
# ou '.next' (se usando modo servidor)
```

### 2. Upload via cPanel

#### Opção A: Next.js Standalone (Modo Servidor)

```bash
# Via SSH

cd ~/fayol/apps/admin-panel

# 1. Instale dependências
pnpm install --prod

# 2. Build
pnpm build

# 3. Inicie com PM2
pm2 start npm --name fayol-admin -- start

# 4. Configure porta
pm2 stop fayol-admin
pm2 delete fayol-admin
PORT=3001 pm2 start npm --name fayol-admin -- start

# 5. Verifique
pm2 logs fayol-admin
curl http://localhost:3001
```

#### Opção B: Next.js Static Export (Recomendado para cPanel)

1. **Configure next.config.js**

```javascript
// apps/admin-panel/next.config.js
module.exports = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};
```

2. **Build local**

```bash
cd apps/admin-panel
pnpm build
# Gera pasta 'out'
```

3. **Upload no cPanel**
   - Acesse File Manager
   - Navegue até `/home/usuario/public_html/admin`
   - Upload todo conteúdo da pasta `out/`

4. **Configurar .htaccess**

Crie `/home/usuario/public_html/admin/.htaccess`:

```apache
# Redirect all to HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Single Page Application routing
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Security Headers
<IfModule mod_headers.c>
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-Content-Type-Options "nosniff"
  Header set X-XSS-Protection "1; mode=block"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Cache control
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType application/x-javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
  ExpiresByType application/pdf "access plus 1 month"
  ExpiresByType image/x-icon "access plus 1 year"
</IfModule>

# Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/xml
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE text/javascript
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/rss+xml
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
  AddOutputFilterByType DEFLATE application/json
</IfModule>
```

---

## 🔴 Configuração do Redis

### Via SSH

```bash
# 1. Verificar se Redis está instalado
redis-cli --version

# 2. Se não estiver, solicite ao suporte da hospedagem
# Ou instale localmente (não recomendado para cPanel compartilhado)

# 3. Configurar Redis
sudo nano /etc/redis/redis.conf

# Altere:
# bind 127.0.0.1
# requirepass sua-senha-forte-aqui
# maxmemory 256mb
# maxmemory-policy allkeys-lru

# 4. Reinicie Redis
sudo systemctl restart redis

# 5. Teste conexão
redis-cli -a sua-senha-forte-aqui ping
# Resposta: PONG

# 6. Configure no .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=sua-senha-forte-aqui
```

**Nota**: Muitos cPanels compartilhados **não** permitem Redis. Considere:
- Usar hospedagem VPS
- Usar Redis Cloud (gratuito até 30MB): https://redis.com/try-free/
- Usar Upstash (gratuito até 10k comandos/dia): https://upstash.com/

---

## 🤖 Deploy do Serviço de IA (Python/FastAPI)

### 1. Preparar Ambiente Python

```bash
# Via SSH

# 1. Navegue até o serviço de IA
cd ~/fayol/apps/ai-service

# 2. Crie ambiente virtual
python3 -m venv venv

# 3. Ative ambiente
source venv/bin/activate

# 4. Instale dependências
pip install -r requirements.txt

# 5. Teste localmente
uvicorn src.main:app --host 0.0.0.0 --port 8000
```

### 2. Criar requirements.txt

```txt
# apps/ai-service/requirements.txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
pydantic-settings==2.1.0
python-multipart==0.0.6
scikit-learn==1.3.2
pandas==2.1.3
numpy==1.26.2
joblib==1.3.2
python-dotenv==1.0.0
```

### 3. Configurar PM2 para Python

```bash
# 1. Instale PM2 Python support
pm2 install pm2-python

# 2. Crie script de inicialização
cat > ~/fayol/apps/ai-service/start.sh << 'EOF'
#!/bin/bash
cd ~/fayol/apps/ai-service
source venv/bin/activate
uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 2
EOF

chmod +x ~/fayol/apps/ai-service/start.sh

# 3. Inicie com PM2
pm2 start ~/fayol/apps/ai-service/start.sh --name fayol-ai

# 4. Verifique
pm2 logs fayol-ai
curl http://localhost:8000/health
```

### 4. Alternativa: Usar Gunicorn

```bash
# 1. Instale gunicorn
pip install gunicorn

# 2. Inicie com PM2
cd ~/fayol/apps/ai-service
pm2 start "gunicorn -w 2 -k uvicorn.workers.UvicornWorker src.main:app --bind 0.0.0.0:8000" --name fayol-ai

# 3. Salve configuração
pm2 save
```

---

## 🔒 Configuração de SSL/HTTPS

### 1. Instalar SSL via cPanel

1. **Acesse SSL/TLS Status**
   ```
   cPanel → Security → SSL/TLS Status
   ```

2. **Instalar Let's Encrypt (Gratuito)**
   - Selecione todos os domínios:
     - `seudominio.com`
     - `www.seudominio.com`
     - `api.seudominio.com`
     - `admin.seudominio.com`
     - `ai.seudominio.com`
   - Clique em "Run AutoSSL"
   - Aguarde instalação (2-5 minutos)

3. **Verificar Certificados**
   ```
   cPanel → Security → SSL/TLS
   ```
   - Todos os domínios devem ter "Valid SSL"

### 2. Forçar HTTPS

Adicione em `.htaccess` da raiz (`public_html/.htaccess`):

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## 🌍 Configuração de Domínios e Subdomínios

### 1. Criar Subdomínios

#### Via cPanel

1. **Acessar Subdomains**
   ```
   cPanel → Domains → Subdomains
   ```

2. **Criar Subdomínio: api**
   - **Subdomain**: `api`
   - **Domain**: `seudominio.com`
   - **Document Root**: `/home/usuario/fayol-api` (deixe vazio por ora)
   - Clique em "Create"

3. **Criar Subdomínio: admin**
   - **Subdomain**: `admin`
   - **Domain**: `seudominio.com`
   - **Document Root**: `/home/usuario/public_html/admin`
   - Clique em "Create"

4. **Criar Subdomínio: ai**
   - **Subdomain**: `ai`
   - **Domain**: `seudominio.com`
   - **Document Root**: `/home/usuario/fayol-ai` (deixe vazio)
   - Clique em "Create"

### 2. Configurar Proxy Reverso (Backend e AI)

#### Para api.seudominio.com

Crie `/home/usuario/public_html/api/.htaccess`:

```apache
RewriteEngine On

# Proxy para backend Node.js (porta 3000)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]

# Headers
<IfModule mod_headers.c>
  Header set X-Powered-By "Fayol API"
  Header set Access-Control-Allow-Origin "*"
  Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>
```

#### Para ai.seudominio.com

Crie `/home/usuario/public_html/ai/.htaccess`:

```apache
RewriteEngine On

# Proxy para serviço AI Python (porta 8000)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:8000/$1 [P,L]

# Headers
<IfModule mod_headers.c>
  Header set X-Powered-By "Fayol AI Service"
</IfModule>
```

**Nota**: Se o módulo `mod_proxy` não estiver habilitado, **contate o suporte da hospedagem** para habilitá-lo.

### 3. Alternativa: Usar Aplicação Node.js do cPanel

Se o cPanel tem "Setup Node.js App":

1. **Para api.seudominio.com**
   - Domain: `api.seudominio.com`
   - Application Root: `fayol/apps/backend`
   - Application URL: `/`
   - Startup File: `dist/main.js`

2. **Para ai.seudominio.com**
   - Infelizmente, cPanel Node.js não suporta Python
   - Use proxy reverso conforme acima

---

## 🔐 Variáveis de Ambiente

### Checklist de Variáveis Obrigatórias

```bash
# Backend (.env)
✅ NODE_ENV=production
✅ PORT=3000
✅ DATABASE_URL=postgresql://...
✅ JWT_SECRET=...
✅ JWT_EXPIRES_IN=1h
✅ REDIS_HOST=localhost
✅ REDIS_PORT=6379
✅ REDIS_PASSWORD=...
✅ CORS_ORIGIN=https://admin.seudominio.com
✅ AI_SERVICE_URL=https://ai.seudominio.com

# Admin Panel (.env.production.local)
✅ NEXT_PUBLIC_API_URL=https://api.seudominio.com
✅ NEXT_PUBLIC_APP_NAME=Fayol

# AI Service (.env)
✅ API_BASE_URL=https://api.seudominio.com
```

### Carregar Variáveis no PM2

```bash
# Opção 1: Via arquivo .env (PM2 carrega automaticamente)
pm2 restart fayol-backend --update-env

# Opção 2: Via linha de comando
pm2 restart fayol-backend --env production

# Opção 3: Definir variável específica
pm2 set fayol-backend:env NODE_ENV production
```

---

## 🧪 Testes de Produção

### 1. Health Checks

```bash
# Backend
curl https://api.seudominio.com/api/v1/health
# Resposta esperada: {"status":"ok","timestamp":"..."}

# AI Service
curl https://ai.seudominio.com/health
# Resposta esperada: {"status":"healthy"}

# Admin Panel
curl -I https://admin.seudominio.com
# Resposta esperada: HTTP/2 200
```

### 2. Teste de Login

```bash
# Registrar usuário
curl -X POST https://api.seudominio.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste Produção",
    "email": "teste@teste.com",
    "phone": "11999999999",
    "password": "Teste@123"
  }'

# Login
curl -X POST https://api.seudominio.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@teste.com",
    "password": "Teste@123"
  }'
```

### 3. Teste de Transação

```bash
TOKEN="seu-access-token-aqui"

# Criar conta
curl -X POST https://api.seudominio.com/api/v1/accounts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Conta Teste",
    "type": "checking",
    "initialBalance": 1000
  }'

# Listar contas
curl https://api.seudominio.com/api/v1/accounts \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Teste de IA

```bash
TOKEN="seu-access-token-aqui"

# Sugerir categoria
curl -X POST https://ai.seudominio.com/suggest-category \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description": "Almoço no restaurante"}'
```

---

## 📊 Monitoramento e Logs

### 1. PM2 Monitoring

```bash
# Status de todos os processos
pm2 status

# Logs em tempo real
pm2 logs

# Logs de um processo específico
pm2 logs fayol-backend

# Monitoramento (CPU, RAM)
pm2 monit

# Dashboard web (opcional)
pm2 web
# Acesse: http://seudominio.com:9615
```

### 2. Configurar Logs Persistentes

```bash
# 1. Instalar PM2 Logrotate
pm2 install pm2-logrotate

# 2. Configurar rotação
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### 3. Logs do Backend

```bash
# Ver logs
tail -f ~/fayol/apps/backend/logs/out.log
tail -f ~/fayol/apps/backend/logs/err.log

# Logs do dia
grep "$(date +%Y-%m-%d)" ~/fayol/apps/backend/logs/out.log
```

### 4. Configurar Alertas

Instale PM2 Plus (opcional, pago):

```bash
pm2 link [secret-key] [public-key]
```

Ou configure notificações por email via script bash:

```bash
# ~/fayol/scripts/check-health.sh
#!/bin/bash

BACKEND_URL="https://api.seudominio.com/api/v1/health"
EMAIL="seu-email@gmail.com"

if ! curl -f -s "$BACKEND_URL" > /dev/null; then
  echo "Backend está offline!" | mail -s "ALERTA: Fayol Backend DOWN" "$EMAIL"
fi
```

Adicione ao cron:

```bash
crontab -e

# Executar a cada 5 minutos
*/5 * * * * /home/usuario/fayol/scripts/check-health.sh
```

---

## 💾 Backup e Recuperação

### 1. Backup Automático do Banco

```bash
# Criar script de backup
cat > ~/fayol/scripts/backup-db.sh << 'EOF'
#!/bin/bash

BACKUP_DIR=~/fayol-backups
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="fayol_production"
DB_USER="fayol_user"
DB_PASS="sua-senha"

mkdir -p $BACKUP_DIR

# Backup PostgreSQL
PGPASSWORD=$DB_PASS pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/fayol_$DATE.sql.gz

# Manter apenas últimos 7 backups
ls -t $BACKUP_DIR/fayol_*.sql.gz | tail -n +8 | xargs rm -f

echo "Backup concluído: fayol_$DATE.sql.gz"
EOF

chmod +x ~/fayol/scripts/backup-db.sh
```

### 2. Agendar Backup Diário

```bash
crontab -e

# Backup diário às 3h da manhã
0 3 * * * /home/usuario/fayol/scripts/backup-db.sh
```

### 3. Backup Manual via cPanel

1. **PostgreSQL**
   ```
   cPanel → Databases → PostgreSQL Databases → phpPgAdmin
   ```
   - Selecione `fayol_production`
   - Export → SQL
   - Download

2. **Arquivos**
   ```
   cPanel → Files → Backup
   ```
   - Download Home Directory
   - Ou apenas `/fayol`

### 4. Restaurar Backup

```bash
# Restaurar banco de dados
gunzip -c ~/fayol-backups/fayol_20250112_030000.sql.gz | \
  PGPASSWORD=sua-senha psql -U fayol_user -h localhost fayol_production
```

---

## 🔧 Troubleshooting

### Problema 1: "Cannot connect to database"

**Solução:**

```bash
# 1. Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# 2. Testar conexão
psql -U fayol_user -h localhost -d fayol_production

# 3. Verificar DATABASE_URL no .env
cat ~/fayol/apps/backend/.env | grep DATABASE_URL

# 4. Verificar credenciais no cPanel
# cPanel → Databases → PostgreSQL Databases
```

### Problema 2: "Port 3000 already in use"

**Solução:**

```bash
# 1. Verificar processos na porta
lsof -i :3000

# 2. Matar processo
kill -9 [PID]

# Ou
pm2 delete all
pm2 start ecosystem.config.js
```

### Problema 3: "502 Bad Gateway" no domínio

**Solução:**

```bash
# 1. Verificar se aplicação está rodando
pm2 status

# 2. Verificar logs
pm2 logs fayol-backend --lines 100

# 3. Reiniciar aplicação
pm2 restart fayol-backend

# 4. Verificar proxy reverso
cat /home/usuario/public_html/api/.htaccess

# 5. Testar porta local
curl http://localhost:3000/api/v1/health
```

### Problema 4: "Module not found" após deploy

**Solução:**

```bash
# 1. Limpar node_modules
rm -rf ~/fayol/node_modules

# 2. Reinstalar
cd ~/fayol
pnpm install

# 3. Rebuild
pnpm build

# 4. Reiniciar
pm2 restart all
```

### Problema 5: "CORS Error" no frontend

**Solução:**

```bash
# 1. Verificar CORS_ORIGIN no backend
cat ~/fayol/apps/backend/.env | grep CORS_ORIGIN

# 2. Adicionar domínio do admin
CORS_ORIGIN=https://admin.seudominio.com,https://seudominio.com

# 3. Reiniciar backend
pm2 restart fayol-backend
```

### Problema 6: SSL Certificate Error

**Solução:**

```bash
# 1. Reemitir certificado SSL
# cPanel → Security → SSL/TLS Status → Run AutoSSL

# 2. Verificar .htaccess force HTTPS
cat /home/usuario/public_html/.htaccess

# 3. Limpar cache do navegador
# Ctrl + Shift + Delete

# 4. Testar com curl
curl -I https://api.seudominio.com
```

### Problema 7: High Memory Usage

**Solução:**

```bash
# 1. Verificar uso de memória
pm2 status
free -h

# 2. Limitar memória no PM2
pm2 restart fayol-backend --max-memory-restart 300M

# 3. Reduzir instances
# ecosystem.config.js: instances: 1

# 4. Configurar swap (se permitido)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Problema 8: Telegram Bot não recebe mensagens

**Solução:**

```bash
# 1. Verificar webhook
curl https://api.telegram.org/bot[TOKEN]/getWebhookInfo

# 2. Configurar webhook
curl -X POST https://api.telegram.org/bot[TOKEN]/setWebhook \
  -d "url=https://api.seudominio.com/telegram/webhook"

# 3. Verificar logs
pm2 logs fayol-backend | grep telegram
```

---

## 📝 Checklist Final de Deploy

### Pré-Deploy

- [ ] Backup local do projeto
- [ ] Todas as dependências instaladas
- [ ] Builds de produção gerados
- [ ] Variáveis de ambiente configuradas
- [ ] Credenciais seguras geradas
- [ ] Domínios/subdomínios registrados

### Deploy

- [ ] Servidor cPanel configurado
- [ ] Node.js instalado (v18+)
- [ ] Python instalado (3.9+)
- [ ] PostgreSQL criado e configurado
- [ ] Redis instalado e rodando
- [ ] Backend deployado e rodando
- [ ] Admin Panel deployado
- [ ] Serviço de IA deployado
- [ ] SSL instalado em todos os domínios
- [ ] Proxy reverso configurado

### Pós-Deploy

- [ ] Migrations executadas
- [ ] Seed executado
- [ ] Health checks passando
- [ ] Login funcionando
- [ ] Transações funcionando
- [ ] Bot Telegram funcionando
- [ ] Backup automático configurado
- [ ] Monitoramento ativo
- [ ] Logs rodando
- [ ] Documentação atualizada

---

## 🎉 Deploy Completo!

Seu projeto Fayol está agora em produção!

### URLs de Acesso

- **API**: https://api.seudominio.com
- **Admin Panel**: https://admin.seudominio.com
- **Docs API**: https://api.seudominio.com/api/docs
- **AI Service**: https://ai.seudominio.com

### Credenciais Admin Padrão

```
Email: admin@fayol.app
Senha: admin@123
```

⚠️ **IMPORTANTE**: Altere a senha padrão imediatamente após primeiro login!

---

## 📞 Suporte

- **Documentação**: `docs/`
- **Issues**: GitHub Issues
- **Email**: suporte@seudominio.com

---

**Última atualização**: 2025-10-12
**Versão**: 1.0.0
