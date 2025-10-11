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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const register_dto_1 = require("./dto/register.dto");
const login_dto_1 = require("./dto/login.dto");
const check_fayol_id_dto_1 = require("./dto/check-fayol-id.dto");
const verify_password_dto_1 = require("./dto/verify-password.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async register(registerDto) {
        return this.authService.register(registerDto);
    }
    async login(loginDto) {
        return this.authService.login(loginDto);
    }
    async checkFayolId(checkFayolIdDto) {
        return this.authService.checkFayolId(checkFayolIdDto);
    }
    async verifyPassword(verifyPasswordDto) {
        return this.authService.verifyPassword(verifyPasswordDto);
    }
    async refresh(req) {
        return this.authService.refresh(req.user.userId, req.user.email);
    }
    async logout() {
        return {
            message: 'Logout realizado com sucesso',
        };
    }
    async generateTwoFactorSecret(user) {
        return this.authService.generateTwoFactorSecret(user.id);
    }
    async enableTwoFactor(user, body) {
        return this.authService.enableTwoFactor(user.id, body.token);
    }
    async disableTwoFactor(user, body) {
        return this.authService.disableTwoFactor(user.id, body.token);
    }
    async getTwoFactorStatus(user) {
        return this.authService.getTwoFactorStatus(user.id);
    }
    async loginWithTwoFactor(body) {
        return this.authService.loginWithTwoFactor(body.fayolId, body.password, body.twoFactorToken);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar novo usuário' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Usuário criado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Email ou telefone já cadastrado' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Autenticar usuário (Legado)',
        description: 'Método tradicional de login. Use /auth/check-id e /auth/verify-password para login em duas etapas.',
        deprecated: true,
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Login realizado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Credenciais inválidas' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('check-id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Verificar Fayol ID - Etapa 1 do login',
        description: 'Verifica se o Fayol ID (email, telefone ou CPF) existe e retorna informações básicas do usuário.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Fayol ID encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Fayol ID inválido' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Fayol ID não encontrado ou conta inativa' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [check_fayol_id_dto_1.CheckFayolIdDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "checkFayolId", null);
__decorate([
    (0, common_1.Post)('verify-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Verificar senha - Etapa 2 do login',
        description: 'Completa o processo de login verificando a senha do usuário.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Login realizado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Senha incorreta' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_password_dto_1.VerifyPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyPassword", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Renovar token de acesso' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Token renovado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Token inválido' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Encerrar sessão' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Logout realizado com sucesso' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('2fa/generate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Gerar secret 2FA e QR Code' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Secret e QR Code gerados' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '2FA já está ativado' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "generateTwoFactorSecret", null);
__decorate([
    (0, common_1.Post)('2fa/enable'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Ativar 2FA com verificação de código' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '2FA ativado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Código 2FA inválido ou 2FA já ativado' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "enableTwoFactor", null);
__decorate([
    (0, common_1.Post)('2fa/disable'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Desativar 2FA' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '2FA desativado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Código 2FA inválido ou 2FA não está ativado' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "disableTwoFactor", null);
__decorate([
    (0, common_1.Get)('2fa/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Verificar status do 2FA' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status do 2FA' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getTwoFactorStatus", null);
__decorate([
    (0, common_1.Post)('login-2fa'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Login com suporte a 2FA',
        description: 'Login que verifica se o usuário tem 2FA ativado e solicita o código quando necessário.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Login realizado com sucesso ou código 2FA necessário' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Credenciais inválidas ou código 2FA incorreto' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginWithTwoFactor", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map