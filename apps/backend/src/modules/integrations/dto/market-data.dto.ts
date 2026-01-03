export class MarketDataDto {
  ticker: string;
  name?: string;
  price: number;
  currency: string;
  change?: number;
  changePercent?: number;
  high?: number;
  low?: number;
  volume?: number;
  lastUpdate: Date;
  source: string;
}

export class CurrencyRateDto {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  lastUpdate: Date;
  source: string;
}

export class CryptoDataDto {
  symbol: string;
  name: string;
  currentPrice: number;
  marketCap?: number;
  priceChange24h?: number;
  priceChangePercent24h?: number;
  high24h?: number;
  low24h?: number;
  lastUpdate: Date;
}
