import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { GoalsService } from '../services/goals.service';
import { CreateGoalDto } from '../dto/create-goal.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '@fayol/database-models';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Goals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova meta financeira' })
  create(@CurrentUser() user: User, @Body() dto: CreateGoalDto) {
    return this.goalsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista as metas do usuário' })
  findAll(@CurrentUser() user: User) {
    return this.goalsService.findAll(user.id);
  }

  @Patch(':id/amount')
  @ApiOperation({ summary: 'Atualiza o valor guardado na meta' })
  updateAmount(@CurrentUser() user: User, @Param('id') id: string, @Body('amount') amount: number) {
    return this.goalsService.updateAmount(id, user.id, amount);
  }
}
