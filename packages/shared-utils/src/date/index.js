"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateUtils = void 0;
const date_fns_1 = require("date-fns");
const locale_1 = require("date-fns/locale");
exports.DateUtils = {
    // Formata data para exibição (ex: 25/12/2023)
    formatDate: (date) => {
        const dateObj = typeof date === 'string' ? (0, date_fns_1.parseISO)(date) : date;
        return (0, date_fns_1.format)(dateObj, 'dd/MM/yyyy', { locale: locale_1.ptBR });
    },
    // Formata data e hora (ex: 25/12/2023 às 14:30)
    formatDateTime: (date) => {
        const dateObj = typeof date === 'string' ? (0, date_fns_1.parseISO)(date) : date;
        return (0, date_fns_1.format)(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: locale_1.ptBR });
    },
    // Formata para o banco de dados ou API (ISO 8601)
    toISO: (date) => {
        return date.toISOString();
    },
    // Retorna o primeiro dia do mês
    getStartOfMonth: (date = new Date()) => {
        return (0, date_fns_1.startOfMonth)(date);
    },
    // Retorna o último dia do mês
    getEndOfMonth: (date = new Date()) => {
        return (0, date_fns_1.endOfMonth)(date);
    },
    addDays: date_fns_1.addDays,
    subDays: date_fns_1.subDays,
    isAfter: date_fns_1.isAfter,
    isBefore: date_fns_1.isBefore,
};
//# sourceMappingURL=index.js.map