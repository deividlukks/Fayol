import {
  createRecurringTransactionSchema,
  CreateRecurringTransactionDto as CreateRecurringTransactionDtoType,
} from '@fayol/validation-schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateRecurringTransactionDto
  extends createZodDto(createRecurringTransactionSchema)
  implements CreateRecurringTransactionDtoType {}
