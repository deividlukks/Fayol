import { z } from 'zod';
import { LIMITS, ERROR_MESSAGES } from '@fayol/shared-constants';
import { LaunchType, Recurrence } from '@fayol/shared-types';

export const createTransactionSchema = z.object({
  description: z
    .string()
    .min(1, ERROR_MESSAGES.REQUIRED_FIELD)
    .max(LIMITS.TRANSACTION.DESCRIPTION_MAX, 'Descrição muito longa'),
  amount: z
    .number({ invalid_type_error: 'O valor deve ser um número' })
    .min(LIMITS.TRANSACTION.MIN_AMOUNT, 'O valor deve ser maior que zero')
    .max(LIMITS.TRANSACTION.MAX_AMOUNT, 'Valor excede o limite permitido'),
  date: z.coerce.date({ invalid_type_error: ERROR_MESSAGES.INVALID_DATE }),
  type: z.nativeEnum(LaunchType, { errorMap: () => ({ message: 'Tipo de lançamento inválido' }) }),
  accountId: z.string().uuid(ERROR_MESSAGES.REQUIRED_FIELD),
  categoryId: z.string().uuid(ERROR_MESSAGES.REQUIRED_FIELD).optional(), // Categoria pode ser opcional
  isPaid: z.boolean().default(true),
  recurrence: z.nativeEnum(Recurrence).default(Recurrence.NONE),
  notes: z.string().max(LIMITS.TRANSACTION.NOTES_MAX).optional(),
  tags: z.array(z.string()).optional(),
});

// Schema de atualização (parcial)
export const updateTransactionSchema = createTransactionSchema.partial();

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;