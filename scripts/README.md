# Scripts - Fayol

Utilitários e automações para gerenciamento do projeto Fayol, organizados por
funcionalidade.

**✨ MIGRAÇÃO COMPLETA PARA NODE.JS** - Todos os scripts agora são
cross-platform (Windows, Linux, macOS).

## Estrutura de Pastas

```
scripts/
├── database/           # Scripts de configuração e conexão com banco de dados
├── environment/        # Scripts de gerenciamento de ambiente (inicialização, limpeza)
├── validation/         # Scripts de validação (variáveis de ambiente, dependências)
├── sync/               # Scripts de sincronização (versões, dependências, catálogo)
├── testing/            # Scripts de testes de carga e stress
├── backup/             # Scripts de backup do PostgreSQL
├── vault/              # Scripts do HashiCorp Vault
└── prisma/             # Scripts relacionados ao Prisma ORM
```

---

## 🚀 Quick Start

### Setup Inicial do Projeto

```bash
# 1. Validar ambiente
pnpm validate-env

# 2. Iniciar ambiente completo
pnpm env:start

# 3. (Opcional) Setup Vault + Backup
pnpm env:setup
```

### Rotina de Desenvolvimento

```bash
# Iniciar ambiente (modo rápido)
pnpm env:start:fast

# Criar backup
pnpm backup:create

# Debug Prisma
pnpm prisma:debug
```

---

## 📋 Comandos Disponíveis (package.json)

### Ambiente

- **`pnpm env:start`** - Inicializa ambiente completo
- **`pnpm env:start:fast`** - Modo rápido (pula build e migrations)
- **`pnpm env:setup`** - Setup completo: Vault + Backup automático

### Vault (Secrets Management)

- **`pnpm vault:init`** - Inicializa Vault com todos os secrets

### Backup & Restore

- **`pnpm backup:create`** - Cria backup manual do PostgreSQL
- **`pnpm backup:restore [arquivo]`** - Restaura backup
- **`pnpm backup:list`** - Lista backups disponíveis

### Prisma Debug & Performance

- **`pnpm prisma:debug`** - Inicia app com debug do Prisma
- **`pnpm prisma:analyze [log]`** - Analisa logs de queries
- **`pnpm prisma:audit`** - Auditoria completa de performance

### Database

- **`pnpm db:test`** - Testa conexão com banco de dados
- **`pnpm db:generate`** - Gera Prisma Client
- **`pnpm db:migrate`** - Aplica migrations
- **`pnpm db:seed`** - Popula banco com dados
- **`pnpm db:studio`** - Abre Prisma Studio

### Sincronização

- **`pnpm sync-catalog`** - Sincroniza dependências com catalog
- **`pnpm sync-catalog:fix`** - Converte para `catalog:`
- **`pnpm sync-catalog:add`** - Adiciona ao catalog

### Validação

- **`pnpm validate-env`** - Valida variáveis de ambiente
- **`pnpm validate-catalog`** - Valida dependências do catalog

---

## 📁 Detalhamento por Pasta

### Environment (Ambiente)

Scripts para inicializar e gerenciar o ambiente de desenvolvimento.

#### `start.js`

Inicializa todo o ambiente (PostgreSQL, Docker, Migrations).

```bash
pnpm env:start                    # Setup completo
pnpm env:start:fast               # Modo rápido
```

Opções:

- `--skip-build` - Pula build dos serviços Docker
- `--skip-migrations` - Pula migrations do Prisma
- `--fast` - Modo rápido (combina as duas opções)

#### `setup-vault-and-backup.js`

Configura Vault e sistema de backup automaticamente.

```bash
pnpm env:setup
```

O que faz:

1. Verifica dependências (Docker, Docker Compose)
2. Sobe infraestrutura (Postgres, Redis, Vault, Backup)
3. Inicializa Vault com secrets
4. Cria backup inicial

---

### Vault (HashiCorp Vault)

Scripts para gerenciamento de secrets.

#### `init-vault.js`

Inicializa o Vault com todos os secrets necessários.

```bash
pnpm vault:init
```

Secrets armazenados:

