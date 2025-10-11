# 📁 Pasta Prisma - Backend Fayol

Documentação da estrutura de banco de dados e seeds do projeto.

---

## 📂 Estrutura de Arquivos

```
prisma/
├── 📄 schema.prisma           # Schema do banco de dados (modelos, relações, índices)
├── 📄 seed-all.ts             # ✅ Orquestrador principal de todos os seeds
├── 📄 SEEDS.md                # 📖 Documentação completa dos seeds
├── 📄 MIGRATION_GUIDE.md      # 🔄 Guia para aplicar migrations
├── 📄 README.md               # 📌 Este arquivo
│
├── 📁 seeds/                  # Seeds modulares e reutilizáveis
│   ├── index.ts               # Exporta todas as funções de seed
│   ├── categories.seed.ts     # Categorias e subcategorias do sistema
│   └── admin.seed.ts          # Admin, planos, versão e configurações
│
└── 📁 migrations/             # Histórico de migrações do banco de dados
    ├── migration_lock.toml
    └── [timestamps]/
        └── migration.sql
```

---

## 🚀 Quick Start

### 1️⃣ Configurar Banco de Dados

```bash
# Criar banco de dados e aplicar migrations
pnpm prisma migrate dev

# Abrir interface visual do banco
pnpm prisma:studio
```

### 2️⃣ Popular com Dados Iniciais

```bash
# Executar todos os seeds (categorias + admin + planos)
pnpm prisma db seed
```

### 3️⃣ Acessar o Sistema

```
🌐 Admin Panel: http://localhost:3001
📧 Email: admin@fayol.app
🔑 Senha: admin@123

⚠️  IMPORTANTE: Altere a senha padrão!
```

---

## 📚 Documentação Detalhada

| Documento | Descrição |
|-----------|-----------|
| [SEEDS.md](./SEEDS.md) | Guia completo dos seeds (categorias, admin, planos) |
| [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) | Como aplicar mudanças no schema |
| [schema.prisma](./schema.prisma) | Definição completa do banco de dados |

---

## 🛠️ Comandos Principais

### Migrations

```bash
# Criar e aplicar migration
pnpm prisma migrate dev

# Aplicar migrations em produção
pnpm prisma:migrate:prod

# Resetar banco (desenvolvimento)
pnpm prisma:reset
```

### Seeds

```bash
# Todos os seeds
pnpm prisma db seed

# Seeds individuais
pnpm prisma:seed:categories  # Apenas categorias
pnpm prisma:seed:admin       # Apenas admin e planos
```

### Utilitários

```bash
# Interface visual do banco
pnpm prisma:studio

# Regenerar Prisma Client
pnpm prisma:generate
```

---

## 📊 Modelos do Banco de Dados

### 👤 Autenticação e Usuários
- `User` - Usuários do sistema
- `Admin` - Administradores

### 💰 Financeiro
- `Account` - Contas bancárias e carteiras
- `Transaction` - Transações financeiras
- `RecurringTransaction` - Transações recorrentes
- `Category` - Categorias de transações
- `Subcategory` - Subcategorias

### 💳 Planos e Assinaturas
- `Plan` - Planos de assinatura (Free, Basic, Premium, Enterprise)
- `Subscription` - Assinaturas dos usuários
- `Payment` - Pagamentos
- `Invoice` - Faturas

### ⚙️ Sistema
- `SystemVersion` - Versões do sistema
- `SystemConfig` - Configurações globais
- `AuditLog` - Logs de auditoria

---

## 🔐 Dados Iniciais Criados pelos Seeds

### Categorias e Subcategorias
- **17 categorias** (4 receitas, 9 despesas, 4 investimentos)
- **69 subcategorias** distribuídas entre as categorias
- Todas marcadas como `isSystem: true` (não editáveis por usuários)

### Usuário Admin
- Email: `admin@fayol.app`
- Senha: `admin@123`
- Role: `super_admin`

### Planos de Assinatura
1. **Free** - R$ 0,00 (limitado)
2. **Basic** - R$ 9,90 (mais recursos)
3. **Premium** - R$ 29,90 (recursos avançados)
4. **Enterprise** - R$ 99,90 (completo + suporte)

---

## ⚠️ Notas Importantes

### Desenvolvimento
- Use `pnpm prisma:reset` livremente para resetar o banco
- Sempre execute seeds após reset
- Prisma Studio é seu amigo para debug visual

### Produção
- **NUNCA** use `prisma:reset` em produção
- Use `prisma:migrate:prod` para aplicar migrations
- **SEMPRE** altere a senha padrão do admin
- Faça backup antes de migrations críticas

---

## 🔗 Links Úteis

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Migrate Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)

---

## 📞 Suporte

Problemas com o banco de dados ou seeds?

1. Consulte [SEEDS.md](./SEEDS.md#troubleshooting) para troubleshooting
2. Verifique os logs de erro
3. Abra uma issue no repositório
4. Entre em contato com a equipe de desenvolvimento

---

**Última atualização:** 11/10/2025  
**Versão do Prisma:** 5.8.1  
**Banco de Dados:** PostgreSQL
