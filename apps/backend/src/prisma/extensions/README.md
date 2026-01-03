# Soft Delete Extension - Guia de Uso

## Visão Geral

A extensão de Soft Delete foi implementada usando **Prisma Client Extensions** (Prisma v7+) para substituir o middleware `$use()` que foi removido.

Esta extensão adiciona automaticamente comportamento de soft delete para modelos específicos que possuem o campo `deletedAt`.

## Modelos que Suportam Soft Delete

Os seguintes modelos têm soft delete habilitado:

- `user`
- `account`
- `category`
- `transaction`
- `budget`
- `investment`
- `notification`
- `trade`
- `goal`

## Comportamento Automático

### 1. Queries de Leitura

Todas as queries de leitura filtram automaticamente registros deletados (`deletedAt IS NULL`):

```typescript
// Automaticamente adiciona: WHERE deletedAt IS NULL
const users = await prisma.user.findMany();
const user = await prisma.user.findUnique({ where: { id: 1 } });
const firstUser = await prisma.user.findFirst({ where: { email: 'test@example.com' } });
```

### 2. Queries de Atualização

Atualizações só afetam registros não deletados:

```typescript
// Apenas atualiza registros com deletedAt IS NULL
await prisma.user.update({
  where: { id: 1 },
  data: { name: 'New Name' }
});

await prisma.user.updateMany({
  where: { status: 'active' },
  data: { updatedAt: new Date() }
});
```

### 3. Operações de Delete

Operações de delete são convertidas automaticamente para update com `deletedAt = NOW()`:

```typescript
// Convertido para: UPDATE ... SET deletedAt = NOW()
await prisma.user.delete({ where: { id: 1 } });

// Convertido para: UPDATE ... SET deletedAt = NOW() WHERE status = 'inactive'
await prisma.user.deleteMany({ where: { status: 'inactive' } });
```

## Métodos Adicionais

A extensão adiciona métodos úteis para trabalhar com soft delete:

### `restore()` - Restaurar Registros Deletados

Restaura registros que foram deletados (soft delete):

```typescript
// Restaura um único usuário
await prisma.user.restore({ where: { id: 1 } });

// Restaura múltiplos usuários
await prisma.user.restore({
  where: {
    deletedAt: { not: null },
    email: { contains: '@example.com' }
  }
});

// Retorna: { count: number }
```

### `forceDelete()` - Deletar Permanentemente

⚠️ **ATENÇÃO**: Esta operação é **irreversível**!

Deleta permanentemente registros do banco de dados:

```typescript
// Hard delete de um usuário
await prisma.user.forceDelete({ where: { id: 1 } });

// Hard delete de múltiplos registros
await prisma.user.forceDelete({
  where: {
    deletedAt: { not: null },
    createdAt: { lt: new Date('2023-01-01') }
  }
});

// Retorna: { count: number }
```

### `findManyWithDeleted()` - Buscar Incluindo Deletados

Busca registros **incluindo** os deletados (soft delete):

```typescript
// Retorna TODOS os usuários, incluindo deletados
const allUsers = await prisma.user.findManyWithDeleted();

// Com filtros
const allInactiveUsers = await prisma.user.findManyWithDeleted({
  where: { status: 'inactive' }
});
```

### `findManyDeleted()` - Buscar Apenas Deletados

Busca **apenas** registros deletados:

```typescript
// Retorna apenas usuários deletados
const deletedUsers = await prisma.user.findManyDeleted();

// Com filtros
const deletedAdmins = await prisma.user.findManyDeleted({
  where: { role: 'admin' }
});
```

## Casos de Uso Comuns

### 1. Listar todos os registros (incluindo deletados)

```typescript
const allTransactions = await prisma.transaction.findManyWithDeleted({
  orderBy: { createdAt: 'desc' }
});
```

### 2. Listar apenas registros deletados

```typescript
const deletedAccounts = await prisma.account.findManyDeleted({
  where: {
    deletedAt: {
      gte: new Date('2024-01-01'),
      lte: new Date('2024-12-31')
    }
  }
});
```

### 3. Restaurar registros deletados recentemente

```typescript
// Restaura contas deletadas nos últimos 30 dias
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

await prisma.account.restore({
  where: {
    deletedAt: { gte: thirtyDaysAgo }
  }
});
```

### 4. Limpar registros muito antigos (hard delete)

```typescript
// Deleta permanentemente registros deletados há mais de 1 ano
const oneYearAgo = new Date();
oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

await prisma.user.forceDelete({
  where: {
    deletedAt: { lte: oneYearAgo }
  }
});
```

### 5. Deletar explicitamente um registro (soft delete)

```typescript
// Soft delete de um usuário
await prisma.user.delete({ where: { id: userId } });

// Verificar se foi deletado
const user = await prisma.user.findUnique({ where: { id: userId } });
console.log(user); // null (não encontrado devido ao filtro automático)

// Buscar incluindo deletados
const userWithDeleted = await prisma.user.findManyWithDeleted({
  where: { id: userId }
});
console.log(userWithDeleted[0].deletedAt); // Data da deleção
```

## Override Manual do Filtro de Soft Delete

Se você precisar **explicitamente** incluir registros deletados em uma query específica, use `findManyWithDeleted()`:

```typescript
// ❌ Não funciona (filtro automático)
const users = await prisma.user.findMany({
  where: { deletedAt: { not: null } }
});

// ✅ Correto
const deletedUsers = await prisma.user.findManyDeleted();

// ✅ Ou para incluir todos
const allUsers = await prisma.user.findManyWithDeleted();
```

## Modelos SEM Soft Delete

Modelos que **não** estão na lista de soft delete (como `auditLog`, `session`, etc.) continuam com comportamento normal de delete permanente:

```typescript
// Este é um hard delete direto (sem soft delete)
await prisma.auditLog.delete({ where: { id: 1 } });
```

## Implementação Técnica

A extensão usa o novo sistema de **Prisma Client Extensions** do Prisma v7:

```typescript
// apps/backend/src/prisma/extensions/soft-delete.extension.ts
export const softDeleteExtension = Prisma.defineExtension({
  name: 'softDelete',
  query: {
    $allModels: {
      // Intercepta queries e adiciona lógica de soft delete
    }
  },
  model: {
    $allModels: {
      // Adiciona métodos personalizados (restore, forceDelete, etc.)
    }
  }
});
```

E é aplicada no `PrismaService`:

```typescript
// apps/backend/src/prisma/prisma.service.ts
constructor() {
  super({ /* config */ });
  return this.$extends(softDeleteExtension) as any;
}
```

## Referências

- [Prisma Client Extensions (Official Docs)](https://www.prisma.io/docs/orm/prisma-client/client-extensions)
- [Migração de Middlewares para Extensions](https://www.prisma.io/docs/orm/prisma-client/client-extensions/middleware)
