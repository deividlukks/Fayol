"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Formatters = void 0;
exports.Formatters = {
    // Remove caracteres não numéricos
    onlyNumbers: (value) => {
        return value.replace(/\D/g, '');
    },
    // Formata CPF (000.000.000-00)
    cpf: (value) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    },
    // Formata Celular ( (00) 00000-0000 )
    phone: (value) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1');
    },
};
//# sourceMappingURL=index.js.map