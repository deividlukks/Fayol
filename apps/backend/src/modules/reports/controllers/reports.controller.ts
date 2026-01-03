import { Controller, Get, Query, UseGuards, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from '../services/reports.service';
import { InsightsService } from '../services/insights.service';
import { ChartsService } from '../services/charts.service';
import { GetReportDto } from '../dto/reports.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '@fayol/database-models';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly insightsService: InsightsService,
    private readonly chartsService: ChartsService
  ) {}

  @Get('summary')
  @ApiOperation({ summary: 'Resumo do Dashboard (Saldo total e Fluxo do mês)' })
  getSummary(@CurrentUser() user: User, @Query() query: GetReportDto) {
    return this.reportsService.getDashboardSummary(user.id, query);
  }

  @Get('expenses-by-category')
  @ApiOperation({ summary: 'Gastos agrupados por categoria (Gráfico de Pizza)' })
  getExpensesByCategory(@CurrentUser() user: User, @Query() query: GetReportDto) {
    return this.reportsService.getExpensesByCategory(user.id, query);
  }

  @Get('cash-flow')
  @ApiOperation({ summary: 'Fluxo de caixa diário (Gráfico de Linha/Barra)' })
  getCashFlow(@CurrentUser() user: User, @Query() query: GetReportDto) {
    return this.reportsService.getCashFlow(user.id, query);
  }

  @Get('insights')
  @ApiOperation({ summary: 'Gera insights baseados nos dados do usuário' })
  getInsights(@CurrentUser() user: User) {
    return this.insightsService.generateInsights(user.id);
  }

  // ==========================================
  // GRÁFICOS
  // ==========================================

  @Get('charts/monthly-evolution')
  @ApiOperation({ summary: 'Retorna dados para gráfico de evolução mensal' })
  async getMonthlyEvolutionChart(@CurrentUser() user: User, @Query('months') months?: string) {
    const monthsNum = months ? parseInt(months, 10) : 6;
    return this.chartsService.getMonthlyEvolutionData(user.id, monthsNum);
  }

  @Get('charts/expenses-pie')
  @ApiOperation({ summary: 'Retorna dados para gráfico de pizza de despesas por categoria' })
  async getExpensesPieChart(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.chartsService.getExpensesByCategory(user.id, start, end);
  }

  @Get('charts/financial-summary')
  @ApiOperation({ summary: 'Retorna resumo financeiro para relatórios' })
  async getFinancialSummary(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.chartsService.getFinancialSummary(user.id, start, end);
  }
}
