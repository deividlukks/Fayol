"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTransactionText = parseTransactionText;
exports.formatCurrency = formatCurrency;
exports.formatDate = formatDate;
exports.formatDateTime = formatDateTime;
/**
 * Parse transaction text in various formats:
 * - "50 Uber para o trabalho"
 * - "R$ 50,00 Uber para o trabalho"
 * - "Uber para o trabalho 50"
 * - "Uber para o trabalho R$ 50,00"
 */
function parseTransactionText(text) {
    // Remove extra whitespace
    text = text.trim().replace(/\s+/g, ' ');
    // Patterns to match
    const patterns = [
        // "50 description" or "50.50 description" or "50,50 description"
        /^([0-9]+[.,]?[0-9]*)\s+(.+)$/,
        // "R$ 50 description" or "R$ 50.50 description"
        /^R\$\s*([0-9]+[.,]?[0-9]*)\s+(.+)$/i,
        // "description 50" or "description 50.50"
        /^(.+)\s+([0-9]+[.,]?[0-9]*)$/,
        // "description R$ 50" or "description R$ 50.50"
        /^(.+)\s+R\$\s*([0-9]+[.,]?[0-9]*)$/i,
    ];
    for (let i = 0; i < patterns.length; i++) {
        const match = text.match(patterns[i]);
        if (match) {
            let amount;
            let description;
            if (i < 2) {
                // Amount comes first
                amount = parseFloat(match[1].replace(',', '.'));
                description = match[2].trim();
            }
            else {
                // Amount comes last
                amount = parseFloat(match[2].replace(',', '.'));
                description = match[1].trim();
            }
            if (!isNaN(amount) && amount > 0 && description) {
                return { amount, description };
            }
        }
    }
    return null;
}
/**
 * Format currency value to Brazilian Real
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}
/**
 * Format date to Brazilian format
 */
function formatDate(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(d);
}
/**
 * Format date and time to Brazilian format
 */
function formatDateTime(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(d);
}
//# sourceMappingURL=parser.js.map