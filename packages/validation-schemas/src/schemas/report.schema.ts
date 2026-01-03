import { z } from 'zod';
import { ERROR_MESSAGES } from '@fayol/shared-constants';

export const getReportSchema = z.object({
  startDate: z.coerce.date({ invalid_type_error: ERROR_MESSAGES.INVALID_DATE }).optional(),
  endDate: z.coerce.date({ invalid_type_error: ERROR_MESSAGES.INVALID_DATE }).optional(),
});

export type GetReportInput = z.infer<typeof getReportSchema>;
