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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_service_1 = require("./admin.service");
const check_admin_id_dto_1 = require("./dto/check-admin-id.dto");
const verify_admin_password_dto_1 = require("./dto/verify-admin-password.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    async checkAdminId(checkAdminIdDto) {
        return this.adminService.checkAdminId(checkAdminIdDto);
    }
    async verifyAdminPassword(verifyPasswordDto) {
        return this.adminService.verifyAdminPassword(verifyPasswordDto);
    }
    async logout(req) {
        return this.adminService.logout(req.user.userId);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Post)('check-id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Verificar Admin Fayol ID - Etapa 1 do login admin',
        description: 'Verifica se o Admin Fayol ID (email, telefone ou CPF) existe e retorna informações básicas.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Admin Fayol ID encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Fayol ID inválido' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Admin não encontrado ou conta inativa' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [check_admin_id_dto_1.CheckAdminIdDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "checkAdminId", null);
__decorate([
    (0, common_1.Post)('verify-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Verificar senha admin - Etapa 2 do login admin',
        description: 'Completa o processo de login administrativo verificando a senha.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Login admin realizado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Senha incorreta' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_admin_password_dto_1.VerifyAdminPasswordDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "verifyAdminPassword", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Logout administrativo' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Logout realizado com sucesso' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "logout", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('admin-auth'),
    (0, common_1.Controller)('admin/auth'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map