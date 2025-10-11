/**
 * Valida um CPF brasileiro
 */
export declare function isValidCPF(cpf: string): boolean;
/**
 * Formata um CPF
 * Exemplo: "12345678901" -> "123.456.789-01"
 */
export declare function formatCPF(cpf: string): string;
/**
 * Remove formatação do CPF
 */
export declare function unformatCPF(cpf: string): string;
