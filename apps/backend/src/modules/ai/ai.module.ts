import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiService } from './services/ai.service';
import { AiController } from './controllers/ai.controller';

@Module({
  imports: [HttpModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService], // <--- Adicionado para que o TransactionsModule possa usar
})
export class AiModule {}
