"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferSchema = exports.updateAccountSchema = exports.createAccountSchema = exports.accountTypeEnum = void 0;
const zod_1 = require("zod");
// Enum para tipo de conta
exports.accountTypeEnum = zod_1.z.enum([
    'checking',
    'savings',
    'investment',
    'credit',
]);
// Schema para criação de conta
exports.createAccountSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Nome é obrigatório').max(100),
    type: exports.accountTypeEnum,
    balance: zod_1.z.number().default(0),
    institution: zod_1.z.string().max(100).optional(),
    accountNumber: zod_1.z.string().max(50).optional(),
    description: zod_1.z.string().max(500).optional(),
});
// Schema para atualização de conta
exports.updateAccountSchema = exports.createAccountSchema.partial();
// Schema para transferência entre contas
exports.transferSchema = zod_1.z.object({
    fromAccountId: zod_1.z.string().uuid('ID de conta de origem inválido'),
    toAccountId: zod_1.z.string().uuid('ID de conta de destino inválido'),
    amount: zod_1.z.number().positive('Valor deve ser positivo'),
    description: zod_1.z.string().max(500).optional(),
});
