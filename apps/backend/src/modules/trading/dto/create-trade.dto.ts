import { createZodDto } from 'nestjs-zod';
import { createTradeSchema } from '@fayol/validation-schemas';

export class CreateTradeDto extends createZodDto(createTradeSchema) {}
