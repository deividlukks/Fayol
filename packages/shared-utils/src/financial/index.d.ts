export declare const FinancialUtils: {
    /**
     * Calcula o progresso de um orçamento em porcentagem
     * @param spent Valor gasto (ex: 500)
     * @param total Valor total do orçamento (ex: 1000)
     * @returns number (ex: 50)
     */
    calculateBudgetProgress: (spent: number, total: number) => number;
    /**
     * Calcula o valor de cada parcela (divisão simples)
     */
    calculateInstallmentValue: (totalAmount: number, installments: number) => number;
    /**
     * Calcula variação percentual entre dois valores (ex: mês atual vs mês passado)
     */
    calculateVariation: (current: number, previous: number) => number;
};
//# sourceMappingURL=index.d.ts.map