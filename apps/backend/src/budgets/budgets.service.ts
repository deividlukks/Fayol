import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createBudgetDto: CreateBudgetDto) {
    const { categoryId, amount, ...rest } = createBudgetDto;

    // Verificar se categoria existe se fornecida
    if (categoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: categoryId,
          OR: [{ userId }, { isSystem: true }],
        },
      });

      if (!category) {
        throw new NotFoundException('Categoria não encontrada');
      }
    }

    return this.prisma.budget.create({
      data: {
        ...rest,
        userId,
        categoryId,
        amount: new Decimal(amount),
      },
      include: {
        category: true,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.budget.findMany({
      where: { userId },
      include: {
        category: true,
        alerts: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActive(userId: string) {
    return this.prisma.budget.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      include: {
        category: true,
        alerts: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!budget) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    if (budget.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para acessar este orçamento');
    }

    return budget;
  }

  async update(id: string, userId: string, updateBudgetDto: UpdateBudgetDto) {
    await this.findOne(id, userId);

    const { amount, ...rest } = updateBudgetDto;

    return this.prisma.budget.update({
      where: { id },
      data: {
        ...rest,
        ...(amount !== undefined && { amount: new Decimal(amount) }),
      },
      include: {
        category: true,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.budget.delete({
      where: { id },
    });
  }

  async getBudgetStatus(userId: string) {
    const budgets = await this.findActive(userId);
    const now = new Date();

    const statuses = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await this.calculateSpent(userId, budget, now);
        const percentage = budget.amount.toNumber() > 0
          ? (spent / budget.amount.toNumber()) * 100
          : 0;

        return {
          id: budget.id,
          name: budget.name,
          category: budget.category?.name || 'Geral',
          amount: budget.amount,
          spent,
          remaining: Math.max(0, budget.amount.toNumber() - spent),
          percentage: Math.round(percentage),
          period: budget.period,
          alertThreshold: budget.alertThreshold,
          isOverBudget: percentage > 100,
          isNearLimit: percentage >= budget.alertThreshold && percentage < 100,
        };
      })
    );

    return statuses;
  }

  async getOneBudgetStatus(id: string, userId: string) {
    const budget = await this.findOne(id, userId);
    const now = new Date();

    const spent = await this.calculateSpent(userId, budget, now);
    const percentage = budget.amount.toNumber() > 0
      ? (spent / budget.amount.toNumber()) * 100
      : 0;

    return {
      id: budget.id,
      name: budget.name,
      category: budget.category?.name || 'Geral',
      amount: budget.amount,
      spent,
      remaining: Math.max(0, budget.amount.toNumber() - spent),
      percentage: Math.round(percentage),
      period: budget.period,
      alertThreshold: budget.alertThreshold,
      isOverBudget: percentage > 100,
      isNearLimit: percentage >= budget.alertThreshold && percentage < 100,
    };
  }

  private async calculateSpent(userId: string, budget: any, now: Date): Promise<number> {
    const { startDate, endDate, categoryId } = budget;

    const where: any = {
      userId,
      movementType: 'expense',
      effectiveDate: {
        gte: startDate,
        ...(endDate && { lte: endDate }),
      },
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      select: {
        amount: true,
      },
    });

    return transactions.reduce((sum, t) => sum + t.amount.toNumber(), 0);
  }

  async checkBudgetLimits(userId: string, transactionCategoryId?: string) {
    const budgets = await this.findActive(userId);
    const now = new Date();

    for (const budget of budgets) {
      // Se transação tem categoria e orçamento também, verificar apenas se coincidem
      if (transactionCategoryId && budget.categoryId) {
        if (transactionCategoryId !== budget.categoryId) {
          continue;
        }
      }

      const spent = await this.calculateSpent(userId, budget, now);
      const percentage = budget.amount.toNumber() > 0
        ? (spent / budget.amount.toNumber()) * 100
        : 0;

      // Verificar se ultrapassou algum threshold
      if (percentage >= budget.alertThreshold) {
        await this.createAlert(budget.id, userId, Math.round(percentage));
      }
    }
  }

  private async createAlert(budgetId: string, userId: string, threshold: number) {
    // Verificar se já existe alerta recente com esse threshold
    const recentAlert = await this.prisma.budgetAlert.findFirst({
      where: {
        budgetId,
        threshold,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24h
        },
      },
    });

    if (recentAlert) {
      return; // Não criar alerta duplicado
    }

    const budget = await this.prisma.budget.findUnique({
      where: { id: budgetId },
      include: { category: true },
    });

    const categoryName = budget.category?.name || 'Geral';
    let message = '';

    if (threshold >= 100) {
      message = `⚠️ Você ultrapassou o orçamento de ${categoryName}! Já gastou ${threshold}% do limite.`;
    } else {
      message = `⚡ Atenção! Você já gastou ${threshold}% do orçamento de ${categoryName}.`;
    }

    await this.prisma.budgetAlert.create({
      data: {
        budgetId,
        userId,
        threshold,
        message,
      },
    });
  }

  async getUnreadAlerts(userId: string) {
    return this.prisma.budgetAlert.findMany({
      where: {
        userId,
        isRead: false,
      },
      include: {
        budget: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAlertAsRead(id: string, userId: string) {
    const alert = await this.prisma.budgetAlert.findUnique({
      where: { id },
    });

    if (!alert) {
      throw new NotFoundException('Alerta não encontrado');
    }

    if (alert.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para acessar este alerta');
    }

    return this.prisma.budgetAlert.update({
      where: { id },
      data: { isRead: true },
    });
  }
}
