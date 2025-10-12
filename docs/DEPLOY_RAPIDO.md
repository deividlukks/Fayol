# 🚀 Deploy Rápido - Fayol em cPanel

> Guia condensado para deploy rápido. Para detalhes completos, consulte [GUIA_PRODUCAO_CPANEL.md](./GUIA_PRODUCAO_CPANEL.md)

---

## ⚡ Passo a Passo Rápido

### 1️⃣ Preparar Localmente (5 min)

```bash
# Build do projeto
cd C:\Users\Deivid Lucas\Documents\Projetos\Fayol
pnpm install
pnpm build

# Criar .env.production
cp .env.example .env.production
# Edite .env.production com suas credenciais

# Compactar
# Use WinRAR/7zip ou:
Compress-Archive -Path apps,packages,scripts,.env.production,package.json,pnpm-lock.yaml -DestinationPath fayol.zip
```

### 2️⃣ Configurar cPanel (10 min)

1. **Criar Banco PostgreSQL**
   - cPanel → PostgreSQL Databases
   - Nome: `fayol_production`
   - Usuário: `fayol_user`
   - Senha forte (anotar!)

2. **Criar Subdomínios**
   - `api.seudominio.com`
   - `admin.seudominio.com`
   - `ai.seudominio.com`

3. **Instalar SSL**
   - cPanel → SSL/TLS Status
   - Run AutoSSL (para todos os domínios)

### 3️⃣ Upload e Deploy via SSH (15 min)

```bash
# Conectar via SSH
ssh usuario@seudominio.com

# Instalar Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20

# Instalar ferramentas
npm install -g pnpm pm2

# Upload e extrair projeto
cd ~
# (fazer upload do fayol.zip via File Manager)
unzip fayol.zip
cd fayol

# Instalar dependências
pnpm install --prod

# Configurar banco
cd apps/backend
export DATABASE_URL="postgresql://fayol_user:SENHA@localhost:5432/fayol_production"
pnpm prisma migrate deploy
pnpm prisma db seed

# Iniciar backend
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# Verificar
pm2 status
curl http://localhost:3000/api/v1/health
```

### 4️⃣ Configurar Proxy Reverso (5 min)

Criar `/home/usuario/public_html/api/.htaccess`:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
```

### 5️⃣ Deploy Admin Panel (5 min)

```bash
# Opção A: Static Export (Recomendado)
cd ~/fayol/apps/admin-panel
pnpm build
# Copie conteúdo de 'out/' para public_html/admin/

# Opção B: Servidor Next.js
PORT=3001 pm2 start npm --name fayol-admin -- start
```

### 6️⃣ Deploy AI Service (5 min)

```bash
cd ~/fayol/apps/ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

pm2 start "gunicorn -w 2 -k uvicorn.workers.UvicornWorker src.main:app --bind 0.0.0.0:8000" --name fayol-ai
pm2 save
```

---

## ✅ Verificação Final

```bash
# Health checks
curl https://api.seudominio.com/api/v1/health
curl https://ai.seudominio.com/health
curl -I https://admin.seudominio.com

# Status PM2
pm2 status
pm2 logs --lines 50

# Acessar
# Admin: https://admin.seudominio.com
# Login: admin@fayol.app / admin@123
```

---

## 🔧 Scripts Úteis

```bash
# Deploy automático
./scripts/deploy.sh

# Backup do banco
DB_PASS=senha ./scripts/backup-db.sh

# Health check
./scripts/health-check.sh

# Ver logs
pm2 logs fayol-backend --lines 100
tail -f ~/fayol/apps/backend/logs/out.log
```

---

## 🆘 Problemas Comuns

### Backend não inicia
```bash
# Verificar logs
pm2 logs fayol-backend

# Reiniciar
pm2 restart fayol-backend

# Verificar porta
lsof -i :3000
```

### 502 Bad Gateway
```bash
# Verificar se app está rodando
pm2 status

# Testar localmente
curl http://localhost:3000/api/v1/health

# Verificar proxy
cat /home/usuario/public_html/api/.htaccess
```

### CORS Error
```bash
# Verificar CORS_ORIGIN no .env
cd ~/fayol/apps/backend
cat .env | grep CORS_ORIGIN

# Deve conter:
# CORS_ORIGIN=https://admin.seudominio.com
```

---

## 📋 Checklist de Deploy

- [ ] Banco de dados criado e configurado
- [ ] Subdomínios criados (api, admin, ai)
- [ ] SSL instalado em todos os domínios
- [ ] Node.js e Python instalados
- [ ] Projeto uploaded e dependências instaladas
- [ ] Migrations executadas
- [ ] Backend rodando (PM2)
- [ ] Admin Panel deployado
- [ ] AI Service rodando
- [ ] Proxy reverso configurado
- [ ] Health checks OK
- [ ] Backup automático configurado
- [ ] Senha admin alterada

---

## 📞 Documentação Completa

Para informações detalhadas, consulte:
- [GUIA_PRODUCAO_CPANEL.md](./GUIA_PRODUCAO_CPANEL.md) - Guia completo
- [02_GUIA_INSTALACAO.md](./02_GUIA_INSTALACAO.md) - Instalação desenvolvimento
- [04_DESENVOLVIMENTO.md](./04_DESENVOLVIMENTO.md) - Guia desenvolvimento

---

**Tempo estimado total**: 45-60 minutos

**Última atualização**: 2025-10-12
