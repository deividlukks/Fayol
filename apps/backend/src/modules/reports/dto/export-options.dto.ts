import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ERROR_MESSAGES } from '@fayol/shared-constants';

const exportOptionsSchema = z.object({
  startDate: z.coerce.date({ invalid_type_error: ERROR_MESSAGES.INVALID_DATE }).optional(),
  endDate: z.coerce.date({ invalid_type_error: ERROR_MESSAGES.INVALID_DATE }).optional(),
  type: z.enum(['PDF', 'EXCEL']).optional().default('PDF'),
});

export class ExportOptionsDto extends createZodDto(exportOptionsSchema) {}
