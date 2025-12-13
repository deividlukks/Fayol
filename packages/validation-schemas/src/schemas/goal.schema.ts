import { z } from 'zod';
import { ERROR_MESSAGES } from '@fayol/shared-constants';

export const createGoalSchema = z.object({
  title: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD).max(50),
  currentAmount: z.preprocess(
    (val: unknown) => (val === '' || val === undefined ? 0 : Number(val)),
    z.number().min(0)
  ),
  targetAmount: z.preprocess(
    (val: unknown) => (val === '' ? undefined : Number(val)),
    z.number().min(1, 'O objetivo deve ser maior que zero')
  ),
  deadline: z.coerce.date().optional(),
  color: z.string().optional(),
});

export const updateGoalSchema = createGoalSchema.partial();

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
