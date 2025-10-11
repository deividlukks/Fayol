# @fayol/validation-schemas

Shared Zod validation schemas for the Fayol project.

## 📦 Installation

```bash
# From root of monorepo
pnpm add zod

# Build the package
cd packages/validation-schemas
pnpm build
```

## 🚀 Usage

### In Backend (NestJS)

```typescript
import { createUserSchema, CreateUserDto } from '@fayol/validation-schemas';

// Use in DTO
export class CreateUserDto implements CreateUserDto {
  // Zod schema handles validation
}

// Manual validation
const result = createUserSchema.safeParse(data);
if (result.success) {
  const validData = result.data;
} else {
  const errors = result.error.errors;
}
```

### In Frontend (Next.js/React)

```typescript
import { loginSchema } from '@fayol/validation-schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

const form = useForm({
  resolver: zodResolver(loginSchema),
});
```

## 📋 Available Schemas

### User Schemas
- `createUserSchema` - User registration
- `updateUserSchema` - User update
- `loginSchema` - User login
- `changePasswordSchema` - Password change
- `investorProfileEnum` - Investor profile types

### Account Schemas
- `createAccountSchema` - Create account
- `updateAccountSchema` - Update account
- `transferSchema` - Transfer between accounts
- `accountTypeEnum` - Account types (checking, savings, etc.)

### Category Schemas
- `createCategorySchema` - Create category (with optional parent)
- `updateCategorySchema` - Update category

### Transaction Schemas
- `createTransactionSchema` - Create transaction
- `updateTransactionSchema` - Update transaction
- `transactionFilterSchema` - Filter transactions
- `transactionTypeEnum` - Transaction types (INCOME, EXPENSE, TRANSFER)

### Recurring Transaction Schemas
- `createRecurringTransactionSchema` - Create recurring transaction
- `updateRecurringTransactionSchema` - Update recurring transaction
- `toggleRecurringTransactionSchema` - Pause/resume recurring
- `frequencyEnum` - Frequency types (DAILY, WEEKLY, MONTHLY, etc.)

## 🔧 Development

```bash
# Watch mode
pnpm dev

# Build
pnpm build

# Clean
pnpm clean
```

## 📝 Adding New Schemas

1. Create new file: `src/your-schema.schema.ts`
2. Define Zod schemas
3. Export from `src/index.ts`
4. Rebuild package

## 🎯 Benefits

- ✅ **Type Safety**: TypeScript types inferred from Zod schemas
- ✅ **Reusability**: Same schemas in backend and frontend
- ✅ **Consistency**: Single source of truth for validation
- ✅ **DRY**: Don't repeat validation logic
- ✅ **Runtime Validation**: Zod validates at runtime
- ✅ **Easy Updates**: Change schema once, applies everywhere

## 📖 References

- [Zod Documentation](https://zod.dev)
- [Zod + React Hook Form](https://github.com/react-hook-form/resolvers#zod)
- [NestJS + Zod](https://docs.nestjs.com/techniques/validation#auto-validation)
