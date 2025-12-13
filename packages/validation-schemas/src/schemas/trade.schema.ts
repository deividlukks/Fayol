import { z } from 'zod';
import { ERROR_MESSAGES } from '@fayol/shared-constants';
import { LaunchType } from '@fayol/shared-types'; // Usaremos INCOME(Venda) / EXPENSE(Compra)

export const createTradeSchema = z.object({
  ticker: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD).max(20).toUpperCase(),
  type: z.enum(['BUY', 'SELL']), // Compra ou Venda
  quantity: z.number().positive('A quantidade deve ser maior que zero'),
  price: z.number().positive('O preço deve ser maior que zero'),
  date: z.coerce.date({ invalid_type_error: ERROR_MESSAGES.INVALID_DATE }),
  fees: z.number().min(0).default(0), // Taxas/Corretagem
  accountId: z.string().uuid(ERROR_MESSAGES.REQUIRED_FIELD), // Conta usada para liquidar
  investmentId: z.string().uuid().optional(), // ID do ativo na carteira (se já existir)
});

export const updateTradeSchema = createTradeSchema.partial();

export type CreateTradeInput = z.infer<typeof createTradeSchema>;
export type UpdateTradeInput = z.infer<typeof updateTradeSchema>;
