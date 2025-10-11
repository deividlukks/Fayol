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
exports.DetectAnomaliesDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const analyze_spending_dto_1 = require("./analyze-spending.dto");
class DetectAnomaliesDto {
}
exports.DetectAnomaliesDto = DetectAnomaliesDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Lista de transações para detecção de anomalias',
        type: [analyze_spending_dto_1.TransactionDto],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => analyze_spending_dto_1.TransactionDto),
    __metadata("design:type", Array)
], DetectAnomaliesDto.prototype, "transactions", void 0);
//# sourceMappingURL=detect-anomalies.dto.js.map