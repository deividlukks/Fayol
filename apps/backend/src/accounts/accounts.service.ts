import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createAccountDto: CreateAccountDto) {
    return this.prisma.account.create({
      data: {
        ...createAccountDto,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.account.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException('Conta não encontrada');
    }

    if (account.userId !== userId) {
      throw new ForbiddenException('Acesso negado');
    }

    return account;
  }

  async update(id: string, userId: string, updateAccountDto: UpdateAccountDto) {
    await this.findOne(id, userId);

    return this.prisma.account.update({
      where: { id },
      data: updateAccountDto,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    const hasTransactions = await this.prisma.transaction.count({
      where: { accountId: id },
    });

    if (hasTransactions > 0) {
      throw new ForbiddenException(
        'Não é possível excluir uma conta com transações. Desative-a ao invés disso.',
      );
    }

    await this.prisma.account.delete({
      where: { id },
    });

    return { message: 'Conta removida com sucesso' };
  }
}
