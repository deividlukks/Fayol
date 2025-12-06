import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTradeDto } from '../dto/create-trade.dto'; // Ajuste se o nome do arquivo for diferente
import { LaunchType, TradeType } from '@fayol/shared-types';

@Injectable()
export class TradingService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: CreateTradeDto) {
    // 1. Valida a Conta
    const account = await this.prisma.account.findUnique({ where: { id: data.accountId } });
    if (!account || account.userId !== userId) throw new NotFoundException('Conta não encontrada.');

    // Calcula totais
    const operationValue = data.quantity * data.price;
    // Na COMPRA: Custo total = (qtd * preço) + taxas
    // Na VENDA: Recebimento líquido = (qtd * preço) - taxas
    const totalAmount =
      data.type === 'BUY' ? operationValue + data.fees : operationValue - data.fees;

    return this.prisma.$transaction(async (tx) => {
      // 2. Define tipo da transação financeira
      const transactionType = data.type === 'BUY' ? LaunchType.EXPENSE : LaunchType.INCOME;
      const description = `${data.type === 'BUY' ? 'Compra' : 'Venda'} de ${data.quantity} ${data.ticker}`;

      // 3. Cria a Transação Financeira
      const transaction = await tx.transaction.create({
        data: {
          description,
          amount: totalAmount,
          date: data.date,
          type: transactionType,
          isPaid: true, // Trades em bolsa geralmente liquidam (D+2), vamos considerar pago para simplificar saldo
          user: { connect: { id: userId } },
          account: { connect: { id: data.accountId } },
        },
      });

      // 4. Atualiza Saldo da Conta
      const balanceChange = data.type === 'BUY' ? -totalAmount : totalAmount;
      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: { increment: balanceChange } },
      });

      // 5. Gestão da Carteira (Investment)
      let investment = await tx.investment.findFirst({
        where: { userId, ticker: data.ticker, accountId: data.accountId },
      });

      // Se não existe e for venda -> Erro
      if (!investment && data.type === 'SELL') {
        throw new BadRequestException('Não pode vender um ativo que não possui.');
      }

      // Se não existe e for compra -> Cria
      if (!investment) {
        investment = await tx.investment.create({
          data: {
            name: data.ticker,
            ticker: data.ticker,
            quantity: data.quantity,
            averagePrice: data.price, // Primeiro preço
            currentPrice: data.price,
            type: 'STOCK', // Default
            purchaseDate: data.date,
            user: { connect: { id: userId } },
            account: { connect: { id: data.accountId } },
          },
        });
      } else {
        // Se existe -> Atualiza PM e Quantidade
        let newQuantity = Number(investment.quantity);
        let newAvgPrice = Number(investment.averagePrice);

        if (data.type === 'BUY') {
          // Compra: Sobe quantidade, recalcula PM
          const currentTotal = newQuantity * newAvgPrice;
          const newTotal = currentTotal + data.quantity * data.price; // PM não inclui taxas na fórmula simples, mas pode incluir se desejar
          newQuantity += data.quantity;
          newAvgPrice = newTotal / newQuantity;
        } else {
          // Venda: Desce quantidade, PM mantém
          if (newQuantity < data.quantity)
            throw new BadRequestException('Saldo de ativos insuficiente.');
          newQuantity -= data.quantity;
        }

        investment = await tx.investment.update({
          where: { id: investment.id },
          data: {
            quantity: newQuantity,
            averagePrice: newAvgPrice,
            currentPrice: data.price,
          },
        });
      }

      // 6. Finalmente, cria o registro do Trade linkando tudo
      const trade = await tx.trade.create({
        data: {
          ticker: data.ticker,
          type: data.type as TradeType, // Cast para o Enum do Prisma
          quantity: data.quantity,
          price: data.price,
          fees: data.fees,
          totalAmount: totalAmount,
          date: data.date,
          user: { connect: { id: userId } },
          account: { connect: { id: data.accountId } },
          transaction: { connect: { id: transaction.id } },
          investment: { connect: { id: investment.id } },
        },
      });

      return trade;
    });
  }
}
