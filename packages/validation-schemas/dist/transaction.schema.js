"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionFilterSchema = exports.updateTransactionSchema = exports.createTransactionSchema = exports.transactionTypeEnum = void 0;
const zod_1 = require("zod");
// Enum para tipo de transação
exports.transactionTypeEnum = zod_1.z.enum(['INCOME', 'EXPENSE', 'TRANSFER']);
// Schema para criação de transação
exports.createTransactionSchema = zod_1.z.object({
    accountId: zod_1.z.string().uuid('ID de conta inválido'),
    categoryId: zod_1.z.string().uuid('ID de categoria inválido'),
    type: exports.transactionTypeEnum,
    amount: zod_1.z.number().positive('Valor deve ser positivo'),
    description: zod_1.z.string().min(1, 'Descrição é obrigatória').max(500),
    effectiveDate: zod_1.z.coerce.date(),
    dueDate: zod_1.z.coerce.date().optional(),
    isPaid: zod_1.z.boolean().default(false),
    notes: zod_1.z.string().max(1000).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    transferAccountId: zod_1.z.string().uuid().optional(), // Para transferências
});
// Schema para atualização de transação
exports.updateTransactionSchema = exports.createTransactionSchema.partial();
// Schema para filtros de transação
exports.transactionFilterSchema = zod_1.z.object({
    accountId: zod_1.z.string().uuid().optional(),
    categoryId: zod_1.z.string().uuid().optional(),
    type: exports.transactionTypeEnum.optional(),
    startDate: zod_1.z.coerce.date().optional(),
    endDate: zod_1.z.coerce.date().optional(),
    minAmount: zod_1.z.number().optional(),
    maxAmount: zod_1.z.number().optional(),
    isPaid: zod_1.z.boolean().optional(),
    search: zod_1.z.string().optional(),
});
