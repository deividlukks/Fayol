import { AdminService } from './admin.service';
import { CheckAdminIdDto } from './dto/check-admin-id.dto';
import { VerifyAdminPasswordDto } from './dto/verify-admin-password.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
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
    logout(req: any): Promise<{
        message: string;
    }>;
}
