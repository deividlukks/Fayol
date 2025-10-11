/**
 * Formata uma data para o formato brasileiro (dd/MM/yyyy)
 */
export declare function formatDate(date: Date | string): string;
/**
 * Formata uma data com hora (dd/MM/yyyy HH:mm)
 */
export declare function formatDateTime(date: Date | string): string;
/**
 * Formata uma data de forma relativa (hoje, ontem, há 2 dias, etc.)
 */
export declare function formatRelativeDate(date: Date | string): string;
/**
 * Converte uma string de data brasileira para Date
 * Exemplo: "25/12/2023" -> Date
 */
export declare function parseDate(dateString: string): Date | null;
/**
 * Verifica se uma data é válida
 */
export declare function isValidDate(date: any): boolean;
