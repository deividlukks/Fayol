export interface Investment {
  id: string;
  userId: string;
  accountId: string;
  name: string;
  ticker?: string; // Código da bolsa (ex: PETR4)
  quantity: number;
  averagePrice: number;
  currentPrice?: number;
  totalValue?: number;
  type: string; // Ações, FIIs, CDB, etc.
  purchaseDate: Date;
  createdAt: Date;
  updatedAt: Date;
}
