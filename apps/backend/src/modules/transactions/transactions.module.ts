import { Module } from '@nestjs/common';
import { TransactionsService } from './services/transactions.service'; // Ajustado
import { TransactionsController } from './controllers/transactions.controller'; // Ajustado

@Module({
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}