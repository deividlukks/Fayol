import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { InvestmentsService } from '../services/investments.service';
import { ProfitabilityService } from '../services/profitability.service';
import { CreateInvestmentDto, UpdateInvestmentDto } from '../dto/investments.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '@fayol/database-models';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Investments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('investments')
export class InvestmentsController {
  constructor(
    private readonly investmentsService: InvestmentsService,
    private readonly profitabilityService: ProfitabilityService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Registra um novo ativo/investimento' })
  create(@CurrentUser() user: User, @Body() createDto: CreateInvestmentDto) {
    return this.investmentsService.create(user.id, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista carteira de investimentos com rentabilidade calculada' })
  findAll(@CurrentUser() user: User) {
    return this.investmentsService.findAll(user.id);
  }

  @Get('lookup/:ticker')
  @ApiOperation({ summary: 'Busca dados automáticos de um ativo pelo ticker (Simulado)' })
  lookup(@Param('ticker') ticker: string) {
    return this.investmentsService.lookupTicker(ticker);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes do ativo' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.investmentsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza dados do investimento (ex: nova cotação)' })
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateDto: UpdateInvestmentDto
  ) {
    return this.investmentsService.update(id, user.id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove o ativo da carteira' })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.investmentsService.remove(id, user.id);
  }

  // ==========================================
  // RENTABILIDADE E ATUALIZAÇÃO DE PREÇOS
  // ==========================================

  @Get('profitability/portfolio')
  @ApiOperation({ summary: 'Retorna rentabilidade consolidada do portfólio' })
  getPortfolioProfitability(@CurrentUser() user: User) {
    return this.profitabilityService.calculatePortfolioProfitability(user.id);
  }

  @Get('profitability/:id')
  @ApiOperation({ summary: 'Retorna rentabilidade de um investimento específico' })
  getInvestmentProfitability(@CurrentUser() user: User, @Param('id') id: string) {
    return this.profitabilityService.calculateInvestmentProfitability(id, user.id);
  }

  @Post('prices/update')
  @ApiOperation({ summary: 'Atualiza preços de todos os investimentos do usuário' })
  updatePrices(@CurrentUser() user: User) {
    return this.profitabilityService.updateAllPrices(user.id);
  }
}
