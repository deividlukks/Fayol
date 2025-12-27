/**
 * Validadores de dados brasileiros e comuns
 */

export const Validators = {
  /**
   * Valida CPF (algoritmo oficial da Receita Federal)
   */
  cpf: (value: string): boolean => {
    const cleanValue = value.replace(/\D/g, '');

    if (cleanValue.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanValue)) return false; // Rejeita sequências iguais (111.111.111-11)

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanValue.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    const digit1 = remainder === 10 || remainder === 11 ? 0 : remainder;

    if (digit1 !== parseInt(cleanValue.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanValue.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    const digit2 = remainder === 10 || remainder === 11 ? 0 : remainder;

    return digit2 === parseInt(cleanValue.charAt(10));
  },

  /**
   * Valida CNPJ (algoritmo oficial da Receita Federal)
   */
  cnpj: (value: string): boolean => {
    const cleanValue = value.replace(/\D/g, '');

    if (cleanValue.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cleanValue)) return false; // Rejeita sequências iguais

    const calcDigit = (cnpj: string, factor: number): number => {
      let sum = 0;
      let pos = factor - 7;

      for (let i = factor; i >= 1; i--) {
        sum += parseInt(cnpj.charAt(factor - i)) * pos--;
        if (pos < 2) pos = 9;
      }

      const result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
      return result;
    };

    const digit1 = calcDigit(cleanValue, 12);
    if (digit1 !== parseInt(cleanValue.charAt(12))) return false;

    const digit2 = calcDigit(cleanValue, 13);
    return digit2 === parseInt(cleanValue.charAt(13));
  },

  /**
   * Valida E-mail (regex simples e eficaz)
   */
  email: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  /**
   * Valida telefone brasileiro (celular)
   * Aceita: (11) 98765-4321, 11987654321, +5511987654321
   */
  phone: (value: string): boolean => {
    const cleanValue = value.replace(/\D/g, '');
    // 11 dígitos: (DDD + 9 + 8 dígitos) ou 10 dígitos (fixo)
    return cleanValue.length === 11 || cleanValue.length === 10;
  },

  /**
   * Valida URL
   */
  url: (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Valida se é um número válido
   */
  number: (value: unknown): boolean => {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  },

  /**
   * Valida se é inteiro
   */
  integer: (value: unknown): boolean => {
    return Number.isInteger(value);
  },

  /**
   * Valida range de número
   */
  range: (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
  },

  /**
   * Valida comprimento de string
   */
  length: (value: string, min: number, max?: number): boolean => {
    if (max !== undefined) {
      return value.length >= min && value.length <= max;
    }
    return value.length >= min;
  },

  /**
   * Valida se string contém apenas letras
   */
  alpha: (value: string): boolean => {
    return /^[a-zA-ZÀ-ÿ\s]+$/.test(value);
  },

  /**
   * Valida se string contém apenas letras e números
   */
  alphanumeric: (value: string): boolean => {
    return /^[a-zA-Z0-9À-ÿ\s]+$/.test(value);
  },

  /**
   * Valida senha forte
   * Mínimo 8 caracteres, 1 letra, 1 número, 1 caractere especial
   */
  strongPassword: (value: string): boolean => {
    return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(value);
  },
};
