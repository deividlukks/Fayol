import { z } from 'zod';
import { LIMITS, ERROR_MESSAGES } from '@fayol/shared-constants';
import { LaunchType } from '@fayol/shared-types';

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(LIMITS.CATEGORY.NAME_MIN, `Nome deve ter no mínimo ${LIMITS.CATEGORY.NAME_MIN} caracteres`)
    .max(
      LIMITS.CATEGORY.NAME_MAX,
      `Nome deve ter no máximo ${LIMITS.CATEGORY.NAME_MAX} caracteres`
    ),
  type: z.nativeEnum(LaunchType, { errorMap: () => ({ message: 'Tipo de lançamento inválido' }) }),
  icon: z.string().optional(),
  color: z.string().optional(),
  parentId: z.string().uuid().optional().nullable(), // <--- ADICIONADO
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
