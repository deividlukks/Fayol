import { Module } from '@nestjs/common';
import { TransactionsService } from './services/transactions.service';
import { TransactionsController } from './controllers/transactions.controller';
import { AiModule } from '../ai/ai.module'; // <--- Importar
import { ImportExportService } from './services/import-export.service';
import { RecurrenceService } from './services/recurrence.service';

@Module({
  imports: [AiModule], // <--- Adicionar aos imports
  controllers: [TransactionsController],
  providers: [TransactionsService, ImportExportService, RecurrenceService],
  exports: [TransactionsService, ImportExportService, RecurrenceService],
})
export class TransactionsModule {}
