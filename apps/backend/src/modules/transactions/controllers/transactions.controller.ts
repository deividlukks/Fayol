import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Header,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TransactionsService } from '../services/transactions.service'; // Import Ajustado
import { CreateTransactionDto, UpdateTransactionDto } from '../dto/transactions.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '@fayol/database-models';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ImportExportService } from '../services/import-export.service';
import { RecurrenceService } from '../services/recurrence.service';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly importExportService: ImportExportService,
    private readonly recurrenceService: RecurrenceService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova transação (Receita/Despesa)' })
  create(@CurrentUser() user: User, @Body() createDto: CreateTransactionDto) {
    return this.transactionsService.create(user.id, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as transações do usuário' })
  findAll(@CurrentUser() user: User) {
    return this.transactionsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes de uma transação' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.transactionsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza uma transação (Recalcula saldo se necessário)' })
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateDto: UpdateTransactionDto
  ) {
    return this.transactionsService.update(id, user.id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma transação e estorna o saldo' })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.transactionsService.remove(id, user.id);
  }

  // ==========================================
  // ENDPOINTS DE IMPORTAÇÃO E EXPORTAÇÃO
  // ==========================================

  @Get('export/csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="transactions.csv"')
  @ApiOperation({ summary: 'Exporta transações para CSV' })
  @ApiResponse({ status: 200, description: 'CSV gerado com sucesso' })
  async exportCsv(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<string> {
    const options: { startDate?: Date; endDate?: Date } = {};

    if (startDate) {
      options.startDate = new Date(startDate);
    }

    if (endDate) {
      options.endDate = new Date(endDate);
    }

    return this.importExportService.exportToCsv(user.id, options);
  }

  @Post('import/csv')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Importa transações de um CSV' })
  @ApiResponse({
    status: 200,
    description: 'Importação concluída',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'number' },
        failed: { type: 'number' },
        errors: { type: 'array', items: { type: 'object' } },
      },
    },
  })
  async importCsv(@CurrentUser() user: User, @Body('csvContent') csvContent: string) {
    return this.importExportService.importFromCsv(user.id, csvContent);
  }

  @Get('export/template')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="template.csv"')
  @ApiOperation({ summary: 'Download do template CSV para importação' })
  @ApiResponse({ status: 200, description: 'Template CSV gerado' })
  getTemplate(): string {
    return this.importExportService.generateTemplate();
  }

  // ==========================================
  // ENDPOINTS DE RECORRÊNCIA
  // ==========================================

  @Get('recurrences/upcoming')
  @ApiOperation({ summary: 'Lista próximas ocorrências de transações recorrentes' })
  @ApiResponse({
    status: 200,
    description: 'Lista de próximas transações recorrentes',
  })
  async getUpcomingRecurrences(@CurrentUser() user: User, @Query('days') days?: string) {
    const daysToLookAhead = days ? parseInt(days, 10) : 30;
    return this.recurrenceService.getUpcomingRecurrences(user.id, daysToLookAhead);
  }

  @Post('recurrences/process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Processa manualmente transações recorrentes (admin/debug)' })
  @ApiResponse({
    status: 200,
    description: 'Processamento concluído',
    schema: {
      type: 'object',
      properties: {
        created: { type: 'number' },
        skipped: { type: 'number' },
        errors: { type: 'number' },
      },
    },
  })
  async processRecurrences() {
    return this.recurrenceService.manualProcess();
  }
}
