"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateRecurringTransactionDto = void 0;
const validation_schemas_1 = require("@fayol/validation-schemas");
const nestjs_zod_1 = require("nestjs-zod");
class UpdateRecurringTransactionDto extends (0, nestjs_zod_1.createZodDto)(validation_schemas_1.updateRecurringTransactionSchema) {
}
exports.UpdateRecurringTransactionDto = UpdateRecurringTransactionDto;
//# sourceMappingURL=update-recurring-transaction.dto.js.map