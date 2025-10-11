"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FayolIdUtil = exports.FayolIdType = void 0;
var FayolIdType;
(function (FayolIdType) {
    FayolIdType["EMAIL"] = "email";
    FayolIdType["PHONE"] = "phone";
    FayolIdType["CPF"] = "cpf";
})(FayolIdType || (exports.FayolIdType = FayolIdType = {}));
class FayolIdUtil {
    static identify(fayolId) {
        const normalized = fayolId.trim();
        if (this.isEmail(normalized)) {
            return {
                type: FayolIdType.EMAIL,
                value: normalized.toLowerCase(),
                isValid: true,
            };
        }
        if (this.isPhone(normalized)) {
            return {
                type: FayolIdType.PHONE,
                value: this.normalizePhone(normalized),
                isValid: true,
            };
        }
        if (this.isCpf(normalized)) {
            return {
                type: FayolIdType.CPF,
                value: this.normalizeCpf(normalized),
                isValid: this.validateCpf(normalized),
            };
        }
        return {
            type: null,
            value: normalized,
            isValid: false,
        };
    }
    static isEmail(value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    }
    static isPhone(value) {
        const phoneRegex = /^[0-9]{10,11}$/;
        const digitsOnly = value.replace(/\D/g, '');
        return phoneRegex.test(digitsOnly);
    }
    static normalizePhone(value) {
        return value.replace(/\D/g, '');
    }
    static isCpf(value) {
        const digitsOnly = value.replace(/\D/g, '');
        return digitsOnly.length === 11;
    }
    static normalizeCpf(value) {
        return value.replace(/\D/g, '');
    }
    static validateCpf(value) {
        const cpf = value.replace(/\D/g, '');
        if (cpf.length !== 11) {
            return false;
        }
        const invalidCpfs = [
            '00000000000',
            '11111111111',
            '22222222222',
            '33333333333',
            '44444444444',
            '55555555555',
            '66666666666',
            '77777777777',
            '88888888888',
            '99999999999',
        ];
        if (invalidCpfs.includes(cpf)) {
            return false;
        }
        let sum = 0;
        let remainder;
        for (let i = 1; i <= 9; i++) {
            sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) {
            remainder = 0;
        }
        if (remainder !== parseInt(cpf.substring(9, 10))) {
            return false;
        }
        sum = 0;
        for (let i = 1; i <= 10; i++) {
            sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) {
            remainder = 0;
        }
        if (remainder !== parseInt(cpf.substring(10, 11))) {
            return false;
        }
        return true;
    }
    static generatePrismaWhere(fayolId) {
        const result = this.identify(fayolId);
        if (!result.isValid) {
            return null;
        }
        switch (result.type) {
            case FayolIdType.EMAIL:
                return { email: result.value };
            case FayolIdType.PHONE:
                return { phone: result.value };
            case FayolIdType.CPF:
                return { cpf: result.value };
            default:
                return null;
        }
    }
}
exports.FayolIdUtil = FayolIdUtil;
//# sourceMappingURL=fayol-id.util.js.map