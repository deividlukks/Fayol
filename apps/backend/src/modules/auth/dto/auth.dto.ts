import { createZodDto } from 'nestjs-zod';
import { loginSchema, registerSchema } from '@fayol/validation-schemas';

export class LoginDto extends createZodDto(loginSchema) {}
export class RegisterDto extends createZodDto(registerSchema) {}
