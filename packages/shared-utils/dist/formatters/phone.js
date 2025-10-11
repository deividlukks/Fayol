"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPhone = formatPhone;
exports.unformatPhone = unformatPhone;
exports.isValidPhone = isValidPhone;
/**
 * Formata um número de telefone brasileiro
 * Exemplo: "11999999999" -> "(11) 99999-9999"
 */
function formatPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
}
/**
 * Remove formatação de telefone
 * Exemplo: "(11) 99999-9999" -> "11999999999"
 */
function unformatPhone(phone) {
    return phone.replace(/\D/g, '');
}
/**
 * Valida um número de telefone brasileiro
 */
function isValidPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return /^[1-9]{2}9?\d{8}$/.test(cleaned);
}
