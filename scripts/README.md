# Scripts - Fayol

Utilitários e automações para gerenciamento do projeto Fayol, organizados por
funcionalidade.

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

## Database (Banco de Dados)

Scripts para configuração, setup e testes de conexão com o PostgreSQL.

### Scripts Disponíveis

- **`setup-db.ps1`** - Script principal de setup do PostgreSQL nativo (Windows)
- **`setup-database.sql`** - SQL para criação do banco e usuário
- **`setup-database.bat`** - Batch para executar setup via psql
- **`setup-postgres.bat`** - Configuração inicial do PostgreSQL
- **`create-fayol-db.sql`** - SQL para criar banco fayol_db
- **`create-db-temp.sql`** - SQL temporário para testes
- **`test-db-connection.js`** - Testa conexão com PostgreSQL (Node.js)
- **`test-db-connection.ts`** - Testa conexão com PostgreSQL (TypeScript)

**Uso:**

```bash
# Setup completo do banco (Windows)
.\scripts\database\setup-db.ps1

# Testar conexão
node scripts/database/test-db-connection.js
```

---

## Environment (Ambiente)

Scripts para inicializar, gerenciar e limpar o ambiente de desenvolvimento.

### Scripts Disponíveis

- **`start.ps1`** - Inicializa todo o ambiente (PostgreSQL, Docker, Migrations)

  ```powershell
  .\scripts\environment\start.ps1              # Setup completo
  .\scripts\environment\start.ps1 -Fast        # Pula build e migrations
  .\scripts\environment\start.ps1 -SkipBuild   # Pula apenas build
  ```

- **`nuke.ps1`** - Destroi completamente o ambiente (containers, volumes,
  node_modules)

  ```powershell
  .\scripts\environment\nuke.ps1               # Limpa tudo (confirmação necessária)
  .\scripts\environment\nuke.ps1 -DockerOnly   # Limpa apenas Docker
  .\scripts\environment\nuke.ps1 -NodeOnly     # Limpa apenas Node
  .\scripts\environment\nuke.ps1 -KeepData     # Preserva volumes Docker
  ```

- **`setup-vault-and-backup.ps1`** / **`.sh`** - Configura Vault e sistema de
  backup
- **`testes.ps1`** - Scripts de testes diversos

---

## Validation (Validação)

Scripts para validar configurações e dependências do projeto.

### Scripts Disponíveis

- **`validate-env.js`** - Valida variáveis de ambiente e arquivo .env

  ```bash
  node scripts/validation/validate-env.js
  ```

  Verifica:
  - Versão do Node.js (mínimo: v20.0.0)
  - Versão do PNPM (mínimo: v9.0.0)
  - Existência do arquivo .env
  - Variáveis obrigatórias (DATABASE_URL, JWT_SECRET, etc.)
  - Configurações do Prisma 7 (pool, timeouts)
  - Docker (opcional)

- **`validate-catalog.js`** - Valida dependências contra o catalog do PNPM
  ```bash
  node scripts/validation/validate-catalog.js
  ```

---

## Sync (Sincronização)

Scripts para manter versões e dependências sincronizadas no monorepo.

### Scripts Disponíveis

- **`sync-version.js`** - Sincroniza versões em todos os package.json

  ```bash
  # Definir versão específica
  node scripts/sync/sync-version.js 1.0.0

  # Incrementar versão (patch/minor/major)
  node scripts/sync/sync-version.js --patch        # 0.1.0 -> 0.1.1
  node scripts/sync/sync-version.js --minor        # 0.1.0 -> 0.2.0
  node scripts/sync/sync-version.js --major        # 0.1.0 -> 1.0.0

  # Criar git tag
  node scripts/sync/sync-version.js 1.0.0 --tag

  # Simular sem modificar
  node scripts/sync/sync-version.js 1.0.0 --dry-run
  ```

- **`sync-catalog.js`** - Sincroniza dependências com o catalog do PNPM

  ```bash
  # Apenas reportar
  node scripts/sync/sync-catalog.js

  # Converter para catalog:
  node scripts/sync/sync-catalog.js --fix

  # Adicionar ao catalog e converter
  node scripts/sync/sync-catalog.js --add

  # Modo verbose
  node scripts/sync/sync-catalog.js --verbose
  ```

- **`sync-python-deps.js`** - Sincroniza dependências Python entre serviços

---

## Testing (Testes)

Scripts para testes de carga, stress e performance.

### Scripts Disponíveis

