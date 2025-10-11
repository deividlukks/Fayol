import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDailySummary(userId: string, date: string) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
        subcategory: true,
      },
    });

    const income = transactions
      .filter((t) => t.movementType === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = transactions
      .filter((t) => t.movementType === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      date,
      income,
      expenses,
      balance: income - expenses,
      transactionsCount: transactions.length,
      transactions,
    };
  }

  async getMonthlyReport(userId: string, month: string) {
    // month format: YYYY-MM
    const [year, monthNum] = month.split('-');
    const startDate = new Date(Number(year), Number(monthNum) - 1, 1);
    const endDate = new Date(Number(year), Number(monthNum), 0, 23, 59, 59, 999);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
        subcategory: true,
        account: true,
      },
    });

    const income = transactions
      .filter((t) => t.movementType === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = transactions
      .filter((t) => t.movementType === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Gastos por categoria
    const expensesByCategory = transactions
      .filter((t) => t.movementType === 'expense')
      .reduce((acc, t) => {
        const categoryName = t.category.name;
        if (!acc[categoryName]) {
          acc[categoryName] = {
            category: categoryName,
            total: 0,
            count: 0,
          };
        }
        acc[categoryName].total += Number(t.amount);
        acc[categoryName].count += 1;
        return acc;
      }, {});

    // Receitas por categoria
    const incomeByCategory = transactions
      .filter((t) => t.movementType === 'income')
      .reduce((acc, t) => {
        const categoryName = t.category.name;
        if (!acc[categoryName]) {
          acc[categoryName] = {
            category: categoryName,
            total: 0,
            count: 0,
          };
        }
        acc[categoryName].total += Number(t.amount);
        acc[categoryName].count += 1;
        return acc;
      }, {});

    return {
      month,
      summary: {
        income,
        expenses,
        balance: income - expenses,
        transactionsCount: transactions.length,
      },
      expensesByCategory: Object.values(expensesByCategory),
      incomeByCategory: Object.values(incomeByCategory),
      transactions,
    };
  }

  async getByCategory(userId: string, startDate: string, endDate: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        category: true,
        subcategory: true,
      },
    });

    const grouped = transactions.reduce((acc, t) => {
      const categoryName = t.category.name;
      if (!acc[categoryName]) {
        acc[categoryName] = {
          category: categoryName,
          type: t.movementType,
          total: 0,
          transactions: [],
        };
      }
      acc[categoryName].total += Number(t.amount);
      acc[categoryName].transactions.push(t);
      return acc;
    }, {});

    return {
      period: { startDate, endDate },
      categories: Object.values(grouped),
    };
  }

  async getMonthlyFull(userId: string, month: string) {
    const report = await this.getMonthlyReport(userId, month);

    // Adicionar comparação com mês anterior
    const [year, monthNum] = month.split('-');
    const prevMonth = new Date(Number(year), Number(monthNum) - 2, 1);
    const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

    const prevReport = await this.getMonthlyReport(userId, prevMonthStr);

    const comparison = {
      incomeDiff: report.summary.income - prevReport.summary.income,
      incomePercentage:
        prevReport.summary.income > 0
          ? ((report.summary.income - prevReport.summary.income) / prevReport.summary.income) * 100
          : 0,
      expensesDiff: report.summary.expenses - prevReport.summary.expenses,
      expensesPercentage:
        prevReport.summary.expenses > 0
          ? ((report.summary.expenses - prevReport.summary.expenses) /
              prevReport.summary.expenses) *
            100
          : 0,
    };

    return {
      ...report,
      comparison,
      previousMonth: {
        month: prevMonthStr,
        summary: prevReport.summary,
      },
    };
  }

  async getYearlyReport(userId: string, year: string) {
    const startDate = new Date(Number(year), 0, 1);
    const endDate = new Date(Number(year), 11, 31, 23, 59, 59, 999);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
    });

    const income = transactions
      .filter((t) => t.movementType === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = transactions
      .filter((t) => t.movementType === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Agrupamento por mês
    const monthlyData = [];
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(Number(year), month, 1);
      const monthEnd = new Date(Number(year), month + 1, 0, 23, 59, 59, 999);

      const monthTransactions = transactions.filter(
        (t) => t.createdAt >= monthStart && t.createdAt <= monthEnd,
      );

      const monthIncome = monthTransactions
        .filter((t) => t.movementType === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const monthExpenses = monthTransactions
        .filter((t) => t.movementType === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      monthlyData.push({
        month: monthStart.toISOString().slice(0, 7),
        income: monthIncome,
        expenses: monthExpenses,
        balance: monthIncome - monthExpenses,
      });
    }

    return {
      year,
      summary: {
        income,
        expenses,
        balance: income - expenses,
        transactionsCount: transactions.length,
      },
      monthlyData,
    };
  }
}
