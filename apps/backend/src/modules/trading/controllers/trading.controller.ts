import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { TradingService } from '../services/trading.service';
import { CreateTradeDto } from '../dto/trades.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '@fayol/database-models';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Trading')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trading')
export class TradingController {
  constructor(private readonly tradingService: TradingService) {}

  @Post('order')
  @ApiOperation({ summary: 'Executa uma ordem de Compra ou Venda' })
  createOrder(@CurrentUser() user: User, @Body() createDto: CreateTradeDto) {
    return this.tradingService.create(user.id, createDto);
  }
}
