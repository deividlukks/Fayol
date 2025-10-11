import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getBalance(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId, isActive: true },
    });

    // Calcular saldo real baseado em transações efetivadas
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        effectiveDate: { not: null },
      },
    });

    const transactionsBalance = transactions.reduce((sum, t) => {
      const amount = Number(t.amount);
      return t.movementType === 'income' ? sum + amount : sum - amount;
    }, 0);

    const initialBalance = accounts.reduce((sum, acc) => sum + Number(acc.initialBalance), 0);
    const total = initialBalance + transactionsBalance;

    return {
      total,
      initialBalance,
      transactionsBalance,
      accounts: accounts.length,
      currency: 'BRL',
    };
  }

  async getSummaryCards(userId: string) {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        createdAt: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
    });

    const income = transactions
      .filter((t) => t.movementType === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = transactions
      .filter((t) => t.movementType === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      income,
      expenses,
      balance: income - expenses,
      transactionsCount: transactions.length,
    };
  }

  async getLatestTransactions(userId: string, limit: number = 10) {
    return this.prisma.transaction.findMany({
      where: { userId },
      include: {
        account: true,
        category: true,
        subcategory: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  async getSpendingByCategory(userId: string) {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        movementType: 'expense',
        createdAt: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
      include: {
        category: true,
      },
    });

    const totalExpenses = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

    const byCategory = transactions.reduce((acc, t) => {
      const categoryName = t.category.name;
      if (!acc[categoryName]) {
        acc[categoryName] = {
          category: categoryName,
          total: 0,
          count: 0,
          color: t.category.color,
          icon: t.category.icon,
        };
      }
      acc[categoryName].total += Number(t.amount);
      acc[categoryName].count += 1;
      return acc;
    }, {});

    const categories = Object.values(byCategory).map((cat: any) => ({
      ...cat,
      percentage: totalExpenses > 0 ? (cat.total / totalExpenses) * 100 : 0,
    }));

    return {
      totalExpenses,
      categories: categories.sort((a: any, b: any) => b.total - a.total),
    };
  }

  async getFinancialHealth(userId: string) {
    const summaryCards = await this.getSummaryCards(userId);
    const balance = await this.getBalance(userId);

    let score = 50; // Base score

    // Critérios de saúde financeira
    if (summaryCards.income > summaryCards.expenses) {
      score += 20; // Receitas maiores que despesas
    }

    const savingsRate =
      summaryCards.income > 0
        ? ((summaryCards.income - summaryCards.expenses) / summaryCards.income) * 100
        : 0;

    if (savingsRate > 20) score += 15;
    if (savingsRate > 30) score += 10;

    if (balance.total > 0) score += 15; // Saldo positivo

    // Limitar score entre 0 e 100
    score = Math.min(100, Math.max(0, score));

    let status = 'poor';
    if (score >= 80) status = 'excellent';
    else if (score >= 60) status = 'good';
    else if (score >= 40) status = 'moderate';

    return {
      score,
      status,
      savingsRate: savingsRate.toFixed(2),
      recommendations: this.getRecommendations(score, savingsRate),
    };
  }

  private getRecommendations(score: number, savingsRate: number): string[] {
    const recommendations = [];

    if (score < 40) {
      recommendations.push('Suas despesas estão superiores às receitas. Revise seus gastos.');
    }

    if (savingsRate < 10) {
      recommendations.push('Tente economizar pelo menos 10% da sua renda mensal.');
    } else if (savingsRate < 20) {
      recommendations.push('Bom trabalho! Tente aumentar sua taxa de economia para 20%.');
    }

    if (score >= 80) {
      recommendations.push('Excelente gestão financeira! Continue assim.');
    }

    return recommendations;
  }

  /**
   * Widget: Comparação de gastos mês a mês (últimos 6 meses)
   */
  async getMonthlyComparison(userId: string, months: number = 6) {
    const data = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
      const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);

      const transactions = await this.prisma.transaction.findMany({
        where: {
          userId,
          createdAt: {
            gte: firstDay,
            lte: lastDay,
          },
        },
      });

      const income = transactions
        .filter((t) => t.movementType === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expenses = transactions
        .filter((t) => t.movementType === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      data.push({
        month: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`,
        monthName: month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        income,
        expenses,
        balance: income - expenses,
        transactionsCount: transactions.length,
      });
    }

    return data;
  }

  /**
   * Widget: Contas pendentes (a pagar e a receber)
   */
  async getPendingTransactions(userId: string) {
    const now = new Date();

    const pending = await this.prisma.transaction.findMany({
      where: {
        userId,
        effectiveDate: null, // Não efetivadas
        dueDate: {
          gte: now, // Com data de vencimento futura
        },
      },
      include: {
        account: true,
        category: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: 20,
    });

    const toPay = pending.filter((t) => t.movementType === 'expense');
    const toReceive = pending.filter((t) => t.movementType === 'income');

    return {
      toPay: {
        count: toPay.length,
        total: toPay.reduce((sum, t) => sum + Number(t.amount), 0),
        transactions: toPay,
      },
      toReceive: {
        count: toReceive.length,
        total: toReceive.reduce((sum, t) => sum + Number(t.amount), 0),
        transactions: toReceive,
      },
    };
  }

  /**
   * Widget: Transações recorrentes ativas
   */
  async getActiveRecurring(userId: string) {
    const recurring = await this.prisma.recurringTransaction.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        account: true,
        category: true,
      },
      orderBy: {
        nextDate: 'asc',
      },
    });

    const totalIncome = recurring
      .filter((r) => r.type === 'INCOME')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const totalExpenses = recurring
      .filter((r) => r.type === 'EXPENSE')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    return {
      count: recurring.length,
      totalIncome,
      totalExpenses,
      netImpact: totalIncome - totalExpenses,
      recurring,
    };
  }

  /**
   * Widget: Evolução patrimonial (últimos 12 meses)
   */
  async getNetWorthEvolution(userId: string, months: number = 12) {
    const data = [];
    const now = new Date();

    // Buscar saldo inicial das contas
    const accounts = await this.prisma.account.findMany({
      where: { userId, isActive: true },
    });

    const initialBalance = accounts.reduce((sum, acc) => sum + Number(acc.initialBalance), 0);

    for (let i = months - 1; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);

      // Transações até o fim deste mês
      const transactions = await this.prisma.transaction.findMany({
        where: {
          userId,
          effectiveDate: {
            not: null,
            lte: lastDay,
          },
        },
      });

      const transactionsBalance = transactions.reduce((sum, t) => {
        const amount = Number(t.amount);
        return t.movementType === 'income' ? sum + amount : sum - amount;
      }, 0);

      const netWorth = initialBalance + transactionsBalance;

      data.push({
        month: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`,
        monthName: month.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        netWorth,
      });
    }

    // Calcular variação percentual
    const firstMonth = data[0]?.netWorth || 0;
    const lastMonth = data[data.length - 1]?.netWorth || 0;
    const variation = firstMonth > 0 ? ((lastMonth - firstMonth) / firstMonth) * 100 : 0;

    return {
      current: lastMonth,
      variation: variation.toFixed(2),
      trend: variation >= 0 ? 'up' : 'down',
      data,
    };
  }

  /**
   * Widget: Top categorias de gastos
   */
  async getTopCategories(userId: string, limit: number = 5, period: 'month' | 'year' = 'month') {
    const now = new Date();
    let startDate: Date;

    if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        movementType: 'expense',
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        category: true,
      },
    });

    const totalExpenses = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

    const byCategory = transactions.reduce((acc, t) => {
      const categoryId = t.category.id;
      if (!acc[categoryId]) {
        acc[categoryId] = {
          id: categoryId,
          name: t.category.name,
          total: 0,
          count: 0,
          color: t.category.color,
          icon: t.category.icon,
        };
      }
      acc[categoryId].total += Number(t.amount);
      acc[categoryId].count += 1;
      return acc;
    }, {});

    const categories = Object.values(byCategory)
      .map((cat: any) => ({
        ...cat,
        percentage: totalExpenses > 0 ? (cat.total / totalExpenses) * 100 : 0,
        averageTransaction: cat.count > 0 ? cat.total / cat.count : 0,
      }))
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, limit);

    return {
      period,
      totalExpenses,
      categories,
    };
  }

  /**
   * Widget: Dashboard completo com todos os widgets
   */
  async getCompleteDashboard(userId: string) {
    const [
      balance,
      summaryCards,
      latestTransactions,
      spendingByCategory,
      financialHealth,
      monthlyComparison,
      pendingTransactions,
      activeRecurring,
      netWorthEvolution,
      topCategories,
    ] = await Promise.all([
      this.getBalance(userId),
      this.getSummaryCards(userId),
      this.getLatestTransactions(userId, 5),
      this.getSpendingByCategory(userId),
      this.getFinancialHealth(userId),
      this.getMonthlyComparison(userId, 6),
      this.getPendingTransactions(userId),
      this.getActiveRecurring(userId),
      this.getNetWorthEvolution(userId, 12),
      this.getTopCategories(userId, 5, 'month'),
    ]);

    return {
      balance,
      summaryCards,
      latestTransactions,
      spendingByCategory,
      financialHealth,
      monthlyComparison,
      pendingTransactions,
      activeRecurring,
      netWorthEvolution,
      topCategories,
    };
  }
}
