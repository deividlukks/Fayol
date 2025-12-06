import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from '../services/reports.service';
import { InsightsService } from '../services/insights.service'; // Certifique-se de importar
import { GetReportDto } from '../dto/reports.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '@fayol/database-models';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly insightsService: InsightsService // Adicionado private readonly
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
}
