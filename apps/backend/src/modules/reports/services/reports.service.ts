import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetReportDto } from '../dto/reports.dto';
import { LaunchType } from '@fayol/shared-types';
import { startOfMonth, endOfMonth } from 'date-fns';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private getDateRange(query: GetReportDto) {
    const now = new Date();
    return {
      startDate: query.startDate || startOfMonth(now),
      endDate: query.endDate || endOfMonth(now),
    };
  }

  async getDashboardSummary(userId: string, query: GetReportDto) {
    const { startDate, endDate } = this.getDateRange(query);

    const accounts = await this.prisma.account.aggregate({
      _sum: { balance: true },
      where: { userId, isArchived: false },
    });

    const transactions = await this.prisma.transaction.groupBy({
      by: ['type'],
      _sum: { amount: true },
      where: {
        userId,
        isPaid: true,
        date: { gte: startDate, lte: endDate },
      },
    });

    const income = Number(transactions.find((t) => t.type === LaunchType.INCOME)?._sum.amount || 0);
    const expense = Number(
      transactions.find((t) => t.type === LaunchType.EXPENSE)?._sum.amount || 0
    );

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

    // 1. Agrupa gastos por categoryId (que pode ser subcategoria ou categoria pai)
    const expenses = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      _sum: { amount: true },
      where: {
        userId,
        type: LaunchType.EXPENSE,
        isPaid: true,
        date: { gte: startDate, lte: endDate },
        categoryId: { not: null },
      },
    });

    // 2. Busca os dados de todas as categorias encontradas, incluindo o pai
    const categoryIds = expenses.map((e) => e.categoryId as string);
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: {
        id: true,
        name: true,
        color: true,
        icon: true,
        parentId: true,
        parent: {
          // Busca dados do pai para consolidar
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    });

    // 3. Consolida os valores por Categoria Pai
    const consolidatedMap = new Map<
      string,
      { name: string; color?: string | null; icon?: string | null; amount: number }
    >();

    expenses.forEach((item) => {
      const category = categories.find((c) => c.id === item.categoryId);
      if (!category) return;

      const amount = Number(item._sum.amount || 0);

      // Lógica: Se tiver pai, usa o pai. Se não, usa a própria categoria.
      const parent = category.parent || category;
      const parentId = parent.id;

      if (!consolidatedMap.has(parentId)) {
        consolidatedMap.set(parentId, {
          name: parent.name,
          color: parent.color,
          icon: parent.icon,
          amount: 0,
        });
      }

      const entry = consolidatedMap.get(parentId)!;
      entry.amount += amount;
    });

    // 4. Formata para o retorno esperado pelo Frontend
    return Array.from(consolidatedMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        color: data.color,
        icon: data.icon,
        amount: data.amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  async getCashFlow(userId: string, query: GetReportDto) {
    const { startDate, endDate } = this.getDateRange(query);

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

    transactions.forEach((t) => {
      const day = t.date.toISOString().split('T')[0];
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
