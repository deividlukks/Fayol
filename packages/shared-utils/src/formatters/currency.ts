/**
 * Formata um número para o formato de moeda brasileira (BRL)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Converte uma string de moeda para número
 * Exemplo: "R$ 1.234,56" -> 1234.56
 */
export function parseCurrency(value: string): number {
  const cleanValue = value
    .replace(/[^\d,-]/g, '') // Remove tudo exceto dígitos, vírgula e hífen
    .replace(',', '.'); // Substitui vírgula por ponto

  return parseFloat(cleanValue) || 0;
}

/**
 * Valida se uma string é um valor monetário válido
 */
export function isValidCurrency(value: string): boolean {
  const currencyRegex = /^R?\$?\s?-?\d{1,3}(\.\d{3})*,\d{2}$/;
  return currencyRegex.test(value.trim());
}
