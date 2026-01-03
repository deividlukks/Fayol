import { createZodDto } from 'nestjs-zod';
import { createTradeSchema, updateTradeSchema } from '@fayol/validation-schemas';

export class CreateTradeDto extends createZodDto(createTradeSchema) {}
export class UpdateTradeDto extends createZodDto(updateTradeSchema) {}
