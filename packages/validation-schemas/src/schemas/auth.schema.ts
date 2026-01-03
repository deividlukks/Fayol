import { z } from 'zod';
import { REGEX, LIMITS, ERROR_MESSAGES } from '@fayol/shared-constants';

// Login: Ajustado para aceitar e-mail ou telefone (string simples)
export const loginSchema = z.object({
  // Removemos .email() para permitir que o usuário envie o telefone neste campo
  email: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
  password: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(LIMITS.USER.NAME_MIN, `Nome deve ter no mínimo ${LIMITS.USER.NAME_MIN} caracteres`)
      .max(LIMITS.USER.NAME_MAX, `Nome deve ter no máximo ${LIMITS.USER.NAME_MAX} caracteres`),
    email: z.string().email(ERROR_MESSAGES.INVALID_EMAIL),
    phone: z
      .string()
      .regex(REGEX.PHONE_BR, 'Telefone inválido. Use o formato (XX) XXXXX-XXXX')
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(LIMITS.USER.PASSWORD_MIN, ERROR_MESSAGES.INVALID_PASSWORD)
      .regex(REGEX.PASSWORD_COMPLEX, ERROR_MESSAGES.INVALID_PASSWORD),
    confirmPassword: z.string(),
  })
  .refine(
    (data: { password?: string; confirmPassword?: string }) =>
      data.password === data.confirmPassword,
    {
      message: ERROR_MESSAGES.PASSWORDS_DO_NOT_MATCH,
      path: ['confirmPassword'],
    }
  );

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
