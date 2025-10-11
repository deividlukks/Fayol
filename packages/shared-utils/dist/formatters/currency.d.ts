/**
 * Formata um número para o formato de moeda brasileira (BRL)
 */
export declare function formatCurrency(value: number): string;
/**
 * Converte uma string de moeda para número
 * Exemplo: "R$ 1.234,56" -> 1234.56
 */
export declare function parseCurrency(value: string): number;
/**
 * Valida se uma string é um valor monetário válido
 */
export declare function isValidCurrency(value: string): boolean;
