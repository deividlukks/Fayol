import { z } from 'zod';
import { ERROR_MESSAGES } from '@fayol/shared-constants';

export const createInvestmentSchema = z.object({
  name: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD).max(100),
  ticker: z.string().max(20).optional(), // Ex: PETR4, BTC
  quantity: z.number().positive('A quantidade deve ser maior que zero'),
  averagePrice: z.number().min(0, 'O preço médio não pode ser negativo'),
  currentPrice: z.number().min(0).optional(), // Para atualização manual ou via API
  type: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD), // Ações, FIIs, Crypto, etc.
  purchaseDate: z.coerce.date({ invalid_type_error: ERROR_MESSAGES.INVALID_DATE }),
  accountId: z.string().uuid(ERROR_MESSAGES.REQUIRED_FIELD), // Conta onde o ativo está custodiado
});

export const updateInvestmentSchema = createInvestmentSchema.partial();

export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>;
export type UpdateInvestmentInput = z.infer<typeof updateInvestmentSchema>;
