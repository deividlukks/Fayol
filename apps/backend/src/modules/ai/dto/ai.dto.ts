import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const predictCategorySchema = z.object({
  description: z.string().min(3),
});

export class PredictCategoryDto extends createZodDto(predictCategorySchema) {}