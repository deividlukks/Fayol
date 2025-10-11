import { Injectable, Logger } from '@nestjs/common';
import { CategorySuggestion } from './dto/suggest-category.dto';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  movementType: 'income' | 'expense';
  date: Date;
  category?: { name: string; id: string };
}

interface SpendingPattern {
  category: string;
  averageAmount: number;
  frequency: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  predictedNextMonth: number;
}

interface FinancialInsight {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  category?: string;
  amount?: number;
  percentage?: number;
  message: string;
  recommendation?: string;
}

interface FinancialPrediction {
  month: string;
  predictedIncome: number;
  predictedExpenses: number;
  predictedBalance: number;
  confidence: number;
}

interface AnomalyDetection {
  isAnomaly: boolean;
  reason: string;
  expectedRange: { min: number; max: number };
  actualValue: number;
  severity: 'low' | 'medium' | 'high';
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  // Regras expandidas de categorização com ML-like scoring
  private readonly categorizationRules = [
    // Alimentação
    {
      keywords: ['supermercado', 'mercado', 'extra', 'carrefour', 'pão de açúcar', 'assaí'],
      category: 'Alimentação',
      subcategory: 'Supermercado',
      confidence: 0.95,
      weight: 1.0,
    },
    {
      keywords: ['restaurante', 'lanchonete', 'pizzaria', 'hamburguer', 'mcdonald', 'burger king'],
      category: 'Alimentação',
      subcategory: 'Restaurante',
      confidence: 0.9,
      weight: 0.9,
    },
    {
      keywords: ['ifood', 'uber eats', 'delivery', 'rappi', 'deliveroo'],
      category: 'Alimentação',
      subcategory: 'Delivery',
      confidence: 0.98,
      weight: 1.0,
    },
    {
      keywords: ['padaria', 'café', 'lanche', 'cafeteria', 'starbucks'],
      category: 'Alimentação',
      subcategory: 'Lanche',
      confidence: 0.85,
      weight: 0.8,
    },

    // Transporte
    {
      keywords: ['uber', 'taxi', '99', 'cabify'],
      category: 'Transporte',
      subcategory: 'Uber/Taxi',
      confidence: 0.98,
      weight: 1.0,
    },
    {
      keywords: ['combustível', 'gasolina', 'etanol', 'posto', 'shell', 'petrobras'],
      category: 'Transporte',
      subcategory: 'Combustível',
      confidence: 0.95,
      weight: 1.0,
    },
    {
      keywords: ['metrô', 'ônibus', 'trem', 'bilhete único', 'metropolitano'],
      category: 'Transporte',
      subcategory: 'Transporte Público',
      confidence: 0.95,
      weight: 0.95,
    },
    {
      keywords: ['estacionamento', 'zona azul', 'parking'],
      category: 'Transporte',
      subcategory: 'Estacionamento',
      confidence: 0.9,
      weight: 0.85,
    },

    // Moradia
    {
      keywords: ['aluguel', 'rent', 'locação'],
      category: 'Moradia',
      subcategory: 'Aluguel',
      confidence: 0.98,
      weight: 1.0,
    },
    {
      keywords: ['condomínio', 'condominio', 'taxa condominial'],
      category: 'Moradia',
      subcategory: 'Condomínio',
      confidence: 0.98,
      weight: 1.0,
    },
    {
      keywords: ['conta de luz', 'energia', 'enel', 'cpfl', 'eletricidade'],
      category: 'Moradia',
      subcategory: 'Luz',
      confidence: 0.95,
      weight: 0.95,
    },
    {
      keywords: ['conta de água', 'sabesp', 'saneamento'],
      category: 'Moradia',
      subcategory: 'Água',
      confidence: 0.95,
      weight: 0.95,
    },
    {
      keywords: ['internet', 'vivo fibra', 'claro net', 'banda larga', 'wi-fi'],
      category: 'Moradia',
      subcategory: 'Internet',
      confidence: 0.95,
      weight: 0.95,
    },

    // Saúde
    {
      keywords: ['farmácia', 'drogaria', 'remédio', 'medicamento', 'drogasil'],
      category: 'Saúde',
      subcategory: 'Farmácia',
      confidence: 0.95,
      weight: 0.95,
    },
    {
      keywords: ['consulta', 'médico', 'dentista', 'clínica', 'hospital'],
      category: 'Saúde',
      subcategory: 'Consultas',
      confidence: 0.9,
      weight: 0.9,
    },
    {
      keywords: ['academia', 'smartfit', 'crossfit', 'musculação', 'gym'],
      category: 'Saúde',
      subcategory: 'Academia',
      confidence: 0.95,
      weight: 0.95,
    },
    {
      keywords: ['plano de saúde', 'unimed', 'amil', 'bradesco saúde', 'sulamerica'],
      category: 'Saúde',
      subcategory: 'Plano de Saúde',
      confidence: 0.98,
      weight: 1.0,
    },

    // Lazer & Entretenimento
    {
      keywords: ['cinema', 'ingresso', 'filme', 'cinemark'],
      category: 'Lazer',
      subcategory: 'Cinema',
      confidence: 0.95,
      weight: 0.9,
    },
    {
      keywords: ['netflix', 'spotify', 'amazon prime', 'disney', 'hbo', 'streaming'],
      category: 'Lazer',
      subcategory: 'Streaming',
      confidence: 0.98,
      weight: 1.0,
    },
    {
      keywords: ['viagem', 'hotel', 'pousada', 'resort', 'airbnb', 'booking'],
      category: 'Lazer',
      subcategory: 'Viagens',
      confidence: 0.9,
      weight: 0.85,
    },
    {
      keywords: ['bar', 'balada', 'pub', 'cervejaria', 'choperia'],
      category: 'Lazer',
      subcategory: 'Bares e Baladas',
      confidence: 0.9,
      weight: 0.85,
    },

    // Educação
    {
      keywords: ['faculdade', 'universidade', 'curso', 'udemy', 'coursera'],
      category: 'Educação',
      subcategory: 'Cursos',
      confidence: 0.95,
      weight: 0.95,
    },
    {
      keywords: ['livro', 'livraria', 'amazon books'],
      category: 'Educação',
      subcategory: 'Livros',
      confidence: 0.85,
      weight: 0.8,
    },

    // Vestuário
    {
      keywords: ['roupa', 'loja', 'zara', 'renner', 'c&a', 'vestuário'],
      category: 'Vestuário',
      subcategory: 'Roupas',
      confidence: 0.9,
      weight: 0.85,
    },
    {
      keywords: ['sapato', 'tênis', 'calçado', 'nike', 'adidas'],
      category: 'Vestuário',
      subcategory: 'Calçados',
      confidence: 0.9,
      weight: 0.85,
    },

    // Receitas
    {
      keywords: ['salário', 'salario', 'pagamento', 'vencimento'],
      category: 'Salário',
      subcategory: 'Salário CLT',
      confidence: 0.98,
      weight: 1.0,
    },
    {
      keywords: ['freelance', 'freela', 'projeto', 'bico'],
      category: 'Freelance',
      subcategory: 'Projetos',
      confidence: 0.9,
      weight: 0.9,
    },
    {
      keywords: ['investimento', 'dividendo', 'ação', 'fundo', 'renda'],
      category: 'Investimentos',
      subcategory: 'Rendimentos',
      confidence: 0.95,
      weight: 0.95,
    },
  ];

