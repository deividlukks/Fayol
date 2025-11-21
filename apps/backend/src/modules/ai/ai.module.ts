import { Module } from '@nestjs/common';
import { AiService } from './services/ai.service';
import { AiController } from './controllers/ai.controller';

@Module({
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}