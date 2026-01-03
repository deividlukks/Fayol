export interface Budget {
  id: string;
  userId: string;
  categoryId?: string;
  name: string;
  amount: number;
  spent: number;
  startDate: Date;
  endDate: Date;
  notifyThreshold?: number;
  createdAt: Date;
  updatedAt: Date;
}
//# sourceMappingURL=budget.types.d.ts.map
