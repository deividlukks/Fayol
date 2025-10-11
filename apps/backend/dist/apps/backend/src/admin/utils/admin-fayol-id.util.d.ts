import { FayolIdUtil } from '../../auth/utils/fayol-id.util';
export declare class AdminFayolIdUtil extends FayolIdUtil {
    static generateAdminPrismaWhere(fayolId: string): {
        email: string;
        phone?: undefined;
        cpf?: undefined;
    } | {
        phone: string;
        email?: undefined;
        cpf?: undefined;
    } | {
        cpf: string;
        email?: undefined;
        phone?: undefined;
    };
}
