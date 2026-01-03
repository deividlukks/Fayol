import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAccountDto, UpdateAccountDto } from '../dto/accounts.dto';
import { AccountType } from '@fayol/shared-types';
import { CurrencyService } from './currency.service';

@Injectable()
export class AccountsService {
  constructor(
    private prisma: PrismaService,
    private currencyService: CurrencyService
  ) {}

  async create(userId: string, data: CreateAccountDto) {
    return this.prisma.account.create({
      data: {
        name: data.name,
        type: data.type,
        balance: data.balance,
        creditLimit: data.creditLimit,
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
    const accounts = await this.prisma.account.findMany({
      where: { userId, isArchived: false },
      include: {
        // Inclui investimentos para calcular o total investido
        investments: {
          // IMPORTANTE: Adicionado 'type' para sabermos se precisa converter moeda
          select: { quantity: true, currentPrice: true, averagePrice: true, type: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Obtém taxa de câmbio USD->BRL em tempo real
    const usdToBrlRate = await this.currencyService.getExchangeRate('USD', 'BRL');

    // Processa os dados para adicionar campos calculados
    return Promise.all(
      accounts.map(async (account) => {
        const accData: any = { ...account };

        // Se for conta de investimento, calcula o total consolidado
        if (account.type === AccountType.INVESTMENT) {
          const totalInvested = account.investments.reduce((acc, inv) => {
            const price = Number(inv.currentPrice || inv.averagePrice);
            const qty = Number(inv.quantity);

            let value = price * qty;

            // CORREÇÃO: Se for ativo internacional ou cripto, converte para BRL
            if (inv.type === 'STOCK_US' || inv.type === 'CRYPTO') {
              value = value * usdToBrlRate;
            }

            return acc + value;
          }, 0);

          accData.totalInvested = totalInvested;
          accData.totalConsolidated = Number(account.balance) + totalInvested;
        }

        return accData;
      })
    );
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
      data: {
        ...data,
        creditLimit: data.creditLimit,
      },
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
