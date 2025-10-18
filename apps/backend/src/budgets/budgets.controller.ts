import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('budgets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo orçamento' })
  create(@CurrentUser() user: any, @Body() createBudgetDto: CreateBudgetDto) {
    return this.budgetsService.create(user.id, createBudgetDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os orçamentos do usuário' })
  findAll(@CurrentUser() user: any) {
    return this.budgetsService.findAll(user.id);
  }

  @Get('active')
  @ApiOperation({ summary: 'Listar orçamentos ativos' })
  findActive(@CurrentUser() user: any) {
    return this.budgetsService.findActive(user.id);
  }

  @Get('status')
  @ApiOperation({ summary: 'Obter status de todos os orçamentos (quanto foi gasto)' })
  getStatus(@CurrentUser() user: any) {
    return this.budgetsService.getBudgetStatus(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar orçamento por ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.budgetsService.findOne(id, user.id);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Obter status de um orçamento específico' })
  getOneStatus(@Param('id') id: string, @CurrentUser() user: any) {
    return this.budgetsService.getOneBudgetStatus(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar orçamento' })
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() updateBudgetDto: UpdateBudgetDto) {
    return this.budgetsService.update(id, user.id, updateBudgetDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover orçamento' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.budgetsService.remove(id, user.id);
  }

  @Get('alerts/unread')
  @ApiOperation({ summary: 'Buscar alertas não lidos' })
  getUnreadAlerts(@CurrentUser() user: any) {
    return this.budgetsService.getUnreadAlerts(user.id);
  }

  @Patch('alerts/:id/read')
  @ApiOperation({ summary: 'Marcar alerta como lido' })
  markAlertAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.budgetsService.markAlertAsRead(id, user.id);
  }
}
