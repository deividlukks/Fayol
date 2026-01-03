import { Injectable, Logger } from '@nestjs/common';
import { MarketDataService } from './market-data.service';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(private readonly marketDataService: MarketDataService) {}

  /**
   * OPEN BANKING - Sincronizar conta bancária
   * Esta funcionalidade será implementada na FASE 15 do roadmap
   * Integrações planejadas: Pluggy, Belvo
   *
   * @param connectionId - ID da conexão com a instituição financeira
   * @returns Status da sincronização
   */
  async syncBankAccount(connectionId: string) {
    this.logger.warn(
      `[FASE 15 - Não implementado] Tentativa de sincronizar conta bancária: ${connectionId}`
    );
    return {
      status: 'not_implemented',
      message: 'Integração com Open Banking será implementada na Fase 15',
      plannedIntegrations: ['Pluggy', 'Belvo'],
      connectionId,
    };
  }

  /**
   * Obtém dados de mercado (ações, crypto, moedas)
   * Delega para o MarketDataService
   */
  async getMarketData(ticker: string) {
    // Detecta o tipo de ativo e chama o método apropriado
    if (ticker.match(/^[A-Z]{3,4}$/)) {
      // Crypto (3-4 letras maiúsculas)
      return this.marketDataService.getCryptoData(ticker);
    } else {
      // Ação
      return this.marketDataService.getStockData(ticker);
    }
  }

  /**
   * Obtém taxa de câmbio entre duas moedas
   */
  async getCurrencyRate(baseCurrency: string, targetCurrency: string) {
    return this.marketDataService.getCurrencyRate(baseCurrency, targetCurrency);
  }

  /**
   * Obtém múltiplas cotações de uma vez
   */
  async getMultipleQuotes(tickers: string[]) {
    return this.marketDataService.getMultipleQuotes(tickers);
  }

  /**
   * PAYMENT GATEWAYS - Criar pagamento
   * Esta funcionalidade será implementada na FASE 15 do roadmap
   * Integrações planejadas: Stripe, PagSeguro, PIX
   */
  async createPayment(amount: number, currency: string) {
    this.logger.warn(
      `[FASE 15 - Não implementado] Tentativa de criar pagamento: ${amount} ${currency}`
    );
    return {
      status: 'not_implemented',
      message: 'Integração com Gateways de Pagamento será implementada na Fase 15',
      plannedIntegrations: ['Stripe', 'PagSeguro', 'PIX'],
    };
  }
}
