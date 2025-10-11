import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily-summary')
  @ApiOperation({ summary: 'Resumo diário de transações' })
  @ApiQuery({ name: 'date', example: '2024-01-15' })
  getDailySummary(@CurrentUser() user: any, @Query('date') date: string) {
    return this.reportsService.getDailySummary(user.id, date);
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Relatório mensal' })
  @ApiQuery({ name: 'month', example: '2024-01' })
  getMonthlyReport(@CurrentUser() user: any, @Query('month') month: string) {
    return this.reportsService.getMonthlyReport(user.id, month);
  }

  @Get('by-category')
  @ApiOperation({ summary: 'Relatório por categoria' })
  @ApiQuery({ name: 'startDate', example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', example: '2024-01-31' })
  getByCategory(
    @CurrentUser() user: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getByCategory(user.id, startDate, endDate);
  }

  @Get('monthly-full')
  @ApiOperation({ summary: 'Relatório mensal completo com comparação' })
  @ApiQuery({ name: 'month', example: '2024-01' })
  getMonthlyFull(@CurrentUser() user: any, @Query('month') month: string) {
    return this.reportsService.getMonthlyFull(user.id, month);
  }

  @Get('yearly')
  @ApiOperation({ summary: 'Relatório anual' })
  @ApiQuery({ name: 'year', example: '2024' })
  getYearlyReport(@CurrentUser() user: any, @Query('year') year: string) {
    return this.reportsService.getYearlyReport(user.id, year);
  }
}
