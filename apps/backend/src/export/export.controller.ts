import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('export')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('csv')
  @ApiOperation({ summary: 'Exportar transações para CSV' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async exportCsv(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const { filename, content, mimeType } = await this.exportService.exportToCsv(
      user.id,
      startDate,
      endDate,
    );

    return {
      filename,
      content,
      mimeType,
      message: 'Use o conteúdo para fazer download do CSV',
    };
  }

  @Get('full-backup')
  @ApiOperation({ summary: 'Backup completo dos dados do usuário (LGPD)' })
  async exportFullBackup(@CurrentUser() user: any) {
    const { filename, content, mimeType } = await this.exportService.exportFullBackup(user.id);

    return {
      filename,
      content,
      mimeType,
      message: 'Use o conteúdo para fazer download do backup',
    };
  }

  @Get('pdf')
  @ApiOperation({ summary: 'Exportar relatório mensal para HTML/PDF' })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'month', required: false })
  async exportPdf(
    @CurrentUser() user: any,
    @Query('year') year?: number,
    @Query('month') month?: number,
  ) {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    const { filename, content, mimeType } = await this.exportService.exportToPDF(
      user.id,
      targetYear,
      targetMonth,
    );

    return {
      filename,
      content,
      mimeType,
      message: 'Relatório em HTML. Pode ser convertido para PDF com ferramentas online.',
    };
  }
}
