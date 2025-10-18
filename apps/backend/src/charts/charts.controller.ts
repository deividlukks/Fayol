import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ChartsService } from './charts.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('charts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('charts')
export class ChartsController {
  constructor(
    private readonly chartsService: ChartsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('spending-by-category')
  @ApiOperation({ summary: 'Gerar gráfico de gastos por categoria (Pizza)' })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'month', required: false })
  async getSpendingByCategoryChart(
    @CurrentUser() user: any,
    @Query('year') year?: number,
    @Query('month') month?: number,
    @Res() res?: Response,
  ) {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    // Buscar transações do período
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId: user.id,
        movementType: 'expense',
        effectiveDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
    });

    // Agrupar por categoria
    const categoryMap = new Map<string, number>();

    transactions.forEach(t => {
      const categoryName = t.category.name;
      const current = categoryMap.get(categoryName) || 0;
      categoryMap.set(categoryName, current + t.amount.toNumber());
    });

    // Converter para array
    const data = Array.from(categoryMap.entries()).map(([label, value]) => ({
      label,
      value,
      color: this.chartsService.getCategoryColor(label),
    }));

    // Ordenar por valor (maior primeiro)
    data.sort((a, b) => b.value - a.value);

    // Gerar gráfico
    const chartUrl = await this.chartsService.generatePieChart(
      data,
      `Gastos por Categoria - ${this.getMonthName(targetMonth)}/${targetYear}`
    );

    if (res) {
      // Download da imagem
      const imageBuffer = await this.chartsService.downloadChartImage(chartUrl);
      res.set({
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline; filename="spending-chart.png"',
      });
      res.send(imageBuffer);
    } else {
      return { chartUrl, data };
    }
  }

  @Get('monthly-comparison')
  @ApiOperation({ summary: 'Gerar gráfico comparativo mensal (Barras)' })
  @ApiQuery({ name: 'year', required: false })
  async getMonthlyComparisonChart(
    @CurrentUser() user: any,
    @Query('year') year?: number,
    @Res() res?: Response,
  ) {
    const targetYear = year || new Date().getFullYear();

    const labels: string[] = [];
    const incomeData: number[] = [];
    const expenseData: number[] = [];

    // Buscar dados dos últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);

      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const transactions = await this.prisma.transaction.findMany({
        where: {
          userId: user.id,
          effectiveDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const income = transactions
        .filter(t => t.movementType === 'income')
        .reduce((sum, t) => sum + t.amount.toNumber(), 0);

      const expense = transactions
        .filter(t => t.movementType === 'expense')
        .reduce((sum, t) => sum + t.amount.toNumber(), 0);

      labels.push(`${this.getMonthName(month).substring(0, 3)}/${year}`);
      incomeData.push(income);
      expenseData.push(expense);
    }

    // Gerar gráfico
    const chartUrl = await this.chartsService.generateBarChart(
      labels,
      incomeData,
      expenseData,
      'Evolução Receitas vs Despesas (Últimos 6 Meses)'
    );

    if (res) {
      const imageBuffer = await this.chartsService.downloadChartImage(chartUrl);
      res.set({
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline; filename="monthly-comparison.png"',
      });
      res.send(imageBuffer);
    } else {
      return { chartUrl, labels, incomeData, expenseData };
    }
  }

  @Get('balance-evolution')
  @ApiOperation({ summary: 'Gerar gráfico de evolução do saldo (Linha)' })
  async getBalanceEvolutionChart(
    @CurrentUser() user: any,
    @Res() res?: Response,
  ) {
    const labels: string[] = [];
    const balanceData: number[] = [];

    // Buscar dados dos últimos 30 dias
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(23, 59, 59, 999);

      const transactions = await this.prisma.transaction.findMany({
        where: {
          userId: user.id,
          effectiveDate: {
            lte: date,
          },
        },
      });

      const balance = transactions.reduce((sum, t) => {
        const amount = t.amount.toNumber();
        return t.movementType === 'income' ? sum + amount : sum - amount;
      }, 0);

      labels.push(date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
      balanceData.push(balance);
    }

    // Gerar gráfico
    const chartUrl = await this.chartsService.generateLineChart(
      labels,
      balanceData,
      'Evolução do Saldo (Últimos 30 Dias)',
      'Saldo',
      '#2196F3'
    );

    if (res) {
      const imageBuffer = await this.chartsService.downloadChartImage(chartUrl);
      res.set({
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline; filename="balance-evolution.png"',
      });
      res.send(imageBuffer);
    } else {
      return { chartUrl, labels, data: balanceData };
    }
  }

  private getMonthName(month: number): string {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1] || '';
  }
}
