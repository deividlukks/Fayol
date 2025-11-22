"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialUtils = void 0;
exports.FinancialUtils = {
    /**
     * Calcula o progresso de um orçamento em porcentagem
     * @param spent Valor gasto (ex: 500)
     * @param total Valor total do orçamento (ex: 1000)
     * @returns number (ex: 50)
     */
    calculateBudgetProgress: (spent, total) => {
        if (total === 0)
            return 0;
        const percentage = (spent / total) * 100;
        return Math.min(percentage, 100); // Trava em 100% visualmente
    },
    /**
     * Calcula o valor de cada parcela (divisão simples)
     */
    calculateInstallmentValue: (totalAmount, installments) => {
        if (installments <= 0)
            return totalAmount;
        return Number((totalAmount / installments).toFixed(2));
    },
    /**
     * Calcula variação percentual entre dois valores (ex: mês atual vs mês passado)
     */
    calculateVariation: (current, previous) => {
        if (previous === 0)
            return current > 0 ? 100 : 0;
        return ((current - previous) / Math.abs(previous)) * 100;
    },
};
//# sourceMappingURL=index.js.map