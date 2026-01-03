export interface Budget {
  id: string;
  userId: string;
  categoryId?: string; // Se null, é um orçamento global
  name: string;
  amount: number;
  spent: number; // Valor calculado
  startDate: Date;
  endDate: Date;
  notifyThreshold?: number; // % para notificar (ex: 80%)
  createdAt: Date;
  updatedAt: Date;
}
