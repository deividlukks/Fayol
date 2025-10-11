import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CheckFayolIdDto } from './dto/check-fayol-id.dto';
import { VerifyPasswordDto } from './dto/verify-password.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
        idType: import("./utils/fayol-id.util").FayolIdType;
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
    refresh(req: any): Promise<{
        accessToken: string;
        tokenType: string;
        expiresIn: string;
    }>;
    logout(): Promise<{
        message: string;
    }>;
    generateTwoFactorSecret(user: any): Promise<{
        secret: string;
        qrCode: string;
        otpauthUrl: string;
        message: string;
    }>;
    enableTwoFactor(user: any, body: {
        token: string;
    }): Promise<{
        message: string;
        twoFactorEnabled: boolean;
    }>;
    disableTwoFactor(user: any, body: {
        token: string;
    }): Promise<{
        message: string;
        twoFactorEnabled: boolean;
    }>;
    getTwoFactorStatus(user: any): Promise<{
        twoFactorEnabled: boolean;
    }>;
    loginWithTwoFactor(body: {
        fayolId: string;
        password: string;
        twoFactorToken?: string;
    }): Promise<{
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
