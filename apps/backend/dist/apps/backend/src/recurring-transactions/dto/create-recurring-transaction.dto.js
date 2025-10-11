"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateRecurringTransactionDto = void 0;
const validation_schemas_1 = require("@fayol/validation-schemas");
const nestjs_zod_1 = require("nestjs-zod");
class CreateRecurringTransactionDto extends (0, nestjs_zod_1.createZodDto)(validation_schemas_1.createRecurringTransactionSchema) {
}
exports.CreateRecurringTransactionDto = CreateRecurringTransactionDto;
//# sourceMappingURL=create-recurring-transaction.dto.js.map