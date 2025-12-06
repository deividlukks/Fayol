import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from '../services/export.service';
import { ExportOptionsDto } from '../dto/export-options.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '@fayol/database-models';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports/export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get()
  @ApiOperation({ summary: 'Baixar relatório (PDF ou Excel)' })
  async downloadReport(
    @CurrentUser() user: User,
    @Query() query: ExportOptionsDto,
    @Res() res: Response
  ) {
    const fileBuffer = await this.exportService.generateReport(user.id, query);

    const fileType = query.type === 'EXCEL' ? 'xlsx' : 'pdf';
    const contentType =
      query.type === 'EXCEL'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf';

    const filename = `fayol_relatorio_${new Date().getTime()}.${fileType}`;

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': fileBuffer.length,
    });

    res.end(fileBuffer);
  }
}
