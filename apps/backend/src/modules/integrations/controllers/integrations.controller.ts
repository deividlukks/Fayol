import { Controller, Get, Query } from '@nestjs/common';
import { IntegrationsService } from '../services/integrations.service';

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  /**
   * GET /api/integrations/market-data?ticker=BTC
   * Obtém dados de mercado para um ticker específico
   */
  @Get('market-data')
  async getMarketData(@Query('ticker') ticker: string) {
    if (!ticker) {
      return { error: 'Ticker é obrigatório' };
    }
    return this.integrationsService.getMarketData(ticker);
  }

  /**
   * GET /api/integrations/currency-rate?base=USD&target=BRL
   * Obtém taxa de câmbio entre duas moedas
   */
  @Get('currency-rate')
  async getCurrencyRate(
    @Query('base') baseCurrency = 'USD',
    @Query('target') targetCurrency = 'BRL'
  ) {
    return this.integrationsService.getCurrencyRate(baseCurrency, targetCurrency);
  }

  /**
   * GET /api/integrations/quotes?tickers=BTC,ETH,PETR4
   * Obtém múltiplas cotações de uma vez
   */
  @Get('quotes')
  async getMultipleQuotes(@Query('tickers') tickers: string) {
    if (!tickers) {
      return { error: 'Tickers são obrigatórios (separados por vírgula)' };
    }
    const tickerArray = tickers.split(',').map((t) => t.trim());
    return this.integrationsService.getMultipleQuotes(tickerArray);
  }

  /**
   * GET /api/integrations/sync-bank?connectionId=123
   * Placeholder para sincronização com Open Banking (Fase 15)
   */
  @Get('sync-bank')
  async syncBankAccount(@Query('connectionId') connectionId: string) {
    if (!connectionId) {
      return { error: 'Connection ID é obrigatório' };
    }
    return this.integrationsService.syncBankAccount(connectionId);
  }
}
