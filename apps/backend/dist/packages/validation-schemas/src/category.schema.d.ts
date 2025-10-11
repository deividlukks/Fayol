import { z } from 'zod';
export declare const createCategorySchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    icon: z.ZodOptional<z.ZodString>;
    color: z.ZodOptional<z.ZodString>;
    parentId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    icon?: string;
    color?: string;
    parentId?: string;
    description?: string;
}, {
    name?: string;
    icon?: string;
    color?: string;
    parentId?: string;
    description?: string;
}>;
export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export declare const updateCategorySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    icon: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    color: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    parentId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    icon?: string;
    color?: string;
    parentId?: string;
    description?: string;
}, {
    name?: string;
    icon?: string;
    color?: string;
    parentId?: string;
    description?: string;
}>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
