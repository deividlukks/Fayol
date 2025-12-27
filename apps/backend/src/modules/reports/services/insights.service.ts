import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AiService } from '../../ai/services/ai.service'; // <--- Importar
import { LaunchType } from '@fayol/shared-types';
import { subDays } from 'date-fns';

@Injectable()
export class InsightsService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService // <--- Injetar
  ) {}

  async generateInsights(userId: string) {
    const insights: { type: 'warning' | 'tip' | 'success'; text: string }[] = [];

    // --- 1. Insights da IA (Prioridade Alta) ---
    const aiInsights = await this.aiService.generateInsights(userId);
    if (aiInsights && aiInsights.length > 0) {
      // Adiciona os 2 principais insights da IA no topo
      insights.push(
        ...aiInsights.slice(0, 2).map((i) => ({
          type: i.type,
          text: `🤖 IA: ${i.text}`,
        }))
      );
    }

    // --- 2. Insights de Regra de Negócio (Complementar) ---

    // Análise de Orçamentos (Budget)
    const budgets = await this.prisma.budget.findMany({
      where: { userId },
      include: { category: true },
    });

    for (const budget of budgets) {
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
      const percent = limit > 0 ? (spent / limit) * 100 : 0;

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

    // Análise de Gastos Recentes (Fallback se IA falhar ou tiver poucos dados)
    if (insights.length < 3) {
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
    }

    // Análise de Receitas (Dica de Investimento)
    const balance = await this.prisma.account.aggregate({
      _sum: { balance: true },
      where: { userId, type: 'CHECKING' },
    });

    const totalBalance = Number(balance._sum.balance || 0);
    if (totalBalance > 2000) {
      insights.push({
        type: 'success',
        text: `Você tem R$ ${totalBalance} em conta corrente. Que tal investir parte desse valor?`,
      });
    }

    if (insights.length === 0) {
      insights.push({
        type: 'tip',
        text: 'Registre suas despesas diariamente para receber insights personalizados.',
      });
    }

    // Retorna os top 4 insights
    return insights.slice(0, 4);
  }
}
