import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LaunchType } from '@fayol/shared-types';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }[];
}

@Injectable()
export class ChartsService {
  private readonly logger = new Logger(ChartsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Gera dados para gráfico de evolução mensal
   */
  async getMonthlyEvolutionData(userId: string, months: number = 6): Promise<ChartData> {
    const data: { month: string; income: number; expense: number }[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const transactions = await this.prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: start, lte: end },
          isPaid: true,
        },
      });

      const income = transactions
        .filter((t) => t.type === LaunchType.INCOME)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expense = transactions
        .filter((t) => t.type === LaunchType.EXPENSE)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      data.push({
        month: format(date, 'MMM/yy', { locale: ptBR }),
        income,
        expense,
      });
    }

    return {
      labels: data.map((d) => d.month),
      datasets: [
        {
          label: 'Receitas',
          data: data.map((d) => d.income),
          backgroundColor: '#10B981',
          borderColor: '#059669',
        },
        {
          label: 'Despesas',
          data: data.map((d) => d.expense),
          backgroundColor: '#EF4444',
          borderColor: '#DC2626',
        },
      ],
    };
  }

  /**
   * Retorna dados para gráfico de pizza de despesas por categoria
   */
  async getExpensesByCategory(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ChartData> {
    const start = startDate || startOfMonth(new Date());
    const end = endDate || endOfMonth(new Date());

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        type: LaunchType.EXPENSE,
        date: { gte: start, lte: end },
        isPaid: true,
      },
      include: {
        category: true,
      },
    });

    const expensesByCategory: Record<string, number> = {};
    transactions.forEach((t) => {
      const categoryName = t.category?.name || 'Sem Categoria';
      expensesByCategory[categoryName] = (expensesByCategory[categoryName] || 0) + Number(t.amount);
    });

    return {
      labels: Object.keys(expensesByCategory),
      datasets: [
        {
          label: 'Despesas por Categoria',
          data: Object.values(expensesByCategory),
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
        },
      ],
    };
  }

  /**
   * Retorna resumo financeiro para relatórios
   */
  async getFinancialSummary(userId: string, startDate?: Date, endDate?: Date) {
    const start = startDate || startOfMonth(new Date());
    const end = endDate || endOfMonth(new Date());

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: start, lte: end },
        isPaid: true,
      },
      include: {
        category: true,
        account: true,
      },
      orderBy: { date: 'desc' },
    });

    const totalIncome = transactions
      .filter((t) => t.type === LaunchType.INCOME)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = transactions
      .filter((t) => t.type === LaunchType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const balance = totalIncome - totalExpense;

    return {
      period: {
        start,
        end,
        label: `${format(start, 'dd/MM/yyyy')} a ${format(end, 'dd/MM/yyyy')}`,
      },
      user: {
        name: user?.name || 'N/A',
      },
      summary: {
        totalIncome,
        totalExpense,
        balance,
      },
      transactions: transactions.slice(0, 20).map((t) => ({
        date: format(new Date(t.date), 'dd/MM/yyyy'),
        description: t.description,
        category: t.category?.name || 'Sem Categoria',
        account: t.account.name,
        amount: Number(t.amount),
        type: t.type,
      })),
    };
  }
}
