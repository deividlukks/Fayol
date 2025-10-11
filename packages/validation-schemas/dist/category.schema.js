"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCategorySchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
// Schema para criação de categoria
exports.createCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Nome é obrigatório').max(100),
    description: zod_1.z.string().max(500).optional(),
    icon: zod_1.z.string().max(50).optional(),
    color: zod_1.z
        .string()
        .regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal (#RRGGBB)')
        .optional(),
    parentId: zod_1.z.string().uuid('ID de categoria pai inválido').optional(),
});
// Schema para atualização de categoria
exports.updateCategorySchema = exports.createCategorySchema.partial();
