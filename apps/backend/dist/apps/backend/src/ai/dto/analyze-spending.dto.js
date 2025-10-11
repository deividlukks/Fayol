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
exports.AnalyzeSpendingDto = exports.TransactionDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class TransactionDto {
}
exports.TransactionDto = TransactionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da transação',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], TransactionDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Descrição da transação',
        example: 'Compra no supermercado Extra',
    }),
    __metadata("design:type", String)
], TransactionDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Valor da transação (positivo para receita, negativo para despesa)',
        example: -150.5,
    }),
    __metadata("design:type", Number)
], TransactionDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data da transação (ISO 8601)',
        example: '2025-10-01T10:30:00Z',
    }),
    __metadata("design:type", String)
], TransactionDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Categoria da transação',
        example: 'Alimentação',
        required: false,
    }),
    __metadata("design:type", String)
], TransactionDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Subcategoria da transação',
        example: 'Supermercado',
        required: false,
    }),
    __metadata("design:type", String)
], TransactionDto.prototype, "subcategory", void 0);
class AnalyzeSpendingDto {
}
exports.AnalyzeSpendingDto = AnalyzeSpendingDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Lista de transações para análise',
        type: [TransactionDto],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TransactionDto),
    __metadata("design:type", Array)
], AnalyzeSpendingDto.prototype, "transactions", void 0);
//# sourceMappingURL=analyze-spending.dto.js.map