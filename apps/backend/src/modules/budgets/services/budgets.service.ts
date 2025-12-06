import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateBudgetDto, UpdateBudgetDto } from '../dto/budgets.dto';
import { LaunchType } from '@fayol/shared-types';

@Injectable()
export class BudgetsService {
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
}
