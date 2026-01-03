import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { BudgetsService } from '../services/budgets.service';
import { CreateBudgetDto, UpdateBudgetDto } from '../dto/budgets.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '@fayol/database-models';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Budgets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um orçamento para uma categoria ou global' })
  create(@CurrentUser() user: User, @Body() createDto: CreateBudgetDto) {
    return this.budgetsService.create(user.id, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista orçamentos com o valor já gasto calculado' })
  findAll(@CurrentUser() user: User) {
    return this.budgetsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes do orçamento' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.budgetsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um orçamento' })
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() updateDto: UpdateBudgetDto) {
    return this.budgetsService.update(id, user.id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um orçamento' })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.budgetsService.remove(id, user.id);
  }

  // ==========================================
  // ALERTAS E PROGRESSO
  // ==========================================

  @Get('progress/all')
  @ApiOperation({ summary: 'Retorna progresso detalhado de todos os orçamentos' })
  getProgress(@CurrentUser() user: User) {
    return this.budgetsService.getProgress(user.id);
  }

  @Get('alerts/active')
  @ApiOperation({ summary: 'Retorna alertas de orçamentos que ultrapassaram o threshold' })
  getAlerts(@CurrentUser() user: User) {
    return this.budgetsService.getAlerts(user.id);
  }
}
