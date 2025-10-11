import { FayolIdType, FayolIdUtil } from '../../auth/utils/fayol-id.util';

/**
 * Utilitário para identificar e validar Fayol ID de administradores
 * Estende a funcionalidade do FayolIdUtil para trabalhar com o modelo Admin
 */
export class AdminFayolIdUtil extends FayolIdUtil {
  /**
   * Gera condição Prisma WHERE para buscar admin por Fayol ID
   * Nota: Admin pode ter email, phone ou CPF opcionais
   */
  static generateAdminPrismaWhere(fayolId: string) {
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
