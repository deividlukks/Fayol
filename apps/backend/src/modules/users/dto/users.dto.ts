import { createZodDto } from 'nestjs-zod';
import { updateUserSchema } from '@fayol/validation-schemas';

export class UpdateUserDto extends createZodDto(updateUserSchema) {}
