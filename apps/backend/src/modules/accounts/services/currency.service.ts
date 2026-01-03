import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ExchangeRateResponse {
  result: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  base_code: string;
  conversion_rates: Record<string, number>;
}

interface CachedRates {
  rates: Record<string, number>;
  lastUpdate: Date;
  expiresAt: Date;
}

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private cache: Map<string, CachedRates> = new Map();
  private readonly CACHE_DURATION_MS = 3600000; // 1 hora
  private readonly API_BASE_URL = 'https://api.exchangerate-api.com/v4/latest';

  // Fallback rates caso a API esteja indisponível
  private readonly FALLBACK_RATES = {
    USD: 5.0,
    EUR: 5.5,
    GBP: 6.3,
    BRL: 1.0,
  };

  constructor(private configService: ConfigService) {}

  /**
   * Obtém a taxa de câmbio entre duas moedas
   * @param from Moeda de origem (ex: 'USD')
   * @param to Moeda de destino (ex: 'BRL')
   * @returns Taxa de conversão
   */
  async getExchangeRate(from: string, to: string): Promise<number> {
    // Se as moedas são iguais, retorna 1
    if (from === to) return 1;

    try {
      // Verifica cache
      const cached = this.cache.get(from);
      if (cached && cached.expiresAt > new Date()) {
        this.logger.debug(`Using cached rates for ${from}`);
        return cached.rates[to] || 1;
      }

      // Busca taxas atualizadas da API
      this.logger.log(`Fetching exchange rates for ${from}`);
      const response = await fetch(`${this.API_BASE_URL}/${from}`);

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data: ExchangeRateResponse = await response.json();

      if (data.result === 'error') {
        throw new Error('API returned error result');
      }

      // Atualiza cache
      this.cache.set(from, {
        rates: data.conversion_rates,
        lastUpdate: new Date(),
        expiresAt: new Date(Date.now() + this.CACHE_DURATION_MS),
      });

      return data.conversion_rates[to] || 1;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(
        `Failed to fetch exchange rate ${from}->${to}: ${errorMessage}. Using fallback.`
      );
      return this.getFallbackRate(from, to);
    }
  }

  /**
   * Converte um valor de uma moeda para outra
   * @param amount Valor a ser convertido
   * @param from Moeda de origem
   * @param to Moeda de destino
   * @returns Valor convertido
   */
  async convertAmount(amount: number, from: string, to: string): Promise<number> {
    const rate = await this.getExchangeRate(from, to);
    return amount * rate;
  }

  /**
   * Obtém taxas de múltiplas moedas de uma vez
   * @param baseCurrency Moeda base (ex: 'USD')
   * @param targetCurrencies Array de moedas alvo (ex: ['BRL', 'EUR'])
   * @returns Objeto com as taxas { BRL: 5.0, EUR: 0.85 }
   */
  async getMultipleRates(
    baseCurrency: string,
    targetCurrencies: string[]
  ): Promise<Record<string, number>> {
    const rates: Record<string, number> = {};

    for (const target of targetCurrencies) {
      rates[target] = await this.getExchangeRate(baseCurrency, target);
    }

    return rates;
  }

  /**
   * Limpa o cache de taxas de câmbio
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.log('Exchange rate cache cleared');
  }

  /**
   * Retorna taxa de fallback quando a API falha
   */
  private getFallbackRate(from: string, to: string): number {
    // Se estamos convertendo para BRL
    if (to === 'BRL') {
      return this.FALLBACK_RATES[from] || 1;
    }

    // Se estamos convertendo de BRL
    if (from === 'BRL') {
      const rate = this.FALLBACK_RATES[to];
      return rate ? 1 / rate : 1;
    }

    // Para outras conversões, usa USD como intermediário
    const fromToUsd = this.FALLBACK_RATES[from] || 1;
    const toToUsd = this.FALLBACK_RATES[to] || 1;
    return fromToUsd / toToUsd;
  }

  /**
   * Retorna informações sobre o cache atual
   */
  getCacheInfo(): { currency: string; lastUpdate: Date; expiresAt: Date }[] {
    const info: { currency: string; lastUpdate: Date; expiresAt: Date }[] = [];

    this.cache.forEach((value, key) => {
      info.push({
        currency: key,
        lastUpdate: value.lastUpdate,
        expiresAt: value.expiresAt,
      });
    });

    return info;
  }
}
