export interface ParsedTransaction {
    amount: number;
    description: string;
}
/**
 * Parse transaction text in various formats:
 * - "50 Uber para o trabalho"
 * - "R$ 50,00 Uber para o trabalho"
 * - "Uber para o trabalho 50"
 * - "Uber para o trabalho R$ 50,00"
 */
export declare function parseTransactionText(text: string): ParsedTransaction | null;
/**
 * Format currency value to Brazilian Real
 */
export declare function formatCurrency(value: number): string;
/**
 * Format date to Brazilian format
 */
export declare function formatDate(date: Date | string): string;
/**
 * Format date and time to Brazilian format
 */
export declare function formatDateTime(date: Date | string): string;
//# sourceMappingURL=parser.d.ts.map