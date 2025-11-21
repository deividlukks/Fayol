import { z } from 'zod';
import { REGEX, LIMITS, ERROR_MESSAGES } from '@fayol/shared-constants';

export const loginSchema = z.object({
  email: z.string().email(ERROR_MESSAGES.INVALID_EMAIL),
  password: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(LIMITS.USER.NAME_MIN, `Nome deve ter no mínimo ${LIMITS.USER.NAME_MIN} caracteres`)
    .max(LIMITS.USER.NAME_MAX, `Nome deve ter no máximo ${LIMITS.USER.NAME_MAX} caracteres`),
  email: z.string().email(ERROR_MESSAGES.INVALID_EMAIL),
  password: z
    .string()
    .min(LIMITS.USER.PASSWORD_MIN, ERROR_MESSAGES.INVALID_PASSWORD)
    .regex(REGEX.PASSWORD_COMPLEX, ERROR_MESSAGES.INVALID_PASSWORD),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: ERROR_MESSAGES.PASSWORDS_DO_NOT_MATCH,
  path: ['confirmPassword'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;