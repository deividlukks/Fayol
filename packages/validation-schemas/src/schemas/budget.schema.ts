import { z } from 'zod';
import { LIMITS, ERROR_MESSAGES } from '@fayol/shared-constants';

export const createBudgetSchema = z.object({
  name: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD).max(50),
  amount: z.number().min(0.01, 'O valor deve ser maior que zero'),
  categoryId: z.string().uuid().optional(), // Se vazio, é um orçamento global
  startDate: z.coerce.date({ invalid_type_error: ERROR_MESSAGES.INVALID_DATE }),
  endDate: z.coerce.date({ invalid_type_error: ERROR_MESSAGES.INVALID_DATE }),
  notifyThreshold: z.number().min(1).max(100).optional(), // % para notificar
});

export const updateBudgetSchema = createBudgetSchema.partial();

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
