import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RecurringTransactionsService } from './recurring-transactions.service';
import { CreateRecurringTransactionDto } from './dto/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from './dto/update-recurring-transaction.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Recurring Transactions')
@ApiBearerAuth()
@Controller('recurring-transactions')
@UseGuards(JwtAuthGuard)
export class RecurringTransactionsController {
  constructor(private readonly recurringTransactionsService: RecurringTransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar transação recorrente' })
  @ApiResponse({
    status: 201,
    description: 'Transação recorrente criada com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  create(@Request() req, @Body() dto: CreateRecurringTransactionDto) {
    return this.recurringTransactionsService.create(req.user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as transações recorrentes' })
  @ApiResponse({
    status: 200,
    description: 'Lista de transações recorrentes',
  })
  findAll(@Request() req) {
    return this.recurringTransactionsService.findAll(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar transação recorrente por ID' })
  @ApiResponse({ status: 200, description: 'Transação recorrente encontrada' })
  @ApiResponse({ status: 404, description: 'Transação recorrente não encontrada' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.recurringTransactionsService.findOne(req.user.sub, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar transação recorrente' })
  @ApiResponse({
    status: 200,
    description: 'Transação recorrente atualizada com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Transação recorrente não encontrada' })
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateRecurringTransactionDto) {
    return this.recurringTransactionsService.update(req.user.sub, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir transação recorrente' })
  @ApiResponse({
    status: 200,
    description: 'Transação recorrente excluída com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Transação recorrente não encontrada' })
  remove(@Request() req, @Param('id') id: string) {
    return this.recurringTransactionsService.remove(req.user.sub, id);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pausar transação recorrente' })
  @ApiResponse({
    status: 200,
    description: 'Transação recorrente pausada com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Transação recorrente não encontrada' })
  pause(@Request() req, @Param('id') id: string) {
    return this.recurringTransactionsService.pause(req.user.sub, id);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Retomar transação recorrente' })
  @ApiResponse({
    status: 200,
    description: 'Transação recorrente retomada com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Transação recorrente não encontrada' })
  resume(@Request() req, @Param('id') id: string) {
    return this.recurringTransactionsService.resume(req.user.sub, id);
  }
}