- **`ingestion-stress.js`** - Teste de stress com K6 para ingestão de transações

  ```bash
  # Executar teste
  k6 run scripts/testing/ingestion-stress.js

  # Com variáveis customizadas
  k6 run -e API_URL=http://localhost:3333/api scripts/testing/ingestion-stress.js
  ```

  **Cenário:**
  - Aquecimento: 50 usuários (30s)
  - Carga Alta: 500 usuários (1m)
  - Stress: 1000 usuários (2m)
  - Arrefecimento: 0 usuários (30s)

  **Métricas:**
  - 95% das requisições < 2s
  - Taxa de falha < 5%
  - Queries do DB < 500ms (p95)

---

## Backup (PostgreSQL)

Scripts para backup e restore do banco de dados.

### Scripts Disponíveis

- **`backup-postgres.ps1`** / **`.sh`** - Cria backup manual do PostgreSQL

  ```bash
  # Criar backup
  ./scripts/backup/backup-postgres.sh

  # Output: ./backups/fayol_backup_20260102_235900.sql.gz
  ```

- **`restore-postgres.ps1`** / **`.sh`** - Restaura backup do PostgreSQL

  ```bash
  # Listar backups disponíveis
  ./scripts/backup/restore-postgres.sh

  # Restaurar backup específico
  ./scripts/backup/restore-postgres.sh backups/fayol_backup_20260102_235900.sql.gz
  ```

- **`list-backups.ps1`** / **`.sh`** - Lista todos os backups disponíveis
  ```bash
  ./scripts/backup/list-backups.sh
  ```

---

## Vault (HashiCorp Vault)

Scripts para gerenciamento de secrets com HashiCorp Vault.

### Scripts Disponíveis

- **`init-vault.ps1`** / **`.sh`** - Inicializa o Vault com secrets necessários

  ```bash
  # Inicializar Vault
  ./scripts/vault/init-vault.sh
  ```

  **O que faz:**
  - Habilita secrets engine KV v2 no path `fayol/`
  - Armazena secrets:
    - `fayol/database` - Credenciais PostgreSQL
    - `fayol/redis` - Credenciais Redis
    - `fayol/jwt` - Secrets JWT
    - `fayol/api-keys` - API keys externas
    - `fayol/encryption` - Chaves de criptografia

---

## Quick Start

### Setup Inicial do Projeto

```powershell
# 1. Validar ambiente
node scripts/validation/validate-env.js

# 2. Iniciar ambiente completo
.\scripts\environment\start.ps1

# 3. (Opcional) Inicializar Vault
.\scripts\vault\init-vault.ps1

# 4. (Opcional) Criar primeiro backup
.\scripts\backup\backup-postgres.ps1
```

### Rotina de Desenvolvimento

```powershell
# Iniciar ambiente (modo rápido)
.\scripts\environment\start.ps1 -Fast

# Sincronizar versão (após mudanças)
node scripts/sync/sync-version.js --patch

# Validar dependências
node scripts/validation/validate-catalog.js
```

### Limpeza Total

```powershell
# Limpar tudo (cuidado!)
.\scripts\environment\nuke.ps1

# Reiniciar do zero
.\scripts\environment\start.ps1
```

---

## Notas Importantes

### PostgreSQL Nativo

O projeto usa PostgreSQL 18.1 rodando **nativamente** no Windows (não em
Docker).

- Localização: `C:\Program Files\PostgreSQL\18`
- Serviço: `postgresql-x64-18`
- Porta: 5432

### Variáveis de Ambiente

Sempre valide o arquivo `.env` antes de iniciar:

```bash
node scripts/validation/validate-env.js
```

### Backup Automático

O Docker Compose inclui backup automático (container `fayol_postgres_backup`):

- Daily: 7 backups retidos
- Weekly: 4 backups retidos
- Monthly: 6 backups retidos

---

## Troubleshooting

### Permissão negada (Windows)

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### PostgreSQL não está rodando

```powershell
# Verificar serviço
Get-Service postgresql-x64-18

# Iniciar serviço
Start-Service postgresql-x64-18
```

### Docker não está rodando

```powershell
# O script start.ps1 vai perguntar se deseja continuar sem Docker
# Serviços afetados: Redis, AI, BI, Vault
```

### Limpar tudo e recomeçar

```powershell
.\scripts\environment\nuke.ps1
.\scripts\environment\start.ps1
```

---

**Última atualização**: 2026-01-02
