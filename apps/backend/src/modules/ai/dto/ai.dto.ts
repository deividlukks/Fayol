import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// Schema para Predição de Categoria
const predictCategorySchema = z.object({
  description: z.string().min(3),
});

export class PredictCategoryDto extends createZodDto(predictCategorySchema) {}

// --- NOVOS SCHEMAS PARA INSIGHTS ---

// DTO interno para enviar ao Python (não precisa ser exposto na API do Controller)
export interface TransactionInput {
  amount: number;
  date: string;
  category_name: string;
  type: string;
}

export interface InsightResponse {
  type: 'warning' | 'tip' | 'success';
  text: string;
  score: number;
}
