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
exports.PredictFutureDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const analyze_spending_dto_1 = require("./analyze-spending.dto");
class PredictFutureDto {
}
exports.PredictFutureDto = PredictFutureDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Lista de transações históricas para análise',
        type: [analyze_spending_dto_1.TransactionDto],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => analyze_spending_dto_1.TransactionDto),
    __metadata("design:type", Array)
], PredictFutureDto.prototype, "transactions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Número de meses a prever (1-12)',
        example: 3,
        minimum: 1,
        maximum: 12,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    __metadata("design:type", Number)
], PredictFutureDto.prototype, "monthsAhead", void 0);
//# sourceMappingURL=predict-future.dto.js.map