  /**
   * CATEGORIZAÇÃO INTELIGENTE COM ML-LIKE SCORING
   */
  suggestCategory(description: string, amount?: number, date?: Date): CategorySuggestion {
    if (!description) {
      return {
        category: 'Outros',
        subcategory: null,
        confidence: 0.3,
      };
    }

    const lowerDesc = description.toLowerCase();
    let bestMatch: CategorySuggestion = {
      category: 'Outros',
      subcategory: null,
      confidence: 0.3,
    };
    let bestScore = 0;

    // Buscar melhor correspondência com scoring
    for (const rule of this.categorizationRules) {
      let matchScore = 0;
      let matchCount = 0;

      for (const keyword of rule.keywords) {
        if (lowerDesc.includes(keyword.toLowerCase())) {
          matchCount++;
          // Score baseado em posição e tamanho da palavra
          const keywordLength = keyword.length;
          const positionBonus = lowerDesc.startsWith(keyword.toLowerCase()) ? 0.2 : 0;
          matchScore += keywordLength * rule.weight * (1 + positionBonus);
        }
      }

      // Se encontrou match, calcular score final
      if (matchCount > 0) {
        const finalScore = matchScore * rule.confidence * matchCount;

        if (finalScore > bestScore) {
          bestScore = finalScore;
          bestMatch = {
            category: rule.category,
            subcategory: rule.subcategory,
            confidence: Math.min(rule.confidence + matchCount * 0.05, 0.99),
          };
        }
      }
    }

    // Ajustar confiança baseada em valor (opcional)
    if (amount && bestMatch.category !== 'Outros') {
      bestMatch.confidence = this.adjustConfidenceByAmount(
        bestMatch.confidence,
        bestMatch.category,
        amount,
      );
    }

    this.logger.debug(
      `Categoria sugerida para "${description}": ${bestMatch.category} (${(bestMatch.confidence * 100).toFixed(1)}%)`,
    );

    return bestMatch;
  }

