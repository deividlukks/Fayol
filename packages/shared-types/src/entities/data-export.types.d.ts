import { DataExportStatus } from '../enums/data-export-status.enum';
export interface DataExportRequest {
  id: string;
  userId: string;
  status: DataExportStatus;
  format: string;
  downloadUrl?: string;
  expiresAt?: Date;
  requestedAt: Date;
  completedAt?: Date;
  failedReason?: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface CreateDataExportDto {
  format?: string;
}
export interface UserDataExport {
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
  };
  accounts: any[];
  transactions: any[];
  budgets: any[];
  investments: any[];
  categories: any[];
  goals: any[];
  consents: any[];
  exportedAt: Date;
}
//# sourceMappingURL=data-export.types.d.ts.map
