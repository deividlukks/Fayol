import { z } from 'zod';
import { LIMITS, ERROR_MESSAGES } from '@fayol/shared-constants';
import { LaunchType, Recurrence } from '@fayol/shared-types';

// 1. Definimos a estrutura base do objeto (ZodObject)
const baseTransactionSchema = z.object({
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
  accountId: z.string().uuid(ERROR_MESSAGES.REQUIRED_FIELD), // Conta de Origem

  // Conta de Destino (Apenas para transferências)
  destinationAccountId: z.string().uuid().optional(),

  // CORREÇÃO: CategoryId agora aceita null ou undefined (opcional)
  // Isso permite que o Bot envie transações sem categoria para a IA processar depois
  categoryId: z.string().uuid().optional().nullable(),

  isPaid: z.boolean().default(true),
  recurrence: z.nativeEnum(Recurrence).default(Recurrence.NONE),
  notes: z.string().max(LIMITS.TRANSACTION.NOTES_MAX).optional(),
  tags: z.array(z.string()).optional(),
});

// 2. Função de refinamento (regras de negócio)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transactionRefinements = (data: any) => {
  // Validação condicional: Se for TRANSFER, destinationAccountId é obrigatório
  if (data.type === 'TRANSFER' && !data.destinationAccountId) {
    return false;
  }
  // Validação: Origem e Destino não podem ser iguais
  if (data.type === 'TRANSFER' && data.accountId === data.destinationAccountId) {
    return false;
  }
  return true;
};

// 3. Schema de CRIAÇÃO: Base + Refinamentos
export const createTransactionSchema = baseTransactionSchema.refine(transactionRefinements, {
  message: 'Selecione uma conta de destino válida e diferente da origem',
  path: ['destinationAccountId'],
});

// 4. Schema de ATUALIZAÇÃO: Base Parcial
export const updateTransactionSchema = baseTransactionSchema.partial();

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
