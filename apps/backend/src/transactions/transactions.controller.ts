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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { TransferDto } from './dto/transfer.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova transação' })
  @ApiResponse({ status: 201, description: 'Transação criada com sucesso' })
  create(@CurrentUser() user: any, @Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create(user.id, createTransactionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar transações com filtros' })
  @ApiResponse({ status: 200, description: 'Lista de transações' })
  findAll(@CurrentUser() user: any, @Query() filters: FilterTransactionDto) {
    return this.transactionsService.findAll(user.id, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar transação por ID' })
  @ApiResponse({ status: 200, description: 'Transação encontrada' })
  @ApiResponse({ status: 404, description: 'Transação não encontrada' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.transactionsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar transação (apenas não efetivadas)' })
  @ApiResponse({ status: 200, description: 'Transação atualizada' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(id, user.id, updateTransactionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover transação (apenas não efetivadas)' })
  @ApiResponse({ status: 200, description: 'Transação removida' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.transactionsService.remove(id, user.id);
  }

  @Post(':id/effectuate')
  @ApiOperation({ summary: 'Efetivar transação' })
  @ApiResponse({ status: 200, description: 'Transação efetivada' })
  effectuate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.transactionsService.effectuate(id, user.id);
  }

  @Patch(':id/pause')
  @ApiOperation({ summary: 'Pausar transação recorrente' })
  @ApiResponse({ status: 200, description: 'Transação pausada' })
  pause(@Param('id') id: string, @CurrentUser() user: any) {
    return this.transactionsService.pause(id, user.id);
  }

  @Patch(':id/resume')
  @ApiOperation({ summary: 'Retomar transação recorrente' })
  @ApiResponse({ status: 200, description: 'Transação retomada' })
  resume(@Param('id') id: string, @CurrentUser() user: any) {
    return this.transactionsService.resume(id, user.id);
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Realizar transferência entre contas' })
  @ApiResponse({ status: 201, description: 'Transferência realizada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou saldo insuficiente' })
  transfer(@CurrentUser() user: any, @Body() transferDto: TransferDto) {
    return this.transactionsService.createTransfer(user.id, transferDto);
  }
}