  /**
   * AJUSTAR CONFIANÇA BASEADO NO VALOR DA TRANSAÇÃO
   */
  private adjustConfidenceByAmount(
    baseConfidence: number,
    category: string,
    amount: number,
  ): number {
    // Valores esperados por categoria
    const expectedRanges: Record<string, { min: number; max: number }> = {
      Alimentação: { min: 10, max: 500 },
      Transporte: { min: 5, max: 300 },
      Moradia: { min: 300, max: 5000 },
      Saúde: { min: 20, max: 2000 },
      Lazer: { min: 10, max: 1000 },
      Salário: { min: 1000, max: 50000 },
    };

    const range = expectedRanges[category];
    if (!range) return baseConfidence;

    // Se o valor está fora do range esperado, reduzir confiança
    if (amount < range.min || amount > range.max) {
      return baseConfidence * 0.8;
    }

    return baseConfidence;
  }

  /**
   * ANÁLISE AVANÇADA DE GASTOS
   */
  async analyzeSpending(transactions: Transaction[]) {
    const expenses = transactions.filter((t) => t.movementType === 'expense');
    const incomes = transactions.filter((t) => t.movementType === 'income');

    const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalIncome = incomes.reduce((sum, t) => sum + Number(t.amount), 0);
    const balance = totalIncome - totalExpenses;

    // Análise por categoria
    const categoryTotals = this.groupByCategory(expenses);
    const categoryAverages = this.calculateCategoryAverages(expenses);

    // Gerar insights avançados
    const insights = this.generateAdvancedInsights(
      expenses,
      incomes,
      categoryTotals,
      totalExpenses,
      totalIncome,
    );

    // Detectar padrões de gastos
    const patterns = this.detectSpendingPatterns(expenses);

    // Análise de tendências
    const trends = this.analyzeTrends(expenses);

    return {
      summary: {
        totalIncome,
        totalExpenses,
        balance,
        savingsRate: totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(2) : '0.00',
      },
      categoryBreakdown: {
        totals: categoryTotals,
        averages: categoryAverages,
        percentages: this.calculatePercentages(categoryTotals, totalExpenses),
      },
      insights,
      patterns,
      trends,
      healthScore: this.calculateFinancialHealth(totalIncome, totalExpenses, categoryTotals),
    };
  }

  /**
   * PREVISÕES FINANCEIRAS
   */
  async predictFinancialFuture(
    transactions: Transaction[],
    monthsAhead: number = 3,
  ): Promise<FinancialPrediction[]> {
    const predictions: FinancialPrediction[] = [];

    // Agrupar transações por mês
    const monthlyData = this.groupByMonth(transactions);
    const months = Object.keys(monthlyData).sort();

    if (months.length < 2) {
      return predictions; // Precisa de pelo menos 2 meses para prever
    }

    // Calcular médias e tendências
    const avgIncome = this.calculateMonthlyAverage(monthlyData, 'income');
    const avgExpense = this.calculateMonthlyAverage(monthlyData, 'expense');

    const incomeTrend = this.calculateTrend(monthlyData, 'income');
    const expenseTrend = this.calculateTrend(monthlyData, 'expense');

    // Gerar previsões
    for (let i = 1; i <= monthsAhead; i++) {
      const predictedIncome = avgIncome + incomeTrend * i;
      const predictedExpenses = avgExpense + expenseTrend * i;
      const predictedBalance = predictedIncome - predictedExpenses;

      // Calcular confiança baseada na variabilidade histórica
      const confidence = this.calculatePredictionConfidence(monthlyData, i);

      predictions.push({
        month: this.getNextMonthName(i),
        predictedIncome: Math.max(0, predictedIncome),
        predictedExpenses: Math.max(0, predictedExpenses),
        predictedBalance,
        confidence,
      });
    }

    return predictions;
  }