- `fayol/database` - Credenciais PostgreSQL
- `fayol/redis` - Credenciais Redis
- `fayol/jwt` - JWT access/refresh secrets
- `fayol/api-keys` - API keys (Telegram, OpenAI, Sentry)
- `fayol/encryption` - Chaves de criptografia

---

### Backup (PostgreSQL)

Scripts para backup e restore do banco de dados.

#### `backup-postgres.js`

Cria backup manual do PostgreSQL.

```bash
pnpm backup:create

# Output: ./backups/fayol_backup_20260103_235900.sql.gz
```

#### `restore-postgres.js`

Restaura backup do PostgreSQL.

```bash
# Listar backups disponíveis
pnpm backup:restore

# Restaurar backup específico
pnpm backup:restore backups/fayol_backup_20260103_235900.sql.gz
```

**⚠️ ATENÇÃO:** Esta operação SOBRESCREVE o banco de dados atual!

#### `list-backups.js`

Lista todos os backups disponíveis com detalhes.

```bash
pnpm backup:list
```

---

### Prisma (Debug & Performance)

Scripts para debug e análise de performance do Prisma.

#### `debug-queries.js`

Inicia aplicação com diferentes níveis de logging.

```bash
pnpm prisma:debug
```

Modos disponíveis:

1. Query Logging - Log todas as queries SQL
2. Error Logging - Log apenas erros
3. Info Logging - Log informações gerais
4. Warn Logging - Log warnings
5. All Logging - Log TUDO
6. Performance Tracing - Analisa performance

#### `analyze-queries.js`

Analisa logs de queries do Prisma.

```bash
# Capturar logs primeiro
DEBUG="prisma:query" pnpm run dev 2>&1 | tee prisma-queries.log

# Analisar
pnpm prisma:analyze prisma-queries.log
```

Identifica:

- Queries mais executadas
- Queries lentas
- Possíveis N+1 queries
- Estatísticas de uso

#### `audit-performance.js`

Auditoria completa de performance do Prisma.

```bash
pnpm prisma:audit
```

Verifica:

- Schema validation
- Migrations pendentes
- Índices e relações
- Estatísticas do schema
- Recomendações de otimização

---

### Database (Banco de Dados)

Scripts para configuração e testes.

#### `test-db-connection.js`

Testa conexão com PostgreSQL e exibe informações.

```bash
pnpm db:test
```

Exibe:

- Versão do PostgreSQL
- Database e usuário atual
- Contagem de registros (users, categories)

Scripts SQL:

- `setup-database.sql` - SQL para criação do banco e usuário
- `create-fayol-db.sql` - SQL para criar banco fayol_db
- `setup-db.ps1` - Setup do PostgreSQL nativo (Windows)

---

### Sync (Sincronização)

Scripts para manter versões e dependências sincronizadas.

#### `sync-version.js`

Sincroniza versões em todos os package.json (Node.js + Python).

```bash
# Definir versão específica
node scripts/sync/sync-version.js 1.0.0

# Incrementar versão
node scripts/sync/sync-version.js --patch        # 0.1.0 -> 0.1.1
node scripts/sync/sync-version.js --minor        # 0.1.0 -> 0.2.0
node scripts/sync/sync-version.js --major        # 0.1.0 -> 1.0.0

# Criar git tag
node scripts/sync/sync-version.js 1.0.0 --tag

# Simular sem modificar
node scripts/sync/sync-version.js 1.0.0 --dry-run
```

#### `sync-catalog.js`

Sincroniza dependências com o catalog do PNPM.

```bash
pnpm sync-catalog              # Apenas reporta diferenças
pnpm sync-catalog:fix          # Converte para catalog:
pnpm sync-catalog:add          # Adiciona ao catalog e converte
```

#### `sync-python-deps.js`

Sincroniza dependências Python entre serviços.

```bash
node scripts/sync/sync-python-deps.js
node scripts/sync/sync-python-deps.js --check
node scripts/sync/sync-python-deps.js --dry-run
```

---

### Validation (Validação)

Scripts para validar configurações.

#### `validate-env.js`

