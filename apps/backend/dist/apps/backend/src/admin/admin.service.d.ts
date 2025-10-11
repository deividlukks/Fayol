import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { CheckAdminIdDto } from './dto/check-admin-id.dto';
import { VerifyAdminPasswordDto } from './dto/verify-admin-password.dto';
export declare class AdminService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    checkAdminId(checkAdminIdDto: CheckAdminIdDto): Promise<{
        exists: boolean;
        idType: import("../auth/utils/fayol-id.util").FayolIdType;
        admin: {
            name: string;
            role: string;
            email: string;
            phone: string;
            cpf: string;
        };
        stepToken: string;
    }>;
    verifyAdminPassword(verifyPasswordDto: VerifyAdminPasswordDto): Promise<{
        accessToken: string;
        tokenType: string;
        expiresIn: string;
        admin: {
            id: string;
            name: string;
            email: string;
            phone: string;
            cpf: string;
            role: string;
        };
    }>;
    validateAdmin(adminId: string): Promise<{
        id: string;
        email: string;
        phone: string;
        cpf: string;
        name: string;
        role: string;
        isActive: boolean;
    }>;
    logout(adminId: string): Promise<{
        message: string;
    }>;
    private maskEmail;
    private maskPhone;
    private maskCpf;
    private generateStepToken;
    private generateToken;
    private createAuditLog;
}
