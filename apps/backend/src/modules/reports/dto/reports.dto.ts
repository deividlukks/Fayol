import { createZodDto } from 'nestjs-zod';
import { getReportSchema } from '@fayol/validation-schemas';

export class GetReportDto extends createZodDto(getReportSchema) {}
