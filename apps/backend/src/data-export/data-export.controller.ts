import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { DataExportService } from './data-export.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DataExportRequest, CreateDataExportDto, DataExportStatus } from '@fayol/shared-types';
import { Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@ApiTags('Data Export (LGPD)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('data-export')
export class DataExportController {
  constructor(private dataExportService: DataExportService) {}

  /**
   * Cria uma requisição de exportação de dados
   */
  @Post()
  @ApiOperation({
    summary: 'Request user data export',
    description: 'Creates a request to export all user data (LGPD data portability)',
  })
  async createExport(
    @Req() req: Request,
    @Body() dto: CreateDataExportDto
  ): Promise<DataExportRequest> {
    const userId = (req.user as any).id;
    const ipAddress = req.ip;

    return this.dataExportService.createExportRequest(userId, dto, ipAddress);
  }

  /**
   * Lista todas as requisições de exportação do usuário
   */
  @Get()
  @ApiOperation({
    summary: 'List export requests',
    description: 'Lists all data export requests for the current user',
  })
  async getExportRequests(@Req() req: Request): Promise<DataExportRequest[]> {
    const userId = (req.user as any).id;
    return this.dataExportService.getUserExportRequests(userId);
  }

  /**
   * Busca uma requisição específica
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get export request details',
    description: 'Gets details of a specific export request',
  })
  async getExportRequest(
    @Req() req: Request,
    @Param('id') requestId: string
  ): Promise<DataExportRequest> {
    const userId = (req.user as any).id;
    return this.dataExportService.getExportRequest(userId, requestId);
  }

  /**
   * Faz download do arquivo exportado
   */
  @Get(':id/download')
  @ApiOperation({
    summary: 'Download exported data',
    description: 'Downloads the exported data file if available',
  })
  async downloadExport(
    @Req() req: Request,
    @Param('id') requestId: string,
    @Res() res: Response
  ): Promise<void> {
    const userId = (req.user as any).id;
    const exportRequest = await this.dataExportService.getExportRequest(userId, requestId);

    if (exportRequest.status !== DataExportStatus.COMPLETED) {
      throw new NotFoundException('Export not completed yet');
    }

    if (!exportRequest.downloadUrl) {
      throw new NotFoundException('Download URL not available');
    }

    const fileName = exportRequest.downloadUrl.replace('/exports/', '');
    const filePath = path.join(process.cwd(), 'exports', fileName);

    // Verifica se o arquivo existe
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Export file not found');
    }

    // Define headers para download
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Envia o arquivo
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }
}
