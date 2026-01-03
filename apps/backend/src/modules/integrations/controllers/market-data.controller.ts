import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AlphaVantageService } from '../services/alpha-vantage.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Market Data (Alpha Vantage)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('integrations/market-data')
export class MarketDataController {
  constructor(private alphaVantageService: AlphaVantageService) {}

  /**
   * Obtém cotação de uma ação
   */
  @Get('stock/quote')
  @ApiOperation({
    summary: 'Get stock quote',
    description: 'Gets real-time quote for a stock symbol',
  })
  @ApiQuery({ name: 'symbol', example: 'AAPL' })
  async getStockQuote(@Query('symbol') symbol: string) {
    return this.alphaVantageService.getStockQuote(symbol);
  }

  /**
   * Obtém série histórica diária
   */
  @Get('stock/daily')
  @ApiOperation({
    summary: 'Get daily time series',
    description: 'Gets daily historical data for a stock',
  })
  @ApiQuery({ name: 'symbol', example: 'AAPL' })
  @ApiQuery({ name: 'outputsize', required: false, enum: ['compact', 'full'] })
  async getDailyTimeSeries(
    @Query('symbol') symbol: string,
    @Query('outputsize') outputsize?: 'compact' | 'full'
  ) {
    return this.alphaVantageService.getDailyTimeSeries(symbol, outputsize);
  }

  /**
   * Obtém série histórica intraday
   */
  @Get('stock/intraday')
  @ApiOperation({
    summary: 'Get intraday time series',
    description: 'Gets intraday historical data for a stock',
  })
  @ApiQuery({ name: 'symbol', example: 'AAPL' })
  @ApiQuery({
    name: 'interval',
    required: false,
    enum: ['1min', '5min', '15min', '30min', '60min'],
  })
  async getIntradayTimeSeries(
    @Query('symbol') symbol: string,
    @Query('interval') interval?: '1min' | '5min' | '15min' | '30min' | '60min'
  ) {
    return this.alphaVantageService.getIntradayTimeSeries(symbol, interval);
  }

  /**
   * Busca símbolos
   */
  @Get('stock/search')
  @ApiOperation({
    summary: 'Search stock symbols',
    description: 'Searches for stock symbols by keywords',
  })
  @ApiQuery({ name: 'keywords', example: 'Apple' })
  async searchSymbols(@Query('keywords') keywords: string) {
    return this.alphaVantageService.searchSymbols(keywords);
  }

  /**
   * Obtém cotação de criptomoeda
   */
  @Get('crypto/quote')
  @ApiOperation({
    summary: 'Get crypto quote',
    description: 'Gets real-time quote for a cryptocurrency',
  })
  @ApiQuery({ name: 'symbol', example: 'BTC' })
  @ApiQuery({ name: 'market', required: false, example: 'USD' })
  async getCryptoQuote(@Query('symbol') symbol: string, @Query('market') market?: string) {
    return this.alphaVantageService.getCryptoQuote(symbol, market);
  }

  /**
   * Obtém série histórica de criptomoeda
   */
  @Get('crypto/daily')
  @ApiOperation({
    summary: 'Get crypto daily time series',
    description: 'Gets daily historical data for a cryptocurrency',
  })
  @ApiQuery({ name: 'symbol', example: 'BTC' })
  @ApiQuery({ name: 'market', required: false, example: 'USD' })
  async getCryptoDailyTimeSeries(
    @Query('symbol') symbol: string,
    @Query('market') market?: string
  ) {
    return this.alphaVantageService.getCryptoDailyTimeSeries(symbol, market);
  }

  /**
   * Obtém indicador SMA
   */
  @Get('indicators/sma')
  @ApiOperation({
    summary: 'Get SMA indicator',
    description: 'Gets Simple Moving Average for a stock',
  })
  @ApiQuery({ name: 'symbol', example: 'AAPL' })
  @ApiQuery({ name: 'interval', required: false, example: 'daily' })
  @ApiQuery({ name: 'timePeriod', required: false, example: '20' })
  async getSMA(
    @Query('symbol') symbol: string,
    @Query('interval') interval?: string,
    @Query('timePeriod') timePeriod?: string
  ) {
    return this.alphaVantageService.getSMA(
      symbol,
      interval,
      timePeriod ? parseInt(timePeriod) : undefined
    );
  }

  /**
   * Obtém indicador RSI
   */
  @Get('indicators/rsi')
  @ApiOperation({
    summary: 'Get RSI indicator',
    description: 'Gets Relative Strength Index for a stock',
  })
  @ApiQuery({ name: 'symbol', example: 'AAPL' })
  @ApiQuery({ name: 'interval', required: false, example: 'daily' })
  @ApiQuery({ name: 'timePeriod', required: false, example: '14' })
  async getRSI(
    @Query('symbol') symbol: string,
    @Query('interval') interval?: string,
    @Query('timePeriod') timePeriod?: string
  ) {
    return this.alphaVantageService.getRSI(
      symbol,
      interval,
      timePeriod ? parseInt(timePeriod) : undefined
    );
  }

  /**
   * Obtém taxa de câmbio
   */
  @Get('forex/rate')
  @ApiOperation({
    summary: 'Get exchange rate',
    description: 'Gets exchange rate between two currencies',
  })
  @ApiQuery({ name: 'from', example: 'USD' })
  @ApiQuery({ name: 'to', example: 'BRL' })
  async getExchangeRate(@Query('from') from: string, @Query('to') to: string) {
    const rate = await this.alphaVantageService.getExchangeRate(from, to);
    return {
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      rate,
    };
  }
}
