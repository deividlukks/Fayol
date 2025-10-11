import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Obter saldo total' })
  getBalance(@CurrentUser() user: any) {
    return this.dashboardService.getBalance(user.id);
  }

  @Get('summary-cards')
  @ApiOperation({ summary: 'Cards de resumo do mês atual' })
  getSummaryCards(@CurrentUser() user: any) {
    return this.dashboardService.getSummaryCards(user.id);
  }

  @Get('latest-transactions')
  @ApiOperation({ summary: 'Últimas transações' })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  getLatestTransactions(@CurrentUser() user: any, @Query('limit') limit?: number) {
    return this.dashboardService.getLatestTransactions(user.id, limit ? Number(limit) : 10);
  }

  @Get('spending-by-category')
  @ApiOperation({ summary: 'Gastos por categoria do mês atual' })
  getSpendingByCategory(@CurrentUser() user: any) {
    return this.dashboardService.getSpendingByCategory(user.id);
  }

  @Get('financial-health')
  @ApiOperation({ summary: 'Score de saúde financeira' })
  getFinancialHealth(@CurrentUser() user: any) {
    return this.dashboardService.getFinancialHealth(user.id);
  }

  @Get('monthly-comparison')
  @ApiOperation({ summary: 'Comparação mensal de gastos (últimos 6 meses)' })
  @ApiQuery({ name: 'months', required: false, example: 6 })
  getMonthlyComparison(@CurrentUser() user: any, @Query('months') months?: number) {
    return this.dashboardService.getMonthlyComparison(user.id, months ? Number(months) : 6);
  }

  @Get('pending-transactions')
  @ApiOperation({ summary: 'Contas pendentes (a pagar e a receber)' })
  getPendingTransactions(@CurrentUser() user: any) {
    return this.dashboardService.getPendingTransactions(user.id);
  }

  @Get('active-recurring')
  @ApiOperation({ summary: 'Transações recorrentes ativas' })
  getActiveRecurring(@CurrentUser() user: any) {
    return this.dashboardService.getActiveRecurring(user.id);
  }

  @Get('net-worth-evolution')
  @ApiOperation({ summary: 'Evolução patrimonial (últimos 12 meses)' })
  @ApiQuery({ name: 'months', required: false, example: 12 })
  getNetWorthEvolution(@CurrentUser() user: any, @Query('months') months?: number) {
    return this.dashboardService.getNetWorthEvolution(user.id, months ? Number(months) : 12);
  }

  @Get('top-categories')
  @ApiOperation({ summary: 'Top categorias de gastos' })
  @ApiQuery({ name: 'limit', required: false, example: 5 })
  @ApiQuery({ name: 'period', required: false, enum: ['month', 'year'], example: 'month' })
  getTopCategories(
    @CurrentUser() user: any,
    @Query('limit') limit?: number,
    @Query('period') period?: 'month' | 'year',
  ) {
    return this.dashboardService.getTopCategories(
      user.id,
      limit ? Number(limit) : 5,
      period || 'month',
    );
  }

  @Get('complete')
  @ApiOperation({ summary: 'Dashboard completo com todos os widgets' })
  getCompleteDashboard(@CurrentUser() user: any) {
    return this.dashboardService.getCompleteDashboard(user.id);
  }
}
