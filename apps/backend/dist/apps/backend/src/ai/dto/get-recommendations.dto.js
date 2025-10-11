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
exports.GetRecommendationsDto = exports.UserGoalsDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const analyze_spending_dto_1 = require("./analyze-spending.dto");
class UserGoalsDto {
}
exports.UserGoalsDto = UserGoalsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Meta de poupança mensal',
        example: 1000,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UserGoalsDto.prototype, "savingsGoal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Meta de gastos máximos por categoria',
        example: { Alimentação: 500, Transporte: 300 },
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UserGoalsDto.prototype, "categoryBudgets", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Taxa de poupança desejada (%)',
        example: 20,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UserGoalsDto.prototype, "targetSavingsRate", void 0);
class GetRecommendationsDto {
}
exports.GetRecommendationsDto = GetRecommendationsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Lista de transações para análise',
        type: [analyze_spending_dto_1.TransactionDto],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => analyze_spending_dto_1.TransactionDto),
    __metadata("design:type", Array)
], GetRecommendationsDto.prototype, "transactions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Metas financeiras do usuário',
        type: UserGoalsDto,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => UserGoalsDto),
    __metadata("design:type", UserGoalsDto)
], GetRecommendationsDto.prototype, "userGoals", void 0);
//# sourceMappingURL=get-recommendations.dto.js.map