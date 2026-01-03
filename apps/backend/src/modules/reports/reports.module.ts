import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ReportsService } from './services/reports.service';
import { InsightsService } from './services/insights.service';
import { ExportService } from './services/export.service';
import { ChartsService } from './services/charts.service';
import { ReportsController } from './controllers/reports.controller';
import { ExportController } from './controllers/export.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule, HttpModule],
  controllers: [ReportsController, ExportController],
  providers: [ReportsService, InsightsService, ExportService, ChartsService],
  exports: [ChartsService],
})
export class ReportsModule {}
