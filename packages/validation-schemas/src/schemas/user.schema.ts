import { z } from 'zod';
import { LIMITS, REGEX } from '@fayol/shared-constants';
import { InvestorProfile, Gender } from '@fayol/shared-types';

export const updateUserSchema = z.object({
  name: z.string().min(LIMITS.USER.NAME_MIN).max(LIMITS.USER.NAME_MAX).optional(),
  phoneNumber: z.string().regex(REGEX.PHONE_BR, 'Telefone inválido').optional().or(z.literal('')),
  // Novos campos
  cpf: z.string().optional(), // Adicionar validação de CPF depois se desejar
  gender: z.nativeEnum(Gender).optional(),
  profileImage: z.string().optional(), // Base64 da imagem
  investorProfile: z.nativeEnum(InvestorProfile).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
