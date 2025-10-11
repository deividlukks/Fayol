import { z } from 'zod';

// Enum para perfil do investidor
export const investorProfileEnum = z.enum([
  'conservative',
  'moderate',
  'aggressive',
]);

export type InvestorProfile = z.infer<typeof investorProfileEnum>;

// Schema para criação de usuário
export const createUserSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100),
  email: z.string().email('Email inválido'),
  phone: z
    .string()
    .regex(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos'),
  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Senha deve conter maiúscula, número e caractere especial',
    ),
  investorProfile: investorProfileEnum,
  fayolId: z.string().optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;

// Schema para atualização de usuário
export const updateUserSchema = createUserSchema
  .partial()
  .omit({ password: true });

export type UpdateUserDto = z.infer<typeof updateUserSchema>;

// Schema para login
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export type LoginDto = z.infer<typeof loginSchema>;

// Schema para alteração de senha
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z
    .string()
    .min(8, 'Nova senha deve ter no mínimo 8 caracteres')
    .regex(
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Nova senha deve conter maiúscula, número e caractere especial',
    ),
});

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
