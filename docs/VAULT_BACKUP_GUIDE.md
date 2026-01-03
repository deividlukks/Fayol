# Guia: Vault & Backup Automático - Fayol

## 📋 Índice

1. [HashiCorp Vault](#hashicorp-vault)
2. [Backup Automático PostgreSQL](#backup-automático-postgresql)
3. [Scripts Disponíveis](#scripts-disponíveis)
4. [Troubleshooting](#troubleshooting)

---

## 🔐 HashiCorp Vault

### O que é?

O **HashiCorp Vault** é uma ferramenta de gerenciamento seguro de secrets (senhas, tokens, chaves API) que:

- ✅ Centraliza todos os secrets da aplicação
- ✅ Criptografa dados em repouso e em trânsito
- ✅ Fornece controle de acesso granular
- ✅ Audita todo acesso aos secrets
- ✅ Rotação automática de credenciais

### Configuração

#### Variáveis de Ambiente (.env)

```bash
# HashiCorp Vault
VAULT_PORT=8200
VAULT_ROOT_TOKEN=fayol-dev-root-token  # MUDAR EM PRODUÇÃO!
VAULT_ADDR=http://localhost:8200
```

#### Iniciar Vault

```bash
# Subir apenas o Vault
docker-compose up -d vault

# Aguardar ~10s e verificar status
docker logs fayol_vault

# Acessar UI
# URL: http://localhost:8200/ui
# Token: fayol-dev-root-token
```

### Inicializar Secrets

```bash
# Executar script de inicialização
chmod +x scripts/vault/init-vault.sh
./scripts/vault/init-vault.sh

# Ou manualmente:
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=fayol-dev-root-token

# Habilitar secrets engine
docker exec -it fayol_vault vault secrets enable -version=2 -path=fayol kv

# Armazenar secrets
docker exec -it fayol_vault vault kv put fayol/database \
  host=postgres \
  port=5432 \
  database=fayol_db \
  username=fayol_admin \
  password=sua_senha_segura
```

### Estrutura de Secrets

```
fayol/
├── database          # PostgreSQL
│   ├── host
│   ├── port
│   ├── database
│   ├── username
│   ├── password
│   └── url
├── redis             # Redis
│   ├── host
│   ├── port
│   └── password
├── jwt               # Autenticação
│   ├── access_secret
│   ├── refresh_secret
│   ├── access_ttl
│   └── refresh_ttl
├── api-keys          # APIs Externas
│   ├── telegram_bot_token
│   ├── openai_api_key
│   └── sentry_dsn
└── encryption        # Criptografia
    ├── app_secret
    └── cookie_secret
```

### Comandos Úteis

```bash
# Listar todos os secrets
docker exec -it fayol_vault vault kv list fayol

# Ler um secret específico
docker exec -it fayol_vault vault kv get fayol/database
docker exec -it fayol_vault vault kv get fayol/jwt

# Atualizar um secret
docker exec -it fayol_vault vault kv put fayol/database password=nova_senha

# Deletar um secret
docker exec -it fayol_vault vault kv delete fayol/api-keys

# Ver histórico de versões
docker exec -it fayol_vault vault kv metadata get fayol/database
```

### Integração com Aplicação

#### Node.js / NestJS

```typescript
import * as vault from 'node-vault';

const vaultClient = vault({
  apiVersion: 'v1',
  endpoint: process.env.VAULT_ADDR || 'http://localhost:8200',
  token: process.env.VAULT_TOKEN,
});

// Ler secret
const { data } = await vaultClient.read('fayol/data/database');
const dbPassword = data.data.password;

// Escrever secret
await vaultClient.write('fayol/data/api-keys', {
  data: {
    openai_key: 'sk-...',
  },
});
```

#### Python

```python
import hvac

client = hvac.Client(
    url=os.getenv('VAULT_ADDR', 'http://localhost:8200'),
    token=os.getenv('VAULT_TOKEN')
)

# Ler secret
secret = client.secrets.kv.v2.read_secret_version(
    path='database',
    mount_point='fayol'
)
db_password = secret['data']['data']['password']

# Escrever secret
client.secrets.kv.v2.create_or_update_secret(
    path='api-keys',
    secret={'openai_key': 'sk-...'},
    mount_point='fayol'
)
```

### Segurança - Produção

**⚠️ IMPORTANTE:** A configuração atual é para **desenvolvimento**.

Para produção:

1. **Não use modo `-dev`**
   ```yaml
   # docker-compose.prod.yml
   vault:
     command: server
     # Remove: -dev -dev-root-token-id=...
   ```

2. **Configure backend seguro**
   ```hcl
   # configs/vault/vault-prod.hcl
   storage "consul" {
     address = "consul:8500"
     path    = "vault/"
   }
   # Ou use: raft, s3, azure, gcs
   ```

3. **Habilite TLS**
   ```hcl
   listener "tcp" {
     address     = "0.0.0.0:8200"
     tls_cert_file = "/vault/tls/vault.crt"
     tls_key_file  = "/vault/tls/vault.key"
   }
   ```

4. **Inicialize e unseal manualmente**
   ```bash
   vault operator init
   vault operator unseal
   ```

5. **Configure políticas de acesso**
   ```hcl
   path "fayol/data/database" {
     capabilities = ["read"]
   }
   ```

---

## 🗄️ Backup Automático PostgreSQL

### Configuração

O backup é gerenciado pelo container `postgres-backup` que usa a imagem `prodrigestivill/postgres-backup-local`.

#### Parâmetros (docker-compose.yml)

```yaml
postgres-backup:
  environment:
    SCHEDULE: '@daily'           # Frequência: @daily, @weekly, @hourly
    BACKUP_KEEP_DAYS: 7          # Mantém backups diários por 7 dias
    BACKUP_KEEP_WEEKS: 4         # Mantém backups semanais por 4 semanas
    BACKUP_KEEP_MONTHS: 6        # Mantém backups mensais por 6 meses
    POSTGRES_EXTRA_OPTS: -Z9 --schema=public --blobs
    # -Z9: Compressão máxima
    # --schema=public: Apenas schema público
    # --blobs: Inclui large objects
```

### Funcionamento

- **Backup Diário**: Todo dia às 01:00 AM (UTC)
- **Rotação Automática**:
  - Últimos 7 dias: backups diários
  - Últimas 4 semanas: 1 backup/semana
  - Últimos 6 meses: 1 backup/mês
  - Backups antigos são **automaticamente deletados**

### Localização dos Backups

```bash
# No volume Docker
docker volume inspect fayol-app_postgres_backups

# Backups ficam em:
/var/lib/docker/volumes/fayol-app_postgres_backups/_data/
├── daily/
│   ├── fayol_db-2025-01-31.sql.gz
│   ├── fayol_db-2025-01-30.sql.gz
│   └── ...
├── weekly/
│   ├── fayol_db-week-05-2025.sql.gz
│   └── ...
└── monthly/
    ├── fayol_db-2025-01.sql.gz
    └── ...
```

### Backup Manual

```bash
# Executar script de backup manual
chmod +x scripts/backup/backup-postgres.sh
./scripts/backup/backup-postgres.sh

# Backup será criado em: ./backups/fayol_backup_YYYYMMDD_HHMMSS.sql.gz
```

### Restore de Backup

```bash
# 1. Listar backups disponíveis
chmod +x scripts/backup/list-backups.sh
./scripts/backup/list-backups.sh

# 2. Escolher backup e restaurar
chmod +x scripts/backup/restore-postgres.sh
./scripts/backup/restore-postgres.sh backups/fayol_backup_20250131_120000.sql.gz

# ⚠️ ATENÇÃO: Isso sobrescreverá o banco atual!
# Você precisará digitar 'CONFIRMO' para prosseguir
```

### Comandos Úteis

```bash
# Ver logs do backup automático
docker logs fayol_postgres_backup

# Forçar backup manual (via container)
docker exec fayol_postgres_backup /backup.sh

# Listar backups no volume
docker run --rm -v fayol-app_postgres_backups:/backups alpine ls -lh /backups/

# Copiar backup do volume para host
docker cp fayol_postgres_backup:/backups/daily/latest.sql.gz ./my-backup.sql.gz

# Restaurar backup específico
gunzip < backups/fayol_backup_20250131.sql.gz | \
  docker exec -i fayol_postgres psql -U fayol_admin -d postgres
```

### Estratégia de Backup Recomendada

#### Desenvolvimento
- ✅ Backup diário automático (configuração atual)
- ✅ Backup manual antes de migrations grandes

#### Staging
- ✅ Backup diário automático
- ✅ Backup antes de cada deploy
- ✅ Manter últimos 14 dias

#### Produção
- ✅ Backup a cada 6 horas
- ✅ Backup antes de cada deploy/migration
- ✅ Manter últimos 30 dias localmente
- ✅ Upload para S3/GCS (offsite backup)
- ✅ Teste de restore mensal

#### Configuração Produção

```yaml
# docker-compose.prod.yml
postgres-backup:
  environment:
    SCHEDULE: '0 */6 * * *'      # A cada 6 horas
    BACKUP_KEEP_DAYS: 30         # 30 dias de backups
    BACKUP_KEEP_WEEKS: 12        # 12 semanas
    BACKUP_KEEP_MONTHS: 12       # 12 meses

    # Backup offsite (S3)
    AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY}
    AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_KEY}
    AWS_DEFAULT_REGION: us-east-1
    BACKUP_S3_BUCKET: fayol-prod-backups
```

---

## 📝 Scripts Disponíveis

### Vault

| Script | Descrição | Uso |
|--------|-----------|-----|
| `scripts/vault/init-vault.sh` | Inicializa Vault com secrets | `./scripts/vault/init-vault.sh` |

### Backup PostgreSQL

| Script | Descrição | Uso |
|--------|-----------|-----|
| `scripts/backup/backup-postgres.sh` | Cria backup manual | `./scripts/backup/backup-postgres.sh` |
| `scripts/backup/restore-postgres.sh` | Restaura backup | `./scripts/backup/restore-postgres.sh <file>` |
| `scripts/backup/list-backups.sh` | Lista todos os backups | `./scripts/backup/list-backups.sh` |

---

## 🐛 Troubleshooting

### Vault

**Problema**: "connection refused" ao acessar Vault

```bash
# Verificar se está rodando
docker ps | grep vault

# Ver logs
docker logs fayol_vault

# Restart
docker-compose restart vault
```

**Problema**: "permission denied" ao executar comandos

```bash
# Verificar token
echo $VAULT_TOKEN

# Reexportar
export VAULT_TOKEN=fayol-dev-root-token
```

**Problema**: Vault em estado "sealed" (produção)

```bash
# Unseal com 3 chaves (exemplo)
vault operator unseal <key1>
vault operator unseal <key2>
vault operator unseal <key3>
```

### Backup

**Problema**: Backup não está sendo criado automaticamente

```bash
# Ver logs do container de backup
docker logs fayol_postgres_backup -f

# Verificar variáveis de ambiente
docker exec fayol_postgres_backup env | grep POSTGRES

# Forçar backup manual para debug
docker exec fayol_postgres_backup /backup.sh
```

**Problema**: Erro "database does not exist" no restore

```bash
# O backup inclui CREATE DATABASE
# Restaure para o database 'postgres' e não 'fayol_db'
gunzip < backup.sql.gz | docker exec -i fayol_postgres psql -U fayol_admin -d postgres
```

**Problema**: Espaço em disco cheio

```bash
# Ver espaço usado pelos backups
docker system df -v

# Limpar backups antigos manualmente
docker run --rm -v fayol-app_postgres_backups:/backups alpine \
  find /backups -name "*.sql.gz" -mtime +30 -delete
```

---

## 📚 Referências

- [HashiCorp Vault Documentation](https://developer.hashicorp.com/vault/docs)
- [postgres-backup-local Image](https://github.com/prodrigestivill/docker-postgres-backup-local)
- [PostgreSQL Backup & Restore](https://www.postgresql.org/docs/current/backup.html)

---

**Última atualização**: 2025-01-31
