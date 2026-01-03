import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateBudgetDto, UpdateBudgetDto } from '../dto/budgets.dto';
import { LaunchType } from '@fayol/shared-types';

interface BudgetProgress {
  id: string;
  name: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'safe' | 'warning' | 'exceeded';
  daysRemaining: number;
  category?: { id: string; name: string };
}

interface BudgetAlert {
  budgetId: string;
  budgetName: string;
  limit: number;
  spent: number;
  percentage: number;
  threshold: number;
  severity: 'warning' | 'critical';
  message: string;
}

@Injectable()
export class BudgetsService {
  private readonly logger = new Logger(BudgetsService.name);

  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: CreateBudgetDto) {
    return this.prisma.budget.create({
      data: {
        // Mapeamento explícito para evitar conflito de tipos (scalar vs relation)
        name: data.name,
        amount: data.amount,
        startDate: data.startDate,
        endDate: data.endDate,
        notifyThreshold: data.notifyThreshold,
        user: {
          connect: { id: userId },
        },
        // Se houver categoryId, faz a conexão. Caso contrário, undefined (orçamento global)
        category: data.categoryId ? { connect: { id: data.categoryId } } : undefined,
      },
    });
  }

  async findAll(userId: string) {
    const budgets = await this.prisma.budget.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { endDate: 'desc' },
    });

    // Calcula o progresso de cada orçamento
    return Promise.all(
      budgets.map(async (budget) => {
        const transactions = await this.prisma.transaction.aggregate({
          _sum: { amount: true },
          where: {
            userId,
            type: LaunchType.EXPENSE,
            date: { gte: budget.startDate, lte: budget.endDate },
            // Se o orçamento tem categoria, filtra por ela. Se não, pega todas as despesas.
            ...(budget.categoryId ? { categoryId: budget.categoryId } : {}),
          },
        });

        const spent = Number(transactions._sum.amount || 0);

        return { ...budget, spent };
      })
    );
  }

  async findOne(id: string, userId: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!budget) throw new NotFoundException('Orçamento não encontrado.');
    if (budget.userId !== userId) throw new ForbiddenException('Acesso negado.');

    // Calcula gasto atual
    const transactions = await this.prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        type: LaunchType.EXPENSE,
        date: { gte: budget.startDate, lte: budget.endDate },
        ...(budget.categoryId ? { categoryId: budget.categoryId } : {}),
      },
    });

    return { ...budget, spent: Number(transactions._sum.amount || 0) };
  }

  async update(id: string, userId: string, data: UpdateBudgetDto) {
    await this.findOne(id, userId); // Valida permissão e existência

    return this.prisma.budget.update({
      where: { id },
      data: {
        name: data.name,
        amount: data.amount,
        startDate: data.startDate,
        endDate: data.endDate,
        notifyThreshold: data.notifyThreshold,
        // Lógica para atualização de categoria:
        // Se data.categoryId for enviado, atualizamos a conexão.
        // Se não for enviado (undefined), o Prisma não faz nada.
        category: data.categoryId ? { connect: { id: data.categoryId } } : undefined,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.budget.delete({ where: { id } });
  }

  // ==========================================
  // SISTEMA DE ALERTAS E PROGRESSO
  // ==========================================

  /**
   * Retorna progresso detalhado de todos os orçamentos
   */
  async getProgress(userId: string): Promise<BudgetProgress[]> {
    const budgets = await this.prisma.budget.findMany({
      where: { userId },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { endDate: 'asc' },
    });

    const today = new Date();

    return Promise.all(
      budgets.map(async (budget) => {
        const transactions = await this.prisma.transaction.aggregate({
          _sum: { amount: true },
          where: {
            userId,
            type: LaunchType.EXPENSE,
            date: { gte: budget.startDate, lte: budget.endDate },
            ...(budget.categoryId ? { categoryId: budget.categoryId } : {}),
          },
        });

        const spent = Number(transactions._sum.amount || 0);
        const remaining = Number(budget.amount) - spent;
        const percentage = (spent / Number(budget.amount)) * 100;

        // Calcula dias restantes
        const endDate = new Date(budget.endDate);
        const daysRemaining = Math.ceil(
          (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Define o status baseado na porcentagem e threshold
        let status: 'safe' | 'warning' | 'exceeded';
        if (percentage >= 100) {
          status = 'exceeded';
        } else if (percentage >= (budget.notifyThreshold || 80)) {
          status = 'warning';
        } else {
          status = 'safe';
        }

        return {
          id: budget.id,
          name: budget.name,
          amount: Number(budget.amount),
          spent,
          remaining,
          percentage: Math.round(percentage * 100) / 100, // 2 casas decimais
          status,
          daysRemaining: Math.max(0, daysRemaining),
          category: budget.category
            ? { id: budget.category.id, name: budget.category.name }
            : undefined,
        };
      })
    );
  }

  /**
   * Verifica e retorna alertas de orçamentos que ultrapassaram o threshold
   */
  async getAlerts(userId: string): Promise<BudgetAlert[]> {
    const budgets = await this.prisma.budget.findMany({
      where: { userId },
      include: { category: true },
    });

    const alerts: BudgetAlert[] = [];

    for (const budget of budgets) {
      const transactions = await this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          userId,
          type: LaunchType.EXPENSE,
          date: { gte: budget.startDate, lte: budget.endDate },
          ...(budget.categoryId ? { categoryId: budget.categoryId } : {}),
        },
      });

      const spent = Number(transactions._sum.amount || 0);
      const limit = Number(budget.amount);
      const percentage = (spent / limit) * 100;
      const threshold = budget.notifyThreshold || 80;

      // Cria alerta se ultrapassou o threshold
      if (percentage >= threshold) {
        const severity: 'warning' | 'critical' = percentage >= 100 ? 'critical' : 'warning';

        let message: string;
        if (percentage >= 100) {
          message = `Orçamento "${budget.name}" excedido em ${(percentage - 100).toFixed(1)}%`;
        } else {
          message = `Orçamento "${budget.name}" atingiu ${percentage.toFixed(1)}% do limite`;
        }

        alerts.push({
          budgetId: budget.id,
          budgetName: budget.name,
          limit,
          spent,
          percentage: Math.round(percentage * 100) / 100,
          threshold,
          severity,
          message,
        });

        this.logger.warn(
          `Alerta de orçamento: ${message} (${spent.toFixed(2)} / ${limit.toFixed(2)})`
        );
      }
    }

    return alerts;
  }

  /**
   * Verifica alertas para um orçamento específico após uma transação
   */
  async checkBudgetAfterTransaction(userId: string, categoryId?: string): Promise<BudgetAlert[]> {
    // Busca orçamentos ativos que podem ser afetados
    const today = new Date();
    const budgets = await this.prisma.budget.findMany({
      where: {
        userId,
        startDate: { lte: today },
        endDate: { gte: today },
        // Orçamentos globais (sem categoria) ou da categoria específica
        OR: [{ categoryId: null }, ...(categoryId ? [{ categoryId }] : [])],
      },
    });

    const alerts: BudgetAlert[] = [];

    for (const budget of budgets) {
      const transactions = await this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          userId,
          type: LaunchType.EXPENSE,
          date: { gte: budget.startDate, lte: budget.endDate },
          ...(budget.categoryId ? { categoryId: budget.categoryId } : {}),
        },
      });

      const spent = Number(transactions._sum.amount || 0);
      const limit = Number(budget.amount);
      const percentage = (spent / limit) * 100;
      const threshold = budget.notifyThreshold || 80;

      if (percentage >= threshold) {
        const severity: 'warning' | 'critical' = percentage >= 100 ? 'critical' : 'warning';

        let message: string;
        if (percentage >= 100) {
          message = `Orçamento "${budget.name}" excedido em ${(percentage - 100).toFixed(1)}%`;
        } else {
          message = `Orçamento "${budget.name}" atingiu ${percentage.toFixed(1)}% do limite`;
        }

        alerts.push({
          budgetId: budget.id,
          budgetName: budget.name,
          limit,
          spent,
          percentage: Math.round(percentage * 100) / 100,
          threshold,
          severity,
          message,
        });
      }
    }

    return alerts;
  }
}
