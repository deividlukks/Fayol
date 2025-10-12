"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferSchema = exports.updateAccountSchema = exports.createAccountSchema = exports.accountTypeEnum = void 0;
const zod_1 = require("zod");
exports.accountTypeEnum = zod_1.z.enum([
    'checking',
    'savings',
    'investment',
    'credit',
]);
exports.createAccountSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Nome é obrigatório').max(100),
    type: exports.accountTypeEnum,
    balance: zod_1.z.number().default(0),
    institution: zod_1.z.string().max(100).optional(),
    accountNumber: zod_1.z.string().max(50).optional(),
    description: zod_1.z.string().max(500).optional(),
});
exports.updateAccountSchema = exports.createAccountSchema.partial();
exports.transferSchema = zod_1.z.object({
    fromAccountId: zod_1.z.string().uuid('ID de conta de origem inválido'),
    toAccountId: zod_1.z.string().uuid('ID de conta de destino inválido'),
    amount: zod_1.z.number().positive('Valor deve ser positivo'),
    description: zod_1.z.string().max(500).optional(),
});
//# sourceMappingURL=account.schema.js.map