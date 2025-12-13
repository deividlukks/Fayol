import { createZodDto } from 'nestjs-zod';
import { createGoalSchema } from '@fayol/validation-schemas';

export class CreateGoalDto extends createZodDto(createGoalSchema) {}
