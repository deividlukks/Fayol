import { AccountType } from '../enums/account-type.enum';
export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  creditLimit?: number;
  currency: string;
  color?: string;
  icon?: string;
  isArchived: boolean;
  bankConnectionId?: string;
  createdAt: Date;
  updatedAt: Date;
  totalInvested?: number;
  totalConsolidated?: number;
}
//# sourceMappingURL=account.types.d.ts.map
