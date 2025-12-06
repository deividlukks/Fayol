import { PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod'; // <--- Adicionamos ZodError

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      return this.schema.parse(value);
    } catch (error) {
      // Verificamos se o erro é realmente uma instância do ZodError
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: error.errors.map((err) => `${err.path.join('.')}: ${err.message}`),
          error: 'Validation Error',
        });
      }

      throw new BadRequestException('Validation failed');
    }
  }
}
