import { z } from 'zod';
export declare const createCategorySchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    icon: z.ZodOptional<z.ZodString>;
    color: z.ZodOptional<z.ZodString>;
    parentId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description?: string | undefined;
    icon?: string | undefined;
    color?: string | undefined;
    parentId?: string | undefined;
}, {
    name: string;
    description?: string | undefined;
    icon?: string | undefined;
    color?: string | undefined;
    parentId?: string | undefined;
}>;
export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export declare const updateCategorySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    icon: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    color: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    parentId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    icon?: string | undefined;
    color?: string | undefined;
    parentId?: string | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    icon?: string | undefined;
    color?: string | undefined;
    parentId?: string | undefined;
}>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
//# sourceMappingURL=category.schema.d.ts.map