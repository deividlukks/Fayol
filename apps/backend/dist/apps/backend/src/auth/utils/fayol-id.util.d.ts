export declare enum FayolIdType {
    EMAIL = "email",
    PHONE = "phone",
    CPF = "cpf"
}
export interface FayolIdResult {
    type: FayolIdType;
    value: string;
    isValid: boolean;
}
export declare class FayolIdUtil {
    static identify(fayolId: string): FayolIdResult;
    private static isEmail;
    private static isPhone;
    private static normalizePhone;
    private static isCpf;
    private static normalizeCpf;
    private static validateCpf;
    static generatePrismaWhere(fayolId: string): {
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
