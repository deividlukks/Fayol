import { IMarketDataProvider, AssetQuote } from './market-data.interface';

export class AlphaVantageProvider implements IMarketDataProvider {
  async getQuote(ticker: string): Promise<AssetQuote> {
    // Mock: Simula preço baseado em hash do ticker para teste
    const price = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100;

    return {
      ticker,
      price: price + 10,
      changePercent: 1.5,
      updatedAt: new Date(),
    };
  }

  async searchAssets(query: string): Promise<{ ticker: string; name: string }[]> {
    return [{ ticker: query.toUpperCase(), name: `${query.toUpperCase()} Stock` }];
  }
}
