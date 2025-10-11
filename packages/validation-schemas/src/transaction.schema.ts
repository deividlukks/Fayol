import { z } from 'zod';

// Enum para tipo de transação
export const transactionTypeEnum = z.enum(['INCOME', 'EXPENSE', 'TRANSFER']);

export type TransactionType = z.infer<typeof transactionTypeEnum>;

// Schema para criação de transação
export const createTransactionSchema = z.object({
  accountId: z.string().uuid('ID de conta inválido'),
  categoryId: z.string().uuid('ID de categoria inválido'),
  type: transactionTypeEnum,
  amount: z.number().positive('Valor deve ser positivo'),
  description: z.string().min(1, 'Descrição é obrigatória').max(500),
  effectiveDate: z.coerce.date(),
  dueDate: z.coerce.date().optional(),
  isPaid: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
  transferAccountId: z.string().uuid().optional(), // Para transferências
});

export type CreateTransactionDto = z.infer<typeof createTransactionSchema>;

// Schema para atualização de transação
export const updateTransactionSchema = createTransactionSchema.partial();

export type UpdateTransactionDto = z.infer<typeof updateTransactionSchema>;

// Schema para filtros de transação
export const transactionFilterSchema = z.object({
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  type: transactionTypeEnum.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  isPaid: z.boolean().optional(),
  search: z.string().optional(),
});

export type TransactionFilterDto = z.infer<typeof transactionFilterSchema>;
