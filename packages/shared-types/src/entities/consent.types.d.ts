import { ConsentType } from '../enums/consent-type.enum';
import { ConsentStatus } from '../enums/consent-status.enum';
export interface UserConsent {
  id: string;
  userId: string;
  type: ConsentType;
  status: ConsentStatus;
  purpose?: string;
  legalBasis?: string;
  ipAddress?: string;
  userAgent?: string;
  version: string;
  expiresAt?: Date;
  withdrawnAt?: Date;
  grantedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
export interface CreateConsentDto {
  type: ConsentType;
  status: ConsentStatus;
  purpose?: string;
  legalBasis?: string;
  version?: string;
  expiresAt?: Date;
}
export interface UpdateConsentDto {
  status?: ConsentStatus;
  withdrawnAt?: Date;
}
export interface ConsentSummary {
  userId: string;
  consents: {
    type: ConsentType;
    status: ConsentStatus;
    grantedAt?: Date;
    withdrawnAt?: Date;
  }[];
}
//# sourceMappingURL=consent.types.d.ts.map
