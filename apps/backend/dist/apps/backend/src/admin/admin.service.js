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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
const prisma_service_1 = require("../prisma/prisma.service");
const admin_fayol_id_util_1 = require("./utils/admin-fayol-id.util");
let AdminService = class AdminService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async checkAdminId(checkAdminIdDto) {
        const { fayolId } = checkAdminIdDto;
        const idResult = admin_fayol_id_util_1.AdminFayolIdUtil.identify(fayolId);
        if (!idResult.isValid) {
            throw new common_1.BadRequestException('Fayol ID inválido. Use email, telefone ou CPF válido.');
        }
        const whereCondition = admin_fayol_id_util_1.AdminFayolIdUtil.generateAdminPrismaWhere(fayolId);
        if (!whereCondition) {
            throw new common_1.BadRequestException('Não foi possível processar o Fayol ID fornecido.');
        }
        const admin = await this.prisma.admin.findFirst({
            where: whereCondition,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                cpf: true,
                role: true,
                isActive: true,
            },
        });
        if (!admin) {
            throw new common_1.UnauthorizedException('Admin Fayol ID não encontrado');
        }
        if (!admin.isActive) {
            throw new common_1.UnauthorizedException('Conta administrativa inativa. Entre em contato com o super admin.');
        }
        return {
            exists: true,
            idType: idResult.type,
            admin: {
                name: admin.name,
                role: admin.role,
                email: this.maskEmail(admin.email),
                phone: admin.phone ? this.maskPhone(admin.phone) : null,
                cpf: admin.cpf ? this.maskCpf(admin.cpf) : null,
            },
            stepToken: this.generateStepToken(fayolId),
        };
    }
    async verifyAdminPassword(verifyPasswordDto) {
        const { fayolId, password } = verifyPasswordDto;
        const idResult = admin_fayol_id_util_1.AdminFayolIdUtil.identify(fayolId);
        if (!idResult.isValid) {
            throw new common_1.BadRequestException('Fayol ID inválido');
        }
        const whereCondition = admin_fayol_id_util_1.AdminFayolIdUtil.generateAdminPrismaWhere(fayolId);
        const admin = await this.prisma.admin.findFirst({
            where: whereCondition,
        });
        if (!admin || !admin.isActive) {
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        }
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Senha incorreta');
        }
        await this.createAuditLog(admin.id, 'LOGIN', 'Admin', admin.id);
        const token = await this.generateToken(admin.id, admin.email, admin.role);
        return {
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                phone: admin.phone,
                cpf: admin.cpf,
                role: admin.role,
            },
            ...token,
        };
    }
    async validateAdmin(adminId) {
        const admin = await this.prisma.admin.findUnique({
            where: { id: adminId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                cpf: true,
                role: true,
                isActive: true,
            },
        });
        if (!admin || !admin.isActive) {
            throw new common_1.UnauthorizedException('Admin não encontrado ou inativo');
        }
        return admin;
    }
    async logout(adminId) {
        await this.createAuditLog(adminId, 'LOGOUT', 'Admin', adminId);
        return {
            message: 'Logout realizado com sucesso',
        };
    }
    maskEmail(email) {
        const [username, domain] = email.split('@');
        const maskedUsername = username.charAt(0) + '***';
        return `${maskedUsername}@${domain}`;
    }
    maskPhone(phone) {
        if (phone.length === 11) {
            return `(${phone.substring(0, 2)}) *****-${phone.substring(7)}`;
        }
        if (phone.length === 10) {
            return `(${phone.substring(0, 2)}) ****-${phone.substring(6)}`;
        }
        return '***';
    }
    maskCpf(cpf) {
        return `***.${cpf.substring(3, 6)}.${cpf.substring(6, 9)}-**`;
    }
    generateStepToken(fayolId) {
        const payload = {
            fayolId,
            type: 'admin_step',
            exp: Math.floor(Date.now() / 1000) + 300,
        };
        return this.jwtService.sign(payload);
    }
    async generateToken(adminId, email, role) {
        const payload = {
            sub: adminId,
            email,
            role,
            type: 'admin',
        };
        return {
            accessToken: this.jwtService.sign(payload),
            tokenType: 'Bearer',
            expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        };
    }
    async createAuditLog(adminId, action, entity, entityId, oldValue, newValue) {
        try {
            await this.prisma.auditLog.create({
                data: {
                    adminId,
                    action,
                    entity,
                    entityId,
                    oldValue: oldValue || null,
                    newValue: newValue || null,
                },
            });
        }
        catch (error) {
            console.error('Erro ao criar audit log:', error);
        }
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AdminService);
//# sourceMappingURL=admin.service.js.map