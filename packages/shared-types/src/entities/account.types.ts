import { AccountType } from '../enums/account-type.enum';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color?: string;
  icon?: string;
  isArchived: boolean;
  bankConnectionId?: string; // Para Open Banking
  createdAt: Date;
  updatedAt: Date;
}