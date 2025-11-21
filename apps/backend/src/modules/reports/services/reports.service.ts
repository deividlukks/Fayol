import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetReportDto } from '../dto/reports.dto';
import { LaunchType } from '@fayol/shared-types';
import { startOfMonth, endOfMonth } from 'date-fns';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // Helper para definir datas padrão (mês atual) se não forem enviadas
  private getDateRange(query: GetReportDto) {
    const now = new Date();
    return {
      startDate: query.startDate || startOfMonth(now),
      endDate: query.endDate || endOfMonth(now),
    };
  }

  async getDashboardSummary(userId: string, query: GetReportDto) {
    const { startDate, endDate } = this.getDateRange(query);

    // 1. Saldo Total Atual (Soma de todas as contas)
    const accounts = await this.prisma.account.aggregate({
      _sum: { balance: true },
      where: { userId, isArchived: false },
    });

    // 2. Receitas e Despesas do Período
    const transactions = await this.prisma.transaction.groupBy({
      by: ['type'],
      _sum: { amount: true },
      where: {
        userId,
        isPaid: true,
        date: { gte: startDate, lte: endDate },
      },
    });

    const income = Number(transactions.find(t => t.type === LaunchType.INCOME)?._sum.amount || 0);
    const expense = Number(transactions.find(t => t.type === LaunchType.EXPENSE)?._sum.amount || 0);

    return {
      totalBalance: Number(accounts._sum.balance || 0),
      periodSummary: {
        income,
        expense,
        result: income - expense,
      },
    };
  }

  async getExpensesByCategory(userId: string, query: GetReportDto) {
    const { startDate, endDate } = this.getDateRange(query);

    const expenses = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      _sum: { amount: true },
      where: {
        userId,
        type: LaunchType.EXPENSE,
        isPaid: true,
        date: { gte: startDate, lte: endDate },
        categoryId: { not: null }, // Ignora sem categoria
      },
    });

    // Busca nomes das categorias
    const categories = await this.prisma.category.findMany({
      where: { id: { in: expenses.map(e => e.categoryId as string) } },
      select: { id: true, name: true, color: true, icon: true },
    });

    // Monta o resultado formatado para gráficos (Pie Chart)
    return expenses.map(item => {
      const category = categories.find(c => c.id === item.categoryId);
      return {
        id: item.categoryId,
        name: category?.name || 'Desconhecida',
        color: category?.color,
        icon: category?.icon,
        amount: Number(item._sum.amount || 0),
      };
    }).sort((a, b) => b.amount - a.amount); // Ordena do maior gasto para o menor
  }

  async getCashFlow(userId: string, query: GetReportDto) {
    const { startDate, endDate } = this.getDateRange(query);

    // Agrupa por data para gráfico de linha/barra
    // Nota: O Prisma não tem "groupBy date" nativo fácil para todos os bancos, 
    // então buscamos os dados e agrupamos no código (para volumes normais é ok).
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        isPaid: true,
        date: { gte: startDate, lte: endDate },
      },
      select: { date: true, type: true, amount: true },
      orderBy: { date: 'asc' },
    });

    const dailyMap = new Map<string, { income: number; expense: number }>();

    transactions.forEach(t => {
      const day = t.date.toISOString().split('T')[0]; // YYYY-MM-DD
      if (!dailyMap.has(day)) {
        dailyMap.set(day, { income: 0, expense: 0 });
      }
      const entry = dailyMap.get(day)!;
      if (t.type === LaunchType.INCOME) entry.income += Number(t.amount);
      if (t.type === LaunchType.EXPENSE) entry.expense += Number(t.amount);
    });

    return Array.from(dailyMap.entries()).map(([date, values]) => ({
      date,
      ...values,
    }));
  }
}