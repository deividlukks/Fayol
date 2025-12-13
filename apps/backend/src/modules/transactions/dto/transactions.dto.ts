import { createZodDto } from 'nestjs-zod';
import { createTransactionSchema, updateTransactionSchema } from '@fayol/validation-schemas';

export class CreateTransactionDto extends createZodDto(createTransactionSchema) {}
export class UpdateTransactionDto extends createZodDto(updateTransactionSchema) {}
