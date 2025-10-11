"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminFayolIdUtil = void 0;
const fayol_id_util_1 = require("../../auth/utils/fayol-id.util");
class AdminFayolIdUtil extends fayol_id_util_1.FayolIdUtil {
    static generateAdminPrismaWhere(fayolId) {
        const result = this.identify(fayolId);
        if (!result.isValid) {
            return null;
        }
        switch (result.type) {
            case fayol_id_util_1.FayolIdType.EMAIL:
                return { email: result.value };
            case fayol_id_util_1.FayolIdType.PHONE:
                return { phone: result.value };
            case fayol_id_util_1.FayolIdType.CPF:
                return { cpf: result.value };
            default:
                return null;
        }
    }
}
exports.AdminFayolIdUtil = AdminFayolIdUtil;
//# sourceMappingURL=admin-fayol-id.util.js.map