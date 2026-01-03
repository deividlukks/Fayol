import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { InvestorProfile } from '@fayol/shared-types';
import { LIMITS, REGEX } from '@fayol/shared-constants';

const onboardingSchema = z.object({
  step: z.number().min(1).max(5),
  // Passo 1: Dados Pessoais
  name: z.string().min(LIMITS.USER.NAME_MIN).optional(),
  phoneNumber: z.string().regex(REGEX.PHONE_BR).optional(),

  // Passo 2: Moeda (Conta é criada via service de Accounts, aqui definimos a preferência)
  mainCurrency: z.string().length(3).optional(),

  // Passo 3: Investidor
  investorProfile: z.nativeEnum(InvestorProfile).optional(),
});

export class UpdateOnboardingDto extends createZodDto(onboardingSchema) {}
