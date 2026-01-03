# @fayol/database-models

Pacote de modelos de banco de dados do Fayol usando Prisma ORM 7.

## Prisma 7 - Mudanças Importantes

Este pacote foi atualizado para o **Prisma ORM 7**, que introduz mudanças significativas na arquitetura de conexão com o banco de dados.

### Principais Mudanças

#### 1. Driver Adapters são Padrão

No Prisma 7, driver adapters são obrigatórios para bancos relacionais. Utilizamos o `@prisma/adapter-pg` para PostgreSQL.

#### 2. Configuração de Conexão Migrada

**Antes (Prisma 6):**
```prisma
// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // ❌ Não funciona mais
}
```

**Agora (Prisma 7):**
```prisma
// schema.prisma
datasource db {
  provider = "postgresql"
  // url removida
}
```

```typescript
// prisma.config.ts
import { defineConfig, env } from 'prisma/config';
import 'dotenv/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
```

#### 3. Connection Pooling Gerenciado pelo Driver

**Mudança crítica:** O pooling de conexões agora é gerenciado pelo driver `pg`, não pelo Prisma Client.

**Prisma 6:**
```typescript
new PrismaClient({
  // Configurações de pool eram feitas aqui
})
```

**Prisma 7:**
```typescript
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                      // Máximo de conexões
  idleTimeoutMillis: 10000,     // Timeout para conexões inativas
  connectionTimeoutMillis: 0,   // Timeout para estabelecer conexão
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
```

### Variáveis de Ambiente

#### Migração de Variáveis

| Prisma 6 | Prisma 7 | Descrição |
|----------|----------|-----------|
| `DATABASE_POOL_SIZE` | `DATABASE_POOL_MAX` | Número máximo de conexões no pool |
| `DATABASE_CONNECTION_TIMEOUT` | `DATABASE_CONNECTION_TIMEOUT` | Timeout para estabelecer conexão (padrão mudou de 5000ms para 0) |
| N/A | `DATABASE_IDLE_TIMEOUT` | Nova: Timeout para fechar conexões inativas (padrão: 10000ms) |

#### Configuração Recomendada

```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/fayol_db?schema=public"
DATABASE_POOL_MAX=10
DATABASE_IDLE_TIMEOUT=10000
DATABASE_CONNECTION_TIMEOUT=0
```

**Padrões do Prisma 7 vs Prisma 6:**
- **Connection Timeout:** `0` (sem timeout) vs `5000ms` no Prisma 6
- **Idle Timeout:** `10000ms` vs `300000ms` no Prisma 6

### Scripts Disponíveis

```bash
# Gerar Prisma Client
pnpm run generate

# Criar migration
pnpm run migrate:dev

# Aplicar migrations em produção
pnpm run migrate:deploy

# Abrir Prisma Studio
pnpm run studio

# Popular banco de dados
pnpm run seed

# Validar schema
pnpm prisma validate
```

### Uso no Docker

O `docker-compose.yml` está configurado para usar o Prisma 7. Nenhuma alteração é necessária além de garantir que as variáveis de ambiente estejam corretas.

**Importante:** O script `start.sh` regenera o Prisma Client no container para garantir compatibilidade com o ambiente Linux/Debian.

### Dependências

```json
{
  "dependencies": {
    "@prisma/client": "7.0.0",
    "@prisma/adapter-pg": "7.0.0",
    "pg": "^8.13.1"
  },
  "devDependencies": {
    "prisma": "7.0.0",
    "@types/pg": "^8.11.10"
  }
}
```

### Referências

- [Upgrade to Prisma ORM 7](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)
- [Database connections](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections)
- [PostgreSQL database connector](https://www.prisma.io/docs/orm/overview/databases/postgresql)

## Estrutura de Dados

O schema define todos os modelos do sistema Fayol:

- **User** - Usuários do sistema
- **Account** - Contas bancárias
- **Category** - Categorias de transações
- **Transaction** - Transações financeiras
- **Budget** - Orçamentos
- **Investment** - Investimentos
- **Trade** - Operações de compra/venda
- **Goal** - Metas financeiras
- **Notification** - Notificações
- **AuditLog** - Logs de auditoria
- **UserConsent** - Consentimentos LGPD/GDPR
- **DataExportRequest** - Solicitações de exportação de dados

## Licença

MIT
