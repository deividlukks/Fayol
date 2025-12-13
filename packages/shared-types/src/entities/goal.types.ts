export interface Goal {
  id: string;
  userId: string;
  title: string;
  currentAmount: number;
  targetAmount: number;
  deadline?: Date;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}
