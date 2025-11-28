import { Module } from '@nestjs/common';
import { TransactionsService } from './services/transactions.service';
import { TransactionsController } from './controllers/transactions.controller';
import { AiModule } from '../ai/ai.module'; // <--- Importar

@Module({
  imports: [AiModule], // <--- Adicionar aos imports
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}