import { createZodDto } from 'nestjs-zod';
import { updateTradeSchema } from '@fayol/validation-schemas';

export class UpdateTradeDto extends createZodDto(updateTradeSchema) {}
