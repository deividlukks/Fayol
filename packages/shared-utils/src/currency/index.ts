import { APP_CONFIG } from '@fayol/shared-constants';

export const CurrencyUtils = {
  // Formata um número para moeda (ex: R$ 1.250,00)
  format: (value: number, currency = APP_CONFIG.DEFAULT_CURRENCY): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(value);
  },

  // Converte string de moeda (R$ 1.200,50) para number (1200.50)
  // Útil para inputs de formulários
  parse: (value: string): number => {
    if (!value) return 0;
    // Remove tudo que não é dígito, vírgula, ponto ou sinal de menos
    let cleanValue = value.replace(/[^\d,.-]/g, '');

    // Se contém vírgula, assume formato BR (vírgula = decimal, ponto = milhares)
    if (cleanValue.includes(',')) {
      cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
    }

    return parseFloat(cleanValue) || 0;
  },
};
