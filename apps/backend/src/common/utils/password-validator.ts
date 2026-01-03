import { BadRequestException } from '@nestjs/common';

/**
 * Interface para resultado de validação de senha
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Requisitos de senha
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
} as const;

/**
 * Valida se a senha atende aos requisitos de segurança
 *
 * @param password - Senha a ser validada
 * @returns Resultado da validação
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  // Verifica se a senha foi fornecida
  if (!password) {
    errors.push('Senha é obrigatória.');
    return { isValid: false, errors };
  }

  // Verifica comprimento mínimo
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`A senha deve ter pelo menos ${PASSWORD_REQUIREMENTS.minLength} caracteres.`);
  }

  // Verifica comprimento máximo
  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`A senha deve ter no máximo ${PASSWORD_REQUIREMENTS.maxLength} caracteres.`);
  }

  // Verifica letra maiúscula
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra maiúscula.');
  }

  // Verifica letra minúscula
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra minúscula.');
  }

  // Verifica número
  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    errors.push('A senha deve conter pelo menos um número.');
  }

  // Verifica caractere especial
  if (PASSWORD_REQUIREMENTS.requireSpecialChars) {
    const specialCharsRegex = new RegExp(
      `[${PASSWORD_REQUIREMENTS.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`
    );
    if (!specialCharsRegex.test(password)) {
      errors.push(
        'A senha deve conter pelo menos um caractere especial (!@#$%^&*()_+-=[]{}|;:,.<>?).'
      );
    }
  }

  // Verifica senhas comuns (blacklist básica)
  const commonPasswords = [
    'password',
    'Password1',
    'Password123',
    '12345678',
    'qwerty123',
    'abc123456',
    'password1',
    'Senha123',
    'Admin123',
    'Welcome1',
  ];

  if (commonPasswords.some((common) => password.toLowerCase().includes(common.toLowerCase()))) {
    errors.push('Esta senha é muito comum. Por favor, escolha uma senha mais segura.');
  }

  // Verifica sequências simples
  const hasSequence = /(.)\1{2,}/.test(password); // Ex: "aaa", "111"
  if (hasSequence) {
    errors.push('A senha não deve conter sequências repetidas de caracteres.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida a senha e lança exceção se inválida
 *
 * @param password - Senha a ser validada
 * @throws BadRequestException se a senha for inválida
 */
export function validatePasswordOrFail(password: string): void {
  const result = validatePassword(password);

  if (!result.isValid) {
    throw new BadRequestException({
      message: 'Senha não atende aos requisitos de segurança.',
      errors: result.errors,
      requirements: {
        minLength: PASSWORD_REQUIREMENTS.minLength,
        mustContain: [
          'Pelo menos uma letra maiúscula (A-Z)',
          'Pelo menos uma letra minúscula (a-z)',
          'Pelo menos um número (0-9)',
          'Pelo menos um caractere especial (!@#$%^&*...)',
        ],
      },
    });
  }
}

/**
 * Retorna a força da senha (0-100)
 *
 * @param password - Senha a ser avaliada
 * @returns Número de 0 a 100 representando a força da senha
 */
export function getPasswordStrength(password: string): number {
  if (!password) return 0;

  let strength = 0;

  // Comprimento (max 40 pontos)
  strength += Math.min(40, password.length * 2);

  // Diversidade de caracteres (max 60 pontos)
  if (/[a-z]/.test(password)) strength += 10;
  if (/[A-Z]/.test(password)) strength += 10;
  if (/\d/.test(password)) strength += 10;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 15;

  // Bonus por diversidade adicional
  const uniqueChars = new Set(password).size;
  strength += Math.min(15, uniqueChars);

  return Math.min(100, strength);
}

/**
 * Gera sugestões para melhorar a senha
 *
 * @param password - Senha a ser analisada
 * @returns Array de sugestões
 */
export function getPasswordSuggestions(password: string): string[] {
  const suggestions: string[] = [];
  const validation = validatePassword(password);

  if (validation.isValid) {
    return ['Sua senha está forte!'];
  }

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    suggestions.push(
      `Adicione mais ${PASSWORD_REQUIREMENTS.minLength - password.length} caracteres.`
    );
  }

  if (!/[A-Z]/.test(password)) {
    suggestions.push('Adicione letras maiúsculas.');
  }

  if (!/[a-z]/.test(password)) {
    suggestions.push('Adicione letras minúsculas.');
  }

  if (!/\d/.test(password)) {
    suggestions.push('Adicione números.');
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    suggestions.push('Adicione caracteres especiais como !@#$%.');
  }

  return suggestions;
}
