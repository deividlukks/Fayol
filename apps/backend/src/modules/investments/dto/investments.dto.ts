import { createZodDto } from 'nestjs-zod';
import { createInvestmentSchema, updateInvestmentSchema } from '@fayol/validation-schemas';

export class CreateInvestmentDto extends createZodDto(createInvestmentSchema) {}
export class UpdateInvestmentDto extends createZodDto(updateInvestmentSchema) {}
