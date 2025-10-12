/**
 * Tipo de identificação do Fayol ID
 */
export enum FayolIdType {
  EMAIL = 'email',
  PHONE = 'phone',
  CPF = 'cpf',
}

/**
 * Resultado da identificação do Fayol ID
 */
export interface FayolIdResult {
  type: FayolIdType;
  value: string;
  isValid: boolean;
}

/**
 * Utilitário para identificar e validar Fayol ID
 */
export class FayolIdUtil {
  /**
   * Identifica o tipo de Fayol ID (email, phone ou CPF)
   */
  static identify(fayolId: string): FayolIdResult {
    const normalized = fayolId.trim();

    // Verifica se é email
    if (this.isEmail(normalized)) {
      return {
        type: FayolIdType.EMAIL,
        value: normalized.toLowerCase(),
        isValid: true,
      };
    }

    // Verifica se é telefone
    if (this.isPhone(normalized)) {
      return {
        type: FayolIdType.PHONE,
        value: this.normalizePhone(normalized),
        isValid: true,
      };
    }

    // Verifica se é CPF
    if (this.isCpf(normalized)) {
      return {
        type: FayolIdType.CPF,
        value: this.normalizeCpf(normalized),
        isValid: this.validateCpf(normalized),
      };
    }

    // ID inválido
    return {
      type: FayolIdType.EMAIL, // Tipo padrão para IDs inválidos
      value: normalized,
      isValid: false,
    };
  }

  /**
   * Verifica se é um email válido
   */
  private static isEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  /**
   * Verifica se é um telefone válido (10 ou 11 dígitos)
   */
  private static isPhone(value: string): boolean {
    const phoneRegex = /^[0-9]{10,11}$/;
    const digitsOnly = value.replace(/\D/g, '');
    return phoneRegex.test(digitsOnly);
  }

  /**
   * Normaliza telefone (remove caracteres não numéricos)
   */
  private static normalizePhone(value: string): string {
    return value.replace(/\D/g, '');
  }

  /**
   * Verifica se é um CPF (11 dígitos)
   */
  private static isCpf(value: string): boolean {
    const digitsOnly = value.replace(/\D/g, '');
    return digitsOnly.length === 11;
  }

  /**
   * Normaliza CPF (remove caracteres não numéricos)
   */
  private static normalizeCpf(value: string): string {
    return value.replace(/\D/g, '');
  }

  /**
   * Valida CPF usando algoritmo oficial
   */
  private static validateCpf(value: string): boolean {
    const cpf = value.replace(/\D/g, '');

    // CPF deve ter 11 dígitos
    if (cpf.length !== 11) {
      return false;
    }

    // CPFs inválidos conhecidos (todos dígitos iguais)
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

    // Validação dos dígitos verificadores
    let sum = 0;
    let remainder;

    // Valida primeiro dígito
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

    // Valida segundo dígito
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

  /**
   * Gera condição Prisma WHERE para buscar usuário por Fayol ID
   */
  static generatePrismaWhere(fayolId: string) {
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
