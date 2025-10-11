import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CheckFayolIdDto } from './dto/check-fayol-id.dto';
import { VerifyPasswordDto } from './dto/verify-password.dto';
import { FayolIdType } from './utils/fayol-id.util';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(registerDto: RegisterDto): Promise<{
        accessToken: string;
        tokenType: string;
        expiresIn: string;
        user: {
            id: string;
            email: string;
            phone: string;
            cpf: string;
            name: string;
            createdAt: Date;
            investorProfile: string;
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        tokenType: string;
        expiresIn: string;
        user: {
            id: string;
            name: string;
            email: string;
            phone: string;
            cpf: string;
            investorProfile: string;
        };
    }>;
    checkFayolId(checkFayolIdDto: CheckFayolIdDto): Promise<{
        exists: boolean;
        idType: FayolIdType;
        user: {
            name: string;
            email: string;
            phone: string;
            cpf: string;
        };
        stepToken: string;
    }>;
    verifyPassword(verifyPasswordDto: VerifyPasswordDto): Promise<{
        accessToken: string;
        tokenType: string;
        expiresIn: string;
        user: {
            id: string;
            name: string;
            email: string;
            phone: string;
            cpf: string;
            investorProfile: string;
        };
    }>;
    private maskEmail;
    private maskPhone;
    private maskCpf;
    private generateStepToken;
    validateUser(userId: string): Promise<{
        id: string;
        email: string;
        phone: string;
        name: string;
        isActive: boolean;
        investorProfile: string;
    }>;
    refresh(userId: string, email: string): Promise<{
        accessToken: string;
        tokenType: string;
        expiresIn: string;
    }>;
    private generateToken;
    generateTwoFactorSecret(userId: string): Promise<{
        secret: string;
        qrCode: string;
        otpauthUrl: string;
        message: string;
    }>;
    enableTwoFactor(userId: string, token: string): Promise<{
        message: string;
        twoFactorEnabled: boolean;
    }>;
    disableTwoFactor(userId: string, token: string): Promise<{
        message: string;
        twoFactorEnabled: boolean;
    }>;
    getTwoFactorStatus(userId: string): Promise<{
        twoFactorEnabled: boolean;
    }>;
    verifyTwoFactorToken(userId: string, token: string): Promise<boolean>;
    loginWithTwoFactor(fayolId: string, password: string, twoFactorToken?: string): Promise<{
        requiresTwoFactor: boolean;
        message: string;
    } | {
        accessToken: string;
        tokenType: string;
        expiresIn: string;
        requiresTwoFactor: boolean;
        user: {
            id: string;
            name: string;
            email: string;
            phone: string;
            cpf: string;
            investorProfile: string;
        };
        message?: undefined;
    }>;
}
