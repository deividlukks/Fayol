import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateGoalDto } from '../dto/create-goal.dto';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: CreateGoalDto) {
    return this.prisma.goal.create({
      data: {
        userId,
        title: data.title,
        currentAmount: data.currentAmount,
        targetAmount: data.targetAmount,
        deadline: data.deadline,
        color: data.color,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateAmount(id: string, userId: string, amount: number) {
    const goal = await this.prisma.goal.findFirst({ where: { id, userId } });
    if (!goal) throw new NotFoundException('Meta não encontrada');

    return this.prisma.goal.update({
      where: { id },
      data: { currentAmount: amount },
    });
  }
}
