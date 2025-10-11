"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.loginSchema = exports.updateUserSchema = exports.createUserSchema = exports.investorProfileEnum = void 0;
const zod_1 = require("zod");
exports.investorProfileEnum = zod_1.z.enum([
    'conservative',
    'moderate',
    'aggressive',
]);
exports.createUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100),
    email: zod_1.z.string().email('Email inválido'),
    phone: zod_1.z
        .string()
        .regex(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos'),
    password: zod_1.z
        .string()
        .min(8, 'Senha deve ter no mínimo 8 caracteres')
        .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 'Senha deve conter maiúscula, número e caractere especial'),
    investorProfile: exports.investorProfileEnum,
    fayolId: zod_1.z.string().optional(),
});
exports.updateUserSchema = exports.createUserSchema
    .partial()
    .omit({ password: true });
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email inválido'),
    password: zod_1.z.string().min(1, 'Senha é obrigatória'),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Senha atual é obrigatória'),
    newPassword: zod_1.z
        .string()
        .min(8, 'Nova senha deve ter no mínimo 8 caracteres')
        .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 'Nova senha deve conter maiúscula, número e caractere especial'),
});
//# sourceMappingURL=user.schema.js.map