import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TradingService } from '../services/trading.service';
import { CreateTradeDto } from '../dto/create-trade.dto';

@ApiTags('Trading')
@Controller('trading')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TradingController {
  constructor(private readonly tradingService: TradingService) {}

  @Post('trades')
  @ApiOperation({ summary: 'Registrar uma nova operação (Compra/Venda)' })
  @ApiResponse({ status: 201, description: 'Operação registrada com sucesso.' })
  async create(@Request() req: any, @Body() createTradeDto: CreateTradeDto) {
    const userId = req.user.id;
    // Correção: Chamando o método correto 'createTrade'
    return this.tradingService.createTrade(userId, createTradeDto);
  }

  @Get('portfolio')
  @ApiOperation({ summary: 'Obter posição consolidada da carteira' })
  async getPortfolio(@Request() req: any) {
    const userId = req.user.id;
    return this.tradingService.getPortfolio(userId);
  }

  @Get('trades/:ticker')
  @ApiOperation({ summary: 'Obter histórico de ordens de um ativo' })
  async getHistory(@Request() req: any, @Param('ticker') ticker: string) {
    const userId = req.user.id;
    // Correção: Chamando o método correto 'getTradesByTicker'
    return this.tradingService.getTradesByTicker(userId, ticker);
  }
}
