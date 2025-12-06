export interface AssetQuote {
  ticker: string;
  price: number;
  changePercent: number;
  updatedAt: Date;
}

export interface IMarketDataProvider {
  getQuote(ticker: string): Promise<AssetQuote>;
  searchAssets(query: string): Promise<{ ticker: string; name: string }[]>;
}
