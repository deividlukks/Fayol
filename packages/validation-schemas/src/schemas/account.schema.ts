import { z } from 'zod';
import { LIMITS, ERROR_MESSAGES } from '@fayol/shared-constants';
import { AccountType } from '@fayol/shared-types';

export const createAccountSchema = z.object({
  name: z
    .string()
    .min(LIMITS.ACCOUNT.NAME_MIN, `Nome deve ter no mínimo ${LIMITS.ACCOUNT.NAME_MIN} caracteres`)
    .max(LIMITS.ACCOUNT.NAME_MAX, `Nome deve ter no máximo ${LIMITS.ACCOUNT.NAME_MAX} caracteres`),
  type: z.nativeEnum(AccountType, { errorMap: () => ({ message: 'Tipo de conta inválido' }) }),
  balance: z.number().default(0),
  currency: z.string().default('BRL'),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export const updateAccountSchema = createAccountSchema.partial();

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;