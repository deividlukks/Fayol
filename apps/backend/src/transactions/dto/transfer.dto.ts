import { transferSchema, TransferDto as TransferDtoType } from '@fayol/validation-schemas';
import { createZodDto } from 'nestjs-zod';

export class TransferDto extends createZodDto(transferSchema) implements TransferDtoType {}
