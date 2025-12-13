import { createZodDto } from 'nestjs-zod';
import { createAccountSchema, updateAccountSchema } from '@fayol/validation-schemas';

export class CreateAccountDto extends createZodDto(createAccountSchema) {}
export class UpdateAccountDto extends createZodDto(updateAccountSchema) {}