Valida variáveis de ambiente e arquivo .env.

```bash
pnpm validate-env
pnpm validate-env:test
pnpm validate-env:prod
```

Verifica:

- Versão do Node.js (>= 20.0.0)
- Versão do PNPM (>= 9.0.0)
- Existência do arquivo .env
- Variáveis obrigatórias (DATABASE_URL, JWT_SECRET, etc.)
- Configurações do Prisma 7 (pool, timeouts)
- Docker (opcional)

#### `validate-catalog.js`

Valida dependências contra o catalog (CI/CD).

```bash
pnpm validate-catalog
```

Falha se encontrar dependências hardcoded.

---

### Testing (Testes)

Scripts para testes de carga e stress.

#### `ingestion-stress.js`

Teste de stress com K6 para ingestão de transações.

```bash
# Executar teste
k6 run scripts/testing/ingestion-stress.js

# Com variáveis customizadas
k6 run -e API_URL=http://localhost:3333/api \
       -e ADMIN_EMAIL=admin@fayol.app \
       scripts/testing/ingestion-stress.js
```

Cenário:

- Aquecimento: 50 usuários (30s)
- Carga Alta: 500 usuários (1m)
- **Stress: 1000 usuários (2m)**
- Arrefecimento: 0 usuários (30s)

Métricas:

- 95% das requisições < 2s
- Taxa de falha < 5%
- Queries do DB < 500ms (p95)

---

## 🔄 Migração para Node.js

### ✅ Benefícios

1. **Cross-platform nativo** - Funciona em Windows, Linux e macOS
2. **Manutenção única** - Um código ao invés de dois (.sh + .ps1)
3. **Melhor tratamento de erros** - APIs mais robustas
4. **Ecosystem rico** - Acesso a pacotes NPM
5. **Consistência** - Mesma linguagem do projeto

### ❌ Scripts Removidos

Os seguintes scripts foram **removidos** e substituídos por versões Node.js:

```
❌ *.sh  (Shell scripts)
❌ *.ps1 (PowerShell scripts)
✅ *.js  (Node.js - cross-platform)
```

Scripts migrados:

- `debug-queries.{sh,ps1}` → `debug-queries.js`
- `analyze-queries.{sh,ps1}` → `analyze-queries.js`
- `audit-performance.{sh,ps1}` → `audit-performance.js`
- `backup-postgres.{sh,ps1}` → `backup-postgres.js`
- `restore-postgres.{sh,ps1}` → `restore-postgres.js`
- `list-backups.{sh,ps1}` → `list-backups.js`
- `init-vault.{sh,ps1}` → `init-vault.js`
- `start.ps1` → `start.js`
- `setup-vault-and-backup.{sh,ps1}` → `setup-vault-and-backup.js`

---

## Notas Importantes

### PostgreSQL Nativo

O projeto usa PostgreSQL 18.1 rodando **nativamente** no Windows (não em
Docker).

- Localização: `C:\Program Files\PostgreSQL\18`
- Serviço: `postgresql-x64-18`
- Porta: 5432

### Pré-requisitos

- Node.js >= 20.0.0
- PNPM >= 9.0.0
- Docker (para alguns serviços)
- PostgreSQL 18.1

### Backup Automático

O Docker Compose inclui backup automático (container `fayol_postgres_backup`):

- Daily: 7 backups retidos
- Weekly: 4 backups retidos
- Monthly: 6 backups retidos

---

## Troubleshooting

### PostgreSQL não está rodando

```bash
# Windows
Get-Service postgresql-x64-18
Start-Service postgresql-x64-18

# Linux/Mac
sudo systemctl status postgresql
sudo systemctl start postgresql
```

### Docker não está rodando

O script `env:start` vai perguntar se deseja continuar sem Docker. Serviços
afetados: Redis, AI, BI, Vault

### Permissão negada (Windows - PowerShell antigos)

Não é mais necessário! Scripts Node.js não precisam de permissões especiais.

---

**Última atualização**: 2026-01-03

**Projeto Fayol** - Sistema Multiplataforma de Gestão Financeira com IA
