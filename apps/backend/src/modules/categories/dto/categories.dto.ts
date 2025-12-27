import { createZodDto } from 'nestjs-zod';
import { createCategorySchema, updateCategorySchema } from '@fayol/validation-schemas';

export class CreateCategoryDto extends createZodDto(createCategorySchema) {}
export class UpdateCategoryDto extends createZodDto(updateCategorySchema) {}
