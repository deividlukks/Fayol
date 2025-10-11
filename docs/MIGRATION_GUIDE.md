# 🔄 Aplicando as Mudanças do Schema

Após a refatoração dos seeds, é necessário aplicar as mudanças no schema do banco de dados.

## 📋 Mudanças Realizadas

1. ✅ Adicionado índice único composto em `Category`: `@@unique([name, type])`
2. ✅ Adicionado índice único composto em `Subcategory`: `@@unique([name, categoryId])`

Estas mudanças permitem que os seeds usem `upsert` de forma eficiente e segura.

---

## 🚀 Como Aplicar

### Opção 1: Criar Nova Migration (RECOMENDADO)

```bash
# 1. Ir para o diretório do backend
cd apps/backend

# 2. Criar e aplicar a migration
pnpm prisma migrate dev --name add_unique_constraints_for_seeds

# 3. Executar os seeds
pnpm prisma db seed
```

### Opção 2: Reset Completo (Desenvolvimento)

Se você está em ambiente de desenvolvimento e pode perder os dados:

```bash
# ⚠️ ATENÇÃO: Isto apaga TODOS os dados!
pnpm prisma migrate reset

# Este comando:
# 1. Apaga o banco de dados
# 2. Recria todas as tabelas com as novas constraints
# 3. Executa os seeds automaticamente
```

### Opção 3: Aplicar Manualmente (Produção)

Se você já tem dados em produção e precisa manter:

```bash
# 1. Gerar a migration sem aplicar
pnpm prisma migrate dev --create-only --name add_unique_constraints_for_seeds

# 2. Revisar o SQL gerado em:
# prisma/migrations/[timestamp]_add_unique_constraints_for_seeds/migration.sql

# 3. Verificar se há conflitos de dados existentes

# 4. Aplicar a migration
pnpm prisma migrate deploy
```

---

## ✅ Verificação

Após aplicar as mudanças, verifique se tudo está correto:

```bash
# 1. Abrir Prisma Studio
pnpm prisma:studio

# 2. Verificar se as tabelas categories e subcategories existem

# 3. Executar os seeds
pnpm prisma db seed

# 4. Verificar no Prisma Studio se os dados foram criados
```

---

## 🔍 SQL Esperado da Migration

A migration deve conter algo similar a:

```sql
-- CreateIndex
CREATE UNIQUE INDEX "name_type" ON "categories"("name", "type");

-- CreateIndex
CREATE UNIQUE INDEX "name_categoryId" ON "subcategories"("name", "categoryId");
```

---

## 📊 Próximos Passos

Após aplicar as migrations e seeds:

1. ✅ Testar login no admin panel (admin@fayol.app / admin@123)
2. ✅ Verificar categorias disponíveis
3. ✅ Criar uma transação de teste
4. ✅ **Alterar a senha padrão do admin!**

---

**Última atualização:** 11/10/2025
