import { z } from 'zod';

// Enum para tipo de conta
export const accountTypeEnum = z.enum([
  'checking',
  'savings',
  'investment',
  'credit',
]);

export type AccountType = z.infer<typeof accountTypeEnum>;

// Schema para criação de conta
export const createAccountSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  type: accountTypeEnum,
  balance: z.number().default(0),
  institution: z.string().max(100).optional(),
  accountNumber: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
});

export type CreateAccountDto = z.infer<typeof createAccountSchema>;

// Schema para atualização de conta
export const updateAccountSchema = createAccountSchema.partial();

export type UpdateAccountDto = z.infer<typeof updateAccountSchema>;

// Schema para transferência entre contas
export const transferSchema = z.object({
  fromAccountId: z.string().uuid('ID de conta de origem inválido'),
  toAccountId: z.string().uuid('ID de conta de destino inválido'),
  amount: z.number().positive('Valor deve ser positivo'),
  description: z.string().max(500).optional(),
});

export type TransferDto = z.infer<typeof transferSchema>;
