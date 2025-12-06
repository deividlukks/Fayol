export const FinancialUtils = {
  /**
   * Calcula o progresso de um orçamento em porcentagem
   * @param spent Valor gasto (ex: 500)
   * @param total Valor total do orçamento (ex: 1000)
   * @returns number (ex: 50)
   */
  calculateBudgetProgress: (spent: number, total: number): number => {
    if (total === 0) return 0;
    const percentage = (spent / total) * 100;
    return Math.min(percentage, 100); // Trava em 100% visualmente
  },

  /**
   * Calcula o valor de cada parcela (divisão simples)
   */
  calculateInstallmentValue: (totalAmount: number, installments: number): number => {
    if (installments <= 0) return totalAmount;
    return Number((totalAmount / installments).toFixed(2));
  },

  /**
   * Calcula variação percentual entre dois valores (ex: mês atual vs mês passado)
   */
  calculateVariation: (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  },
};
