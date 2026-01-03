import { LaunchType } from '../enums/launch-type.enum';
import { Recurrence } from '../enums/recurrence.enum';
export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  categoryId?: string;
  description: string;
  amount: number;
  date: Date;
  type: LaunchType;
  isPaid: boolean;
  recurrence: Recurrence;
  recurrenceId?: string;
  tags?: string[];
  notes?: string;
  attachmentUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
//# sourceMappingURL=transaction.types.d.ts.map
