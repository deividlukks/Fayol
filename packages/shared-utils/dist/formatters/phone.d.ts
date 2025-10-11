/**
 * Formata um número de telefone brasileiro
 * Exemplo: "11999999999" -> "(11) 99999-9999"
 */
export declare function formatPhone(phone: string): string;
/**
 * Remove formatação de telefone
 * Exemplo: "(11) 99999-9999" -> "11999999999"
 */
export declare function unformatPhone(phone: string): string;
/**
 * Valida um número de telefone brasileiro
 */
export declare function isValidPhone(phone: string): boolean;
