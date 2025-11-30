import { Module } from '@nestjs/common';
import { ReportsService } from './services/reports.service';
import { InsightsService } from './services/insights.service';
import { ReportsController } from './controllers/reports.controller';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, InsightsService], // Adicionado InsightsService
})
export class ReportsModule {}