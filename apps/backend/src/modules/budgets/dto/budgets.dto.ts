import { createZodDto } from 'nestjs-zod';
import { createBudgetSchema, updateBudgetSchema } from '@fayol/validation-schemas';

export class CreateBudgetDto extends createZodDto(createBudgetSchema) {}
export class UpdateBudgetDto extends createZodDto(updateBudgetSchema) {}
