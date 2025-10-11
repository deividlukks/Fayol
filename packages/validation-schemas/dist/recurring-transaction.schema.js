"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleRecurringTransactionSchema = exports.updateRecurringTransactionSchema = exports.createRecurringTransactionSchema = exports.frequencyEnum = void 0;
const zod_1 = require("zod");
const transaction_schema_1 = require("./transaction.schema");
// Enum para frequência
exports.frequencyEnum = zod_1.z.enum([
    'DAILY',
    'WEEKLY',
    'BIWEEKLY',
    'MONTHLY',
    'QUARTERLY',
    'YEARLY',
]);
// Schema para criação de transação recorrente
exports.createRecurringTransactionSchema = zod_1.z.object({
    accountId: zod_1.z.string().uuid('ID de conta inválido'),
    categoryId: zod_1.z.string().uuid('ID de categoria inválido'),
    type: transaction_schema_1.transactionTypeEnum,
    amount: zod_1.z.number().positive('Valor deve ser positivo'),
    description: zod_1.z.string().min(1, 'Descrição é obrigatória').max(500),
    frequency: exports.frequencyEnum,
    startDate: zod_1.z.coerce.date(),
    endDate: zod_1.z.coerce.date().optional(),
    isActive: zod_1.z.boolean().default(true),
    notes: zod_1.z.string().max(1000).optional(),
});
// Schema para atualização de transação recorrente
exports.updateRecurringTransactionSchema = exports.createRecurringTransactionSchema.partial();
// Schema para pausar/retomar transação recorrente
exports.toggleRecurringTransactionSchema = zod_1.z.object({
    isActive: zod_1.z.boolean(),
});
