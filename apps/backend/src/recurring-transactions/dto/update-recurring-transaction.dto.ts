import {
  updateRecurringTransactionSchema,
  UpdateRecurringTransactionDto as UpdateRecurringTransactionDtoType,
} from '@fayol/validation-schemas';
import { createZodDto } from 'nestjs-zod';

export class UpdateRecurringTransactionDto
  extends createZodDto(updateRecurringTransactionSchema)
  implements UpdateRecurringTransactionDtoType {}
