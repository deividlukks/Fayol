"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencyUtils = void 0;
const shared_constants_1 = require("@fayol/shared-constants");
exports.CurrencyUtils = {
    // Formata um número para moeda (ex: R$ 1.250,00)
    format: (value, currency = shared_constants_1.APP_CONFIG.DEFAULT_CURRENCY) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currency,
        }).format(value);
    },
    // Converte string de moeda (R$ 1.200,50) para number (1200.50)
    // Útil para inputs de formulários
    parse: (value) => {
        if (!value)
            return 0;
        // Remove tudo que não é dígito ou vírgula/ponto decimal
        const cleanValue = value.replace(/[^\d,.-]/g, '').replace(',', '.');
        return parseFloat(cleanValue) || 0;
    },
};
//# sourceMappingURL=index.js.map