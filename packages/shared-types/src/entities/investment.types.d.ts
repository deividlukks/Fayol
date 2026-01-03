export interface Investment {
  id: string;
  userId: string;
  accountId: string;
  name: string;
  ticker?: string;
  quantity: number;
  averagePrice: number;
  currentPrice?: number;
  totalValue?: number;
  type: string;
  purchaseDate: Date;
  createdAt: Date;
  updatedAt: Date;
}
//# sourceMappingURL=investment.types.d.ts.map
