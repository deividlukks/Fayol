import { z } from 'zod';
import { transactionTypeEnum } from './transaction.schema';

// Enum para frequência
export const frequencyEnum = z.enum([
  'DAILY',
  'WEEKLY',
  'BIWEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
]);

export type Frequency = z.infer<typeof frequencyEnum>;

// Schema para criação de transação recorrente
export const createRecurringTransactionSchema = z.object({
  accountId: z.string().uuid('ID de conta inválido'),
  categoryId: z.string().uuid('ID de categoria inválido'),
  type: transactionTypeEnum,
  amount: z.number().positive('Valor deve ser positivo'),
  description: z.string().min(1, 'Descrição é obrigatória').max(500),
  frequency: frequencyEnum,
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  isActive: z.boolean().default(true),
  notes: z.string().max(1000).optional(),
});

export type CreateRecurringTransactionDto = z.infer<
  typeof createRecurringTransactionSchema
>;

// Schema para atualização de transação recorrente
export const updateRecurringTransactionSchema =
  createRecurringTransactionSchema.partial();

export type UpdateRecurringTransactionDto = z.infer<
  typeof updateRecurringTransactionSchema
>;

// Schema para pausar/retomar transação recorrente
export const toggleRecurringTransactionSchema = z.object({
  isActive: z.boolean(),
});

export type ToggleRecurringTransactionDto = z.infer<
  typeof toggleRecurringTransactionSchema
>;
