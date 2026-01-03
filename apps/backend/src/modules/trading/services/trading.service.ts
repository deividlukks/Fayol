/**
 * IMPORTANTE: Se o erro "Cannot find module '@prisma/client'" persistir,
 * execute na raiz: pnpm --filter @fayol/database-models run generate
 * e depois reinicie o servidor TypeScript do VSCode (Ctrl+Shift+P > Restart TS Server).
 */

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTradeDto } from '../dto/create-trade.dto';

@Injectable()
export class TradingService {
  private readonly logger = new Logger(TradingService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Registra uma nova operação de trade.
   */
  async createTrade(userId: string, dto: CreateTradeDto): Promise<any> {
    const { ticker, type, quantity, price, date, fees } = dto;
    const cleanTicker = ticker.toUpperCase().trim();

    // @ts-ignore: Ignora verificação estrita se o cliente não estiver gerado na IDE
    return this.prisma.$transaction(async (tx) => {
      // Cast para any para garantir compilação mesmo sem os tipos gerados localmente
      const prismaTx = tx as any;

      // 1. Cria o registro histórico do Trade
      const trade = await prismaTx.trade.create({
        data: {
          userId,
          ticker: cleanTicker,
          type: type as any,
          quantity: Number(quantity),
          price: Number(price),
          date: new Date(date),
          fees: Number(fees || 0),
        },
      });

      // 2. Busca a posição atual
      let position = await prismaTx.assetPosition.findUnique({
        where: {
          userId_ticker: {
            userId,
            ticker: cleanTicker,
          },
        },
      });

      if (!position) {
        position = await prismaTx.assetPosition.create({
          data: {
            userId,
            ticker: cleanTicker,
            quantity: 0,
            averagePrice: 0,
          },
        });
      }

      // 3. Lógica Financeira
      if (type === 'BUY') {
        await this.handleBuy(prismaTx, position, dto);
      } else if (type === 'SELL') {
        await this.handleSell(prismaTx, position, dto);
      }

      this.logger.log(`Trade registrado: ${type} ${quantity}x ${cleanTicker}`);
      return trade;
    });
  }

  private async handleBuy(tx: any, position: any, dto: CreateTradeDto) {
    const currentQty = Number(position.quantity);
    const currentAvgPrice = Number(position.averagePrice);
    const buyQty = Number(dto.quantity);
    const buyPrice = Number(dto.price);
    const fees = Number(dto.fees || 0);

    const totalCostPrevious = currentQty * currentAvgPrice;
    const totalCostNew = buyQty * buyPrice + fees;
    const newTotalQty = currentQty + buyQty;

    const newAvgPrice = newTotalQty > 0 ? (totalCostPrevious + totalCostNew) / newTotalQty : 0;

    await tx.assetPosition.update({
      where: { id: position.id },
      data: { quantity: newTotalQty, averagePrice: newAvgPrice },
    });
  }

  private async handleSell(tx: any, position: any, dto: CreateTradeDto) {
    const currentQty = Number(position.quantity);
    const sellQty = Number(dto.quantity);

    if (currentQty < sellQty) {
      throw new BadRequestException(
        `Saldo insuficiente para venda de ${dto.ticker}. Possui: ${currentQty}`
      );
    }

    const newQty = currentQty - sellQty;
    const newAvgPrice = newQty === 0 ? 0 : position.averagePrice;

    await tx.assetPosition.update({
      where: { id: position.id },
      data: { quantity: newQty, averagePrice: newAvgPrice },
    });
  }

  async getPortfolio(userId: string) {
    return (this.prisma as any).assetPosition.findMany({
      where: { userId, quantity: { gt: 0 } },
      orderBy: { ticker: 'asc' },
    });
  }

  async getTradesByTicker(userId: string, ticker: string): Promise<any[]> {
    return (this.prisma as any).trade.findMany({
      where: { userId, ticker: ticker.toUpperCase() },
      orderBy: { date: 'desc' },
    });
  }
}
