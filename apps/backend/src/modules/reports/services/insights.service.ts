import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LaunchType } from '@fayol/shared-types';
import { subDays } from 'date-fns';

@Injectable()
export class InsightsService {
  constructor(private prisma: PrismaService) {}

  async generateInsights(userId: string) {
    const insights: { type: 'warning' | 'tip' | 'success'; text: string }[] = [];

    // 1. Análise de Orçamentos (Budget)
    const budgets = await this.prisma.budget.findMany({
      where: { userId },
      include: { category: true },
    });

    for (const budget of budgets) {
      // Calcula gasto atual no período do orçamento
      const expenses = await this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          userId,
          type: LaunchType.EXPENSE,
          date: { gte: budget.startDate, lte: budget.endDate },
          ...(budget.categoryId ? { categoryId: budget.categoryId } : {}),
        },
      });

      const spent = Number(expenses._sum.amount || 0);
      const limit = Number(budget.amount);
      const percent = (spent / limit) * 100;

      if (percent >= 100) {
        insights.push({
          type: 'warning',
          text: `Atenção! Você estourou o orçamento de ${budget.name}. (${percent.toFixed(0)}%)`,
        });
      } else if (percent >= 80) {
        insights.push({
          type: 'warning',
          text: `Cuidado: Você já usou ${percent.toFixed(0)}% do orçamento de ${budget.name}.`,
        });
      }
    }

    // 2. Análise de Gastos Recentes (Últimos 7 dias vs Média)
    const last7Days = subDays(new Date(), 7);
    const recentExpenses = await this.prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        type: LaunchType.EXPENSE,
        date: { gte: last7Days },
      },
    });

    const spentLastWeek = Number(recentExpenses._sum.amount || 0);
    if (spentLastWeek === 0) {
      insights.push({
        type: 'tip',
        text: 'Nenhuma despesa registrada nos últimos 7 dias. Continue assim!',
      });
    }

    // 3. Análise de Receitas (Dica de Investimento)
    const balance = await this.prisma.account.aggregate({
      _sum: { balance: true },
      where: { userId, type: 'CHECKING' }, // Apenas conta corrente
    });
    
    const totalBalance = Number(balance._sum.balance || 0);
    if (totalBalance > 2000) {
      insights.push({
        type: 'success',
        text: `Você tem R$ ${totalBalance} em conta corrente. Que tal investir parte desse valor?`,
      });
    }

    // Fallback se não houver nada
    if (insights.length === 0) {
      insights.push({
        type: 'tip',
        text: 'Registre suas despesas diariamente para receber insights personalizados.',
      });
    }

    // Retorna apenas os 3 primeiros
    return insights.slice(0, 3);
  }
}