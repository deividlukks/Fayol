import { z } from 'zod';
import { LIMITS, REGEX, ERROR_MESSAGES } from '@fayol/shared-constants';
import { InvestorProfile } from '@fayol/shared-types';

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(LIMITS.USER.NAME_MIN)
    .max(LIMITS.USER.NAME_MAX)
    .optional(),
  phoneNumber: z
    .string()
    .regex(REGEX.PHONE_BR, 'Telefone inválido')
    .optional()
    .or(z.literal('')),
  investorProfile: z.nativeEnum(InvestorProfile).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;