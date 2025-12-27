/**
 * Tipos de insights financeiros
 */
export enum InsightType {
  SPENDING_SPIKE = 'spending_spike',
  UNUSUAL_CATEGORY = 'unusual_category',
  BUDGET_WARNING = 'budget_warning',
  SAVINGS_OPPORTUNITY = 'savings_opportunity',
  INCOME_VARIANCE = 'income_variance',
  RECURRING_EXPENSE = 'recurring_expense',
}

/**
 * Severidade do insight
 */
export enum InsightSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ALERT = 'alert',
  CRITICAL = 'critical',
}

/**
 * Interface para um insight financeiro
 */
export interface FinancialInsight {
  id: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  value?: number;
  percentage?: number;
  recommendation?: string;
  affectedCategory?: string;
  createdAt: Date;
}

/**
 * Dados de transação para análise
 */
export interface TransactionData {
  id: string;
  amount: number;
  category: string;
  date: Date;
  description?: string;
  type: 'income' | 'expense';
}

/**
 * Serviço para gerar insights financeiros
 */
export class FinancialInsightsService {
  /**
   * Analisa transações e gera insights
   */
  public generateInsights(
    transactions: TransactionData[],
    options?: {
      periodDays?: number;
      budgets?: Map<string, number>;
    }
  ): FinancialInsight[] {
    const insights: FinancialInsight[] = [];
    const periodDays = options?.periodDays || 30;

    // Detecta picos de gastos
    insights.push(...this.detectSpendingSpikes(transactions, periodDays));

    // Detecta categorias incomuns
    insights.push(...this.detectUnusualCategories(transactions, periodDays));

    // Verifica alertas de orçamento
    if (options?.budgets) {
      insights.push(...this.checkBudgetWarnings(transactions, options.budgets, periodDays));
    }

    // Identifica oportunidades de economia
    insights.push(...this.findSavingsOpportunities(transactions, periodDays));

    // Analisa variação de renda
    insights.push(...this.analyzeIncomeVariance(transactions, periodDays));

    // Detecta despesas recorrentes
    insights.push(...this.detectRecurringExpenses(transactions));

    return insights.sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity));
  }

  /**
   * Detecta picos de gastos comparando com a média
   */
  private detectSpendingSpikes(transactions: TransactionData[], periodDays: number): FinancialInsight[] {
    const insights: FinancialInsight[] = [];
    const expenses = transactions.filter((t) => t.type === 'expense');

    if (expenses.length < 7) return insights;

    // Agrupa por dia
    const dailySpending = new Map<string, number>();
    expenses.forEach((t) => {
      const day = t.date.toISOString().split('T')[0];
      dailySpending.set(day, (dailySpending.get(day) || 0) + t.amount);
    });

    const values = Array.from(dailySpending.values());
    const average = values.reduce((sum, v) => sum + v, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, v) => sum + Math.pow(v - average, 2), 0) / values.length
    );

    // Detecta dias com gastos > média + 2 * desvio padrão
    for (const [day, amount] of dailySpending.entries()) {
      if (amount > average + 2 * stdDev) {
        const percentage = ((amount - average) / average) * 100;
        insights.push({
          id: `spike-${day}`,
          type: InsightType.SPENDING_SPIKE,
          severity: percentage > 100 ? InsightSeverity.ALERT : InsightSeverity.WARNING,
          title: 'Pico de gastos detectado',
          description: `Seus gastos em ${new Date(day).toLocaleDateString('pt-BR')} foram ${percentage.toFixed(0)}% acima da média diária.`,
          value: amount,
          percentage,
          recommendation: 'Revise os gastos deste dia e identifique se foram despesas necessárias ou extraordinárias.',
          createdAt: new Date(),
        });
      }
    }

    return insights;
  }

  /**
   * Detecta gastos incomuns em categorias
   */
  private detectUnusualCategories(transactions: TransactionData[], periodDays: number): FinancialInsight[] {
    const insights: FinancialInsight[] = [];
    const expenses = transactions.filter((t) => t.type === 'expense');

    // Agrupa por categoria
    const categorySpending = new Map<string, number>();
    expenses.forEach((t) => {
      categorySpending.set(t.category, (categorySpending.get(t.category) || 0) + t.amount);
    });

    const total = Array.from(categorySpending.values()).reduce((sum, v) => sum + v, 0);

    // Detecta categorias com gasto > 30% do total
    for (const [category, amount] of categorySpending.entries()) {
      const percentage = (amount / total) * 100;
      if (percentage > 30) {
        insights.push({
          id: `unusual-cat-${category}`,
          type: InsightType.UNUSUAL_CATEGORY,
          severity: percentage > 50 ? InsightSeverity.WARNING : InsightSeverity.INFO,
          title: 'Categoria com alto gasto',
          description: `A categoria "${category}" representa ${percentage.toFixed(1)}% dos seus gastos totais.`,
          value: amount,
          percentage,
          affectedCategory: category,
          recommendation: `Avalie se os gastos em ${category} estão dentro do esperado e considere ajustar seu orçamento.`,
          createdAt: new Date(),
        });
      }
    }

    return insights;
  }

  /**
   * Verifica alertas de orçamento
   */
  private checkBudgetWarnings(
    transactions: TransactionData[],
    budgets: Map<string, number>,
    periodDays: number
  ): FinancialInsight[] {
    const insights: FinancialInsight[] = [];
    const expenses = transactions.filter((t) => t.type === 'expense');

    // Agrupa gastos por categoria
    const categorySpending = new Map<string, number>();
    expenses.forEach((t) => {
      categorySpending.set(t.category, (categorySpending.get(t.category) || 0) + t.amount);
    });

    // Verifica cada orçamento
    for (const [category, budgetAmount] of budgets.entries()) {
      const spent = categorySpending.get(category) || 0;
      const percentage = (spent / budgetAmount) * 100;

      if (percentage >= 90) {
        insights.push({
          id: `budget-${category}`,
          type: InsightType.BUDGET_WARNING,
          severity: percentage >= 100 ? InsightSeverity.CRITICAL : InsightSeverity.ALERT,
          title: percentage >= 100 ? 'Orçamento excedido' : 'Orçamento quase esgotado',
          description: `Você já gastou ${percentage.toFixed(1)}% do orçamento de "${category}".`,
          value: spent,
          percentage,
          affectedCategory: category,
          recommendation:
            percentage >= 100
              ? `Você excedeu o orçamento de ${category}. Considere reduzir gastos nesta categoria.`
              : `Atenção aos gastos em ${category} para não exceder o orçamento.`,
          createdAt: new Date(),
        });
      }
    }

    return insights;
  }

  /**
   * Identifica oportunidades de economia
   */
  private findSavingsOpportunities(transactions: TransactionData[], periodDays: number): FinancialInsight[] {
    const insights: FinancialInsight[] = [];
    const expenses = transactions.filter((t) => t.type === 'expense');

    // Categorias comuns onde há oportunidade de economia
    const savingsCategories = ['alimentação', 'transporte', 'entretenimento', 'assinaturas'];

    const categorySpending = new Map<string, number>();
    expenses.forEach((t) => {
      categorySpending.set(t.category, (categorySpending.get(t.category) || 0) + t.amount);
    });

    for (const category of savingsCategories) {
      const amount = categorySpending.get(category);
      if (amount && amount > 500) {
        // Threshold arbitrário
        const potentialSavings = amount * 0.1; // 10% de economia potencial

        insights.push({
          id: `savings-${category}`,
          type: InsightType.SAVINGS_OPPORTUNITY,
          severity: InsightSeverity.INFO,
          title: 'Oportunidade de economia',
          description: `Você gastou R$ ${amount.toFixed(2)} em ${category} este mês.`,
          value: potentialSavings,
          affectedCategory: category,
          recommendation: `Com pequenos ajustes, você pode economizar cerca de R$ ${potentialSavings.toFixed(2)} por mês em ${category}.`,
          createdAt: new Date(),
        });
      }
    }

    return insights;
  }

  /**
   * Analisa variação de renda
   */
  private analyzeIncomeVariance(transactions: TransactionData[], periodDays: number): FinancialInsight[] {
    const insights: FinancialInsight[] = [];
    const income = transactions.filter((t) => t.type === 'income');

    if (income.length < 2) return insights;

    // Agrupa por mês
    const monthlyIncome = new Map<string, number>();
    income.forEach((t) => {
      const month = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      monthlyIncome.set(month, (monthlyIncome.get(month) || 0) + t.amount);
    });

    if (monthlyIncome.size < 2) return insights;

    const values = Array.from(monthlyIncome.values());
    const average = values.reduce((sum, v) => sum + v, 0) / values.length;
    const latest = values[values.length - 1];
    const variance = ((latest - average) / average) * 100;

    if (Math.abs(variance) > 20) {
      insights.push({
        id: 'income-variance',
        type: InsightType.INCOME_VARIANCE,
        severity: variance < -20 ? InsightSeverity.WARNING : InsightSeverity.INFO,
        title: variance > 0 ? 'Aumento de renda detectado' : 'Redução de renda detectada',
        description: `Sua renda este mês ${variance > 0 ? 'aumentou' : 'diminuiu'} ${Math.abs(variance).toFixed(1)}% em relação à média.`,
        value: latest,
        percentage: variance,
        recommendation:
          variance < 0
            ? 'Considere revisar seu orçamento e reduzir gastos se a redução de renda for permanente.'
            : 'Aproveite o aumento de renda para fortalecer sua reserva de emergência ou investimentos.',
        createdAt: new Date(),
      });
    }

    return insights;
  }

  /**
   * Detecta despesas recorrentes
   */
  private detectRecurringExpenses(transactions: TransactionData[]): FinancialInsight[] {
    const insights: FinancialInsight[] = [];
    const expenses = transactions.filter((t) => t.type === 'expense' && t.description);

    // Agrupa por descrição similar e valor similar
    const potentialRecurring = new Map<string, TransactionData[]>();

    expenses.forEach((t) => {
      const key = `${t.description?.toLowerCase().trim()}-${Math.round(t.amount)}`;
      if (!potentialRecurring.has(key)) {
        potentialRecurring.set(key, []);
      }
      potentialRecurring.get(key)!.push(t);
    });

    // Identifica transações que aparecem 2+ vezes
    for (const [key, txs] of potentialRecurring.entries()) {
      if (txs.length >= 2) {
        const totalAmount = txs.reduce((sum, t) => sum + t.amount, 0);
        const avgAmount = totalAmount / txs.length;

        insights.push({
          id: `recurring-${key}`,
          type: InsightType.RECURRING_EXPENSE,
          severity: InsightSeverity.INFO,
          title: 'Despesa recorrente detectada',
          description: `"${txs[0].description}" aparece ${txs.length} vezes com valor médio de R$ ${avgAmount.toFixed(2)}.`,
          value: avgAmount,
          affectedCategory: txs[0].category,
          recommendation: 'Considere criar um orçamento específico para esta despesa recorrente.',
          createdAt: new Date(),
        });
      }
    }

    return insights.slice(0, 5); // Limita a 5 para não sobrecarregar
  }

  /**
   * Peso da severidade para ordenação
   */
  private getSeverityWeight(severity: InsightSeverity): number {
    const weights = {
      [InsightSeverity.CRITICAL]: 4,
      [InsightSeverity.ALERT]: 3,
      [InsightSeverity.WARNING]: 2,
      [InsightSeverity.INFO]: 1,
    };
    return weights[severity] || 0;
  }
}

// Exporta instância única
export const financialInsightsService = new FinancialInsightsService();
