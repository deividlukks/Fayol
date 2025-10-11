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
exports.RegisterDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class RegisterDto {
    constructor() {
        this.investorProfile = 'moderate';
    }
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'João Silva' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nome é obrigatório' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'joao@example.com' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Email é obrigatório' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Email inválido' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '11999999999' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Telefone é obrigatório' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[0-9]{10,11}$/, { message: 'Telefone deve conter 10 ou 11 dígitos' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '12345678900', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[0-9]{11}$/, { message: 'CPF deve conter 11 dígitos' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "cpf", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Senha@123' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Senha é obrigatória' }),
    (0, class_validator_1.MinLength)(8, { message: 'Senha deve ter no mínimo 8 caracteres' }),
    (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message: 'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número',
    }),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['conservative', 'moderate', 'aggressive'], default: 'moderate' }),
    (0, class_validator_1.IsEnum)(['conservative', 'moderate', 'aggressive'], {
        message: 'Perfil de investidor inválido',
    }),
    __metadata("design:type", String)
], RegisterDto.prototype, "investorProfile", void 0);
//# sourceMappingURL=register.dto.js.map