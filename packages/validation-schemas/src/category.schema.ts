import { z } from 'zod';

// Schema para criação de categoria
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal (#RRGGBB)')
    .optional(),
  parentId: z.string().uuid('ID de categoria pai inválido').optional(),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;

// Schema para atualização de categoria
export const updateCategorySchema = createCategorySchema.partial();

export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