  /**
   * DETECÇÃO DE ANOMALIAS
   */
  async detectAnomalies(transactions: Transaction[]): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];

    // Calcular estatísticas por categoria
    const categoryStats = this.calculateCategoryStatistics(transactions);

    transactions.forEach((transaction) => {
      const category = transaction.category?.name || 'Outros';
      const stats = categoryStats[category];

      if (!stats) return;

      const amount = Number(transaction.amount);
      const deviation = Math.abs(amount - stats.mean) / stats.stdDev;

      // Detectar anomalia (> 2 desvios padrão)
      if (deviation > 2 && stats.stdDev > 0) {
        const severity = deviation > 3 ? 'high' : deviation > 2.5 ? 'medium' : 'low';

        anomalies.push({
          isAnomaly: true,
          reason: `Gasto em ${category} está ${deviation.toFixed(1)} desvios padrão acima da média`,
          expectedRange: {
            min: stats.mean - 2 * stats.stdDev,
            max: stats.mean + 2 * stats.stdDev,
          },
          actualValue: amount,
          severity,
        });
      }
    });

    return anomalies;
  }

  /**
   * RECOMENDAÇÕES PERSONALIZADAS
   */
  async generateRecommendations(
    transactions: Transaction[],
    userGoals?: {
      savingsGoal?: number;
      categoryBudgets?: Record<string, number>;
      targetSavingsRate?: number;
    },
  ): Promise<string[]> {
    const recommendations: string[] = [];
    const analysis = await this.analyzeSpending(transactions);

    const { summary, categoryBreakdown } = analysis;
    const savingsRate = parseFloat(summary.savingsRate);

    // Recomendação de economia
    if (savingsRate < 10) {
      recommendations.push(
        '⚠️ Sua taxa de poupança está abaixo de 10%. Recomendamos reduzir gastos supérfluos.',
      );
    } else if (savingsRate > 30) {
      recommendations.push('✅ Excelente! Você está economizando mais de 30% da sua renda.');
    }

    // Recomendações por categoria
    Object.entries(categoryBreakdown.percentages).forEach(
      ([category, percentage]: [string, any]) => {
        if (percentage > 30 && category !== 'Moradia') {
          recommendations.push(
            `⚠️ Gastos com ${category} representam ${percentage.toFixed(1)}% do total. Considere reduzir.`,
          );
        }
      },
    );

    // Análise de saúde financeira
    if (analysis.healthScore < 50) {
      recommendations.push('🔴 Sua saúde financeira está comprometida. Urgente revisar gastos!');
    } else if (analysis.healthScore > 75) {
      recommendations.push('✅ Sua saúde financeira está ótima! Continue assim.');
    }

    // Recomendações baseadas em padrões
    if (analysis.patterns.some((p) => p.trend === 'increasing')) {
      const increasingCategories = analysis.patterns
        .filter((p) => p.trend === 'increasing')
        .map((p) => p.category)
        .join(', ');
      recommendations.push(`📈 Atenção: gastos crescentes em ${increasingCategories}. Monitore!`);
    }

    // Recomendações baseadas nas metas do usuário
    if (userGoals) {
      if (userGoals.targetSavingsRate && savingsRate < userGoals.targetSavingsRate) {
        const diff = userGoals.targetSavingsRate - savingsRate;
        recommendations.push(
          `🎯 Você está ${diff.toFixed(1)}% abaixo da sua meta de poupança de ${userGoals.targetSavingsRate}%.`,
        );
      }

      if (userGoals.savingsGoal) {
        const monthlySavings = summary.balance;
        if (monthlySavings < userGoals.savingsGoal) {
          const diff = userGoals.savingsGoal - monthlySavings;
          recommendations.push(
            `💰 Para atingir sua meta de poupança mensal de R$ ${userGoals.savingsGoal}, você precisa economizar mais R$ ${diff.toFixed(2)} por mês.`,
          );
        }
      }

      if (userGoals.categoryBudgets) {
        Object.entries(userGoals.categoryBudgets).forEach(([category, budget]) => {
          const actualSpending = categoryBreakdown.totals[category] || 0;
          if (actualSpending > budget) {
            const overBudget = actualSpending - budget;
            recommendations.push(
              `📊 Você ultrapassou o orçamento de ${category} em R$ ${overBudget.toFixed(2)}.`,
            );
          }
        });
      }
    }

    return recommendations;
  }

  // ==================== MÉTODOS AUXILIARES ====================

  private groupByCategory(transactions: Transaction[]) {
    return transactions.reduce(
      (acc, t) => {
        const cat = t.category?.name || 'Outros';
        acc[cat] = (acc[cat] || 0) + Number(t.amount);
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private calculateCategoryAverages(transactions: Transaction[]) {
    const grouped = transactions.reduce(
      (acc, t) => {
        const cat = t.category?.name || 'Outros';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(Number(t.amount));
        return acc;
      },
      {} as Record<string, number[]>,
    );

    const averages: Record<string, number> = {};
    Object.entries(grouped).forEach(([cat, amounts]) => {
      averages[cat] = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
    });

    return averages;
  }

  private calculatePercentages(
    categoryTotals: Record<string, number>,
    total: number,
  ): Record<string, number> {
    const percentages: Record<string, number> = {};
    Object.entries(categoryTotals).forEach(([cat, amount]) => {
      percentages[cat] = (amount / total) * 100;
    });
    return percentages;
  }

  private generateAdvancedInsights(
    expenses: Transaction[],
    incomes: Transaction[],
    categoryTotals: Record<string, number>,
    totalExpenses: number,
    totalIncome: number,
  ): FinancialInsight[] {
    const insights: FinancialInsight[] = [];

    // Insight 1: Maior categoria de gasto
    const maxCategory = Object.entries(categoryTotals).reduce(
      (max, [cat, value]) => (value > max.value ? { cat, value } : max),
      { cat: '', value: 0 },
    );

    if (maxCategory.cat) {
      const percentage = (maxCategory.value / totalExpenses) * 100;
      insights.push({
        type: 'highest_spending',
        severity: percentage > 40 ? 'warning' : 'info',
        category: maxCategory.cat,
        amount: maxCategory.value,
        percentage,
        message: `${maxCategory.cat} é sua maior despesa (${percentage.toFixed(1)}%)`,
        recommendation:
          percentage > 40 ? `Considere reduzir gastos em ${maxCategory.cat}` : undefined,
      });
    }

    // Insight 2: Déficit ou superávit
    const balance = totalIncome - totalExpenses;
    if (balance < 0) {
      insights.push({
        type: 'deficit',
        severity: 'critical',
        amount: Math.abs(balance),
        message: `Você está gastando R$ ${Math.abs(balance).toFixed(2)} a mais do que ganha`,
        recommendation: 'Urgente: reduza gastos ou aumente receita',
      });
    } else if (balance > 0) {
      const savingsRate = (balance / totalIncome) * 100;
      insights.push({
        type: 'surplus',
        severity: 'info',
        amount: balance,
        percentage: savingsRate,
        message: `Você está economizando ${savingsRate.toFixed(1)}% da sua renda`,
        recommendation:
          savingsRate < 20 ? 'Tente aumentar sua taxa de poupança para 20%' : undefined,
      });
    }

    // Insight 3: Gastos acima da média
    const avgPerCategory = totalExpenses / Object.keys(categoryTotals).length;
    Object.entries(categoryTotals).forEach(([cat, value]) => {
      if (value > avgPerCategory * 1.8) {
        insights.push({
          type: 'above_average',
          severity: 'warning',
          category: cat,
          amount: value,
          message: `Gastos em ${cat} estão 80% acima da média`,
          recommendation: `Revise seus gastos em ${cat}`,
        });
      }
    });

    return insights;
  }

  private detectSpendingPatterns(transactions: Transaction[]): SpendingPattern[] {
    const patterns: SpendingPattern[] = [];
    const categoryGroups = this.groupTransactionsByCategory(transactions);

    Object.entries(categoryGroups).forEach(([category, txs]) => {
      const amounts = txs.map((t) => Number(t.amount));
      const average = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
      const frequency = txs.length;

      // Calcular tendência (simplificado)
      const trend = this.calculateSimpleTrend(amounts);

      // Prever próximo mês (média + tendência)
      const predictedNextMonth = average * (1 + trend);

      patterns.push({
        category,
        averageAmount: average,
        frequency,
        trend: trend > 0.1 ? 'increasing' : trend < -0.1 ? 'decreasing' : 'stable',
        predictedNextMonth,
      });
    });

    return patterns.sort((a, b) => b.averageAmount - a.averageAmount);
  }

  private analyzeTrends(transactions: Transaction[]) {
    const monthlyTotals = this.groupByMonth(transactions);
    const months = Object.keys(monthlyTotals).sort();

    if (months.length < 2) return { overall: 'insufficient_data', monthly: {} };

    const values = months.map((m) => {
      const monthData = monthlyTotals[m];
      return monthData.expenses.reduce((sum, t) => sum + Number(t.amount), 0);
    });

    const trend = this.calculateSimpleTrend(values);

    return {
      overall: trend > 0.05 ? 'increasing' : trend < -0.05 ? 'decreasing' : 'stable',
      percentageChange: (trend * 100).toFixed(2),
      monthly: monthlyTotals,
    };
  }

  private calculateFinancialHealth(
    income: number,
    expenses: number,
    categoryTotals: Record<string, number>,
  ): number {
    let score = 50; // Base score

    // Fator 1: Taxa de poupança
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    if (savingsRate > 30) score += 30;
    else if (savingsRate > 20) score += 20;
    else if (savingsRate > 10) score += 10;
    else if (savingsRate < 0) score -= 30;

    // Fator 2: Diversificação de gastos
    const numCategories = Object.keys(categoryTotals).length;
    if (numCategories > 5) score += 10;
    else if (numCategories < 3) score -= 10;

    // Fator 3: Concentração de gastos
    const maxCategoryPercentage = Math.max(
      ...Object.values(categoryTotals).map((v) => (v / expenses) * 100),
    );
    if (maxCategoryPercentage < 40) score += 10;
    else if (maxCategoryPercentage > 60) score -= 20;

    return Math.max(0, Math.min(100, score));
  }

  private groupTransactionsByCategory(transactions: Transaction[]) {
    return transactions.reduce(
      (acc, t) => {
        const cat = t.category?.name || 'Outros';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(t);
        return acc;
      },
      {} as Record<string, Transaction[]>,
    );
  }

  private groupByMonth(transactions: Transaction[]) {
    return transactions.reduce(
      (acc, t) => {
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!acc[monthKey]) {
          acc[monthKey] = { incomes: [], expenses: [] };
        }

        if (t.movementType === 'income') {
          acc[monthKey].incomes.push(t);
        } else {
          acc[monthKey].expenses.push(t);
        }

        return acc;
      },
      {} as Record<string, { incomes: Transaction[]; expenses: Transaction[] }>,
    );
  }

  private calculateMonthlyAverage(
    monthlyData: Record<string, any>,
    type: 'income' | 'expense',
  ): number {
    const months = Object.keys(monthlyData);
    const totals = months.map((m) => {
      const data = monthlyData[m][type === 'income' ? 'incomes' : 'expenses'];
      return data.reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0);
    });

    return totals.reduce((sum, t) => sum + t, 0) / totals.length;
  }

  private calculateTrend(monthlyData: Record<string, any>, type: 'income' | 'expense'): number {
    const months = Object.keys(monthlyData).sort();
    if (months.length < 2) return 0;

    const values = months.map((m) => {
      const data = monthlyData[m][type === 'income' ? 'incomes' : 'expenses'];
      return data.reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0);
    });

    return this.calculateSimpleTrend(values);
  }

  private calculateSimpleTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const first = values.slice(0, Math.ceil(values.length / 2));
    const second = values.slice(Math.floor(values.length / 2));

    const avgFirst = first.reduce((sum, v) => sum + v, 0) / first.length;
    const avgSecond = second.reduce((sum, v) => sum + v, 0) / second.length;

    return avgFirst > 0 ? (avgSecond - avgFirst) / avgFirst : 0;
  }

  private calculatePredictionConfidence(
    monthlyData: Record<string, any>,
    monthsAhead: number,
  ): number {
    const months = Object.keys(monthlyData);
    const baseConfidence = 0.8;

    // Reduzir confiança quanto mais longe no futuro
    const distancePenalty = monthsAhead * 0.1;

    // Reduzir confiança se houver pouco histórico
    const historyBonus = Math.min(months.length / 12, 1) * 0.2;

    return Math.max(0.3, Math.min(0.95, baseConfidence - distancePenalty + historyBonus));
  }

  private getNextMonthName(monthsAhead: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() + monthsAhead);

    const monthNames = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];

    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  }

  private calculateCategoryStatistics(transactions: Transaction[]) {
    const grouped = this.groupTransactionsByCategory(transactions);
    const stats: Record<string, { mean: number; stdDev: number }> = {};

    Object.entries(grouped).forEach(([category, txs]) => {
      const amounts = txs.map((t) => Number(t.amount));
      const mean = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;

      const variance = amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);

      stats[category] = { mean, stdDev };
    });

    return stats;
  }
}
