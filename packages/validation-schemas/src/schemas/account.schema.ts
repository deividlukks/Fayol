import { z } from 'zod';
import { LIMITS } from '@fayol/shared-constants';
import { AccountType } from '@fayol/shared-types';

export const createAccountSchema = z.object({
  name: z
    .string()
    .min(LIMITS.ACCOUNT.NAME_MIN, `Nome deve ter no mínimo ${LIMITS.ACCOUNT.NAME_MIN} caracteres`)
    .max(LIMITS.ACCOUNT.NAME_MAX, `Nome deve ter no máximo ${LIMITS.ACCOUNT.NAME_MAX} caracteres`),
  type: z.nativeEnum(AccountType, { errorMap: () => ({ message: 'Tipo de conta inválido' }) }),

  // Aceita número ou string que vira número. Se vier vazio, vira 0.
  balance: z.preprocess(
    (val: unknown) => (val === '' || val === undefined ? 0 : Number(val)),
    z.number({ invalid_type_error: 'O saldo deve ser um número' })
  ),

  // Aceita número, string, null ou undefined.
  creditLimit: z.preprocess(
    (val: unknown) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(0).optional()
  ),

  currency: z.string().default('BRL'),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export const updateAccountSchema = createAccountSchema.partial();

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
