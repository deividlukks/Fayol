import { AccountType } from '../enums/account-type.enum';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  creditLimit?: number; // Novo campo
  currency: string;
  color?: string;
  icon?: string;
  isArchived: boolean;
  bankConnectionId?: string;
  createdAt: Date;
  updatedAt: Date;

  // Campos calculados pelo backend (Opcionais)
  totalInvested?: number;
  totalConsolidated?: number;
}
