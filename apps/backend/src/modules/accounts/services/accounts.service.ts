import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service'; // Sobe 3 níveis
import { CreateAccountDto, UpdateAccountDto } from '../dto/accounts.dto';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: CreateAccountDto) {
    return this.prisma.account.create({
      data: {
        name: data.name,
        type: data.type,
        balance: data.balance,
        currency: data.currency,
        color: data.color,
        icon: data.icon,
        user: {
          connect: { id: userId },
        },
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.account.findMany({
      where: { userId, isArchived: false },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const account = await this.prisma.account.findUnique({ where: { id } });

    if (!account) throw new NotFoundException('Conta não encontrada.');
    if (account.userId !== userId) throw new ForbiddenException('Acesso negado a esta conta.');

    return account;
  }

  async update(id: string, userId: string, data: UpdateAccountDto) {
    await this.findOne(id, userId);
    return this.prisma.account.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.account.update({
      where: { id },
      data: { isArchived: true },
    });
  }
}