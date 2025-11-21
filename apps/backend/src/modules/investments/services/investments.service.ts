import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateInvestmentDto, UpdateInvestmentDto } from '../dto/investments.dto';

@Injectable()
export class InvestmentsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: CreateInvestmentDto) {
    // Verifica se a conta existe e pertence ao usuário
    const account = await this.prisma.account.findUnique({
      where: { id: data.accountId },
    });

    if (!account || account.userId !== userId) {
      throw new NotFoundException('Conta de custódia não encontrada.');
    }

    return this.prisma.investment.create({
      data: {
        name: data.name,
        ticker: data.ticker,
        quantity: data.quantity,
        averagePrice: data.averagePrice,
        currentPrice: data.currentPrice || data.averagePrice, // Se não informado, assume o preço de compra
        type: data.type,
        purchaseDate: data.purchaseDate,
        user: { connect: { id: userId } },
        account: { connect: { id: data.accountId } },
      },
    });
  }

  async findAll(userId: string) {
    const investments = await this.prisma.investment.findMany({
      where: { userId },
      include: { account: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });

    // Calcula o valor total estimado de cada ativo
    return investments.map((inv) => ({
      ...inv,
      totalValue: Number(inv.quantity) * Number(inv.currentPrice || inv.averagePrice),
      yield: inv.currentPrice 
        ? ((Number(inv.currentPrice) - Number(inv.averagePrice)) / Number(inv.averagePrice)) * 100 
        : 0
    }));
  }

  async findOne(id: string, userId: string) {
    const investment = await this.prisma.investment.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!investment) throw new NotFoundException('Investimento não encontrado.');
    if (investment.userId !== userId) throw new ForbiddenException('Acesso negado.');

    const totalValue = Number(investment.quantity) * Number(investment.currentPrice || investment.averagePrice);

    return { ...investment, totalValue };
  }

  async update(id: string, userId: string, data: UpdateInvestmentDto) {
    await this.findOne(id, userId); // Valida permissão

    return this.prisma.investment.update({
      where: { id },
      data: {
        name: data.name,
        ticker: data.ticker,
        quantity: data.quantity,
        averagePrice: data.averagePrice,
        currentPrice: data.currentPrice,
        type: data.type,
        purchaseDate: data.purchaseDate,
        // Se accountId for enviado, atualiza a conexão
        account: data.accountId ? { connect: { id: data.accountId } } : undefined,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.investment.delete({ where: { id } });
  }
}