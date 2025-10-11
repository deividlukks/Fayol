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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const prisma_service_1 = require("../prisma/prisma.service");
const fayol_id_util_1 = require("./utils/fayol-id.util");
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async register(registerDto) {
        const { email, phone, cpf, password, ...rest } = registerDto;
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [{ email }, { phone }, ...(cpf ? [{ cpf }] : [])],
            },
        });
        if (existingUser) {
            if (existingUser.email === email) {
                throw new common_1.ConflictException('Email já cadastrado');
            }
            if (existingUser.phone === phone) {
                throw new common_1.ConflictException('Telefone já cadastrado');
            }
            if (cpf && existingUser.cpf === cpf) {
                throw new common_1.ConflictException('CPF já cadastrado');
            }
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await this.prisma.user.create({
            data: {
                email,
                phone,
                cpf,
                password: hashedPassword,
                ...rest,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                cpf: true,
                investorProfile: true,
                createdAt: true,
            },
        });
        const token = await this.generateToken(user.id, user.email);
        return {
            user,
            ...token,
        };
    }
    async login(loginDto) {
        const { email, password } = loginDto;
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        }
        const token = await this.generateToken(user.id, user.email);
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                cpf: user.cpf,
                investorProfile: user.investorProfile,
            },
            ...token,
        };
    }
    async checkFayolId(checkFayolIdDto) {
        const { fayolId } = checkFayolIdDto;
        const idResult = fayol_id_util_1.FayolIdUtil.identify(fayolId);
        if (!idResult.isValid) {
            throw new common_1.BadRequestException('Fayol ID inválido. Use email, telefone ou CPF válido.');
        }
        const whereCondition = fayol_id_util_1.FayolIdUtil.generatePrismaWhere(fayolId);
        if (!whereCondition) {
            throw new common_1.BadRequestException('Não foi possível processar o Fayol ID fornecido.');
        }
        const user = await this.prisma.user.findFirst({
            where: whereCondition,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                cpf: true,
                isActive: true,
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Fayol ID não encontrado');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Conta inativa. Entre em contato com o suporte.');
        }
        return {
            exists: true,
            idType: idResult.type,
            user: {
                name: user.name,
                email: this.maskEmail(user.email),
                phone: this.maskPhone(user.phone),
                cpf: user.cpf ? this.maskCpf(user.cpf) : null,
            },
            stepToken: this.generateStepToken(fayolId),
        };
    }
    async verifyPassword(verifyPasswordDto) {
        const { fayolId, password } = verifyPasswordDto;
        const idResult = fayol_id_util_1.FayolIdUtil.identify(fayolId);
        if (!idResult.isValid) {
            throw new common_1.BadRequestException('Fayol ID inválido');
        }
        const whereCondition = fayol_id_util_1.FayolIdUtil.generatePrismaWhere(fayolId);
        const user = await this.prisma.user.findFirst({
            where: whereCondition,
        });
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Senha incorreta');
        }
        const token = await this.generateToken(user.id, user.email);
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                cpf: user.cpf,
                investorProfile: user.investorProfile,
            },
            ...token,
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
            type: 'step',
            exp: Math.floor(Date.now() / 1000) + 300,
        };
        return this.jwtService.sign(payload);
    }
    async validateUser(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                investorProfile: true,
                isActive: true,
            },
        });
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException('Usuário não encontrado ou inativo');
        }
        return user;
    }
    async refresh(userId, email) {
        await this.validateUser(userId);
        return this.generateToken(userId, email);
    }
    async generateToken(userId, email) {
        const payload = { sub: userId, email };
        return {
            accessToken: this.jwtService.sign(payload),
            tokenType: 'Bearer',
            expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        };
    }
    async generateTwoFactorSecret(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true, twoFactorEnabled: true },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Usuário não encontrado');
        }
        if (user.twoFactorEnabled) {
            throw new common_1.BadRequestException('2FA já está ativado. Desative primeiro para gerar um novo código.');
        }
        const secret = speakeasy.generateSecret({
            name: `Fayol (${user.email})`,
            issuer: 'Fayol',
            length: 32,
        });
        const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);
        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret.base32 },
        });
        return {
            secret: secret.base32,
            qrCode: qrCodeDataUrl,
            otpauthUrl: secret.otpauth_url,
            message: 'Escaneie o QR Code no seu aplicativo autenticador (Google Authenticator, Authy, etc) e confirme com um código para ativar o 2FA.',
        };
    }
    async enableTwoFactor(userId, token) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, twoFactorSecret: true, twoFactorEnabled: true },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Usuário não encontrado');
        }
        if (user.twoFactorEnabled) {
            throw new common_1.BadRequestException('2FA já está ativado');
        }
        if (!user.twoFactorSecret) {
            throw new common_1.BadRequestException('Secret 2FA não encontrado. Gere um novo secret primeiro.');
        }
        const isValid = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token,
            window: 2,
        });
        if (!isValid) {
            throw new common_1.BadRequestException('Código 2FA inválido');
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: true },
        });
        return {
            message: '2FA ativado com sucesso!',
            twoFactorEnabled: true,
        };
    }
    async disableTwoFactor(userId, token) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, twoFactorSecret: true, twoFactorEnabled: true },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Usuário não encontrado');
        }
        if (!user.twoFactorEnabled) {
            throw new common_1.BadRequestException('2FA não está ativado');
        }
        if (!user.twoFactorSecret) {
            throw new common_1.BadRequestException('Secret 2FA não encontrado');
        }
        const isValid = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token,
            window: 2,
        });
        if (!isValid) {
            throw new common_1.BadRequestException('Código 2FA inválido');
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
            },
        });
        return {
            message: '2FA desativado com sucesso',
            twoFactorEnabled: false,
        };
    }
    async getTwoFactorStatus(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { twoFactorEnabled: true },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Usuário não encontrado');
        }
        return {
            twoFactorEnabled: user.twoFactorEnabled,
        };
    }
    async verifyTwoFactorToken(userId, token) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { twoFactorSecret: true, twoFactorEnabled: true },
        });
        if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
            return false;
        }
        return speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token,
            window: 2,
        });
    }
    async loginWithTwoFactor(fayolId, password, twoFactorToken) {
        const idResult = fayol_id_util_1.FayolIdUtil.identify(fayolId);
        if (!idResult.isValid) {
            throw new common_1.BadRequestException('Fayol ID inválido');
        }
        const whereCondition = fayol_id_util_1.FayolIdUtil.generatePrismaWhere(fayolId);
        const user = await this.prisma.user.findFirst({
            where: whereCondition,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                cpf: true,
                password: true,
                investorProfile: true,
                isActive: true,
                twoFactorEnabled: true,
                twoFactorSecret: true,
            },
        });
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Senha incorreta');
        }
        if (user.twoFactorEnabled) {
            if (!twoFactorToken) {
                return {
                    requiresTwoFactor: true,
                    message: 'Código 2FA necessário. Por favor, insira o código do seu aplicativo autenticador.',
                };
            }
            const isTokenValid = await this.verifyTwoFactorToken(user.id, twoFactorToken);
            if (!isTokenValid) {
                throw new common_1.UnauthorizedException('Código 2FA inválido');
            }
        }
        const token = await this.generateToken(user.id, user.email);
        return {
            requiresTwoFactor: false,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                cpf: user.cpf,
                investorProfile: user.investorProfile,
            },
            ...token,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map