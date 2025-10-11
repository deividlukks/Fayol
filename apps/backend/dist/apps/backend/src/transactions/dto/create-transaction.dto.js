"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTransactionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateTransactionDto {
}
exports.CreateTransactionDto = CreateTransactionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-da-conta' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "accountId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['income', 'expense'] }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(['income', 'expense']),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "movementType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['income', 'expense', 'investment', 'transfer'] }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(['income', 'expense', 'investment', 'transfer']),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "launchType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-da-categoria' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-da-subcategoria', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "subcategoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 100.5 }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateTransactionDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Compra no supermercado', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-15T10:00:00Z', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "dueDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-15T10:00:00Z', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "receiptDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-15T10:00:00Z', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "effectiveDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateTransactionDto.prototype, "isRecurring", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['daily', 'weekly', 'monthly', 'yearly'], required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['daily', 'weekly', 'monthly', 'yearly']),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "recurrencePeriod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "transferId", void 0);
//# sourceMappingURL=create-transaction.dto.js.map