import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TransactionsService } from '../services/transactions.service'; // Import Ajustado
import { CreateTransactionDto, UpdateTransactionDto } from '../dto/transactions.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '@fayol/database-models';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

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
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() updateDto: UpdateTransactionDto) {
    return this.transactionsService.update(id, user.id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma transação e estorna o saldo' })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.transactionsService.remove(id, user.id);
  }
}