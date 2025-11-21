import { Module } from '@nestjs/common';
import { InvestmentsService } from './services/investments.service';
import { InvestmentsController } from './controllers/investments.controller';

@Module({
  controllers: [InvestmentsController],
  providers: [InvestmentsService],
  exports: [InvestmentsService],
})
export class InvestmentsModule {}