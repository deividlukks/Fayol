export interface TwoFactorSetupResponse {
  qrCodeUrl: string;
  secret: string;
  backupCodes: string[];
}

export interface TwoFactorLoginResponse {
  requiresTwoFactor: true;
  tempToken: string;
  message: string;
}

export interface BackupCodesResponse {
  backupCodes: string[];
  message: string;
}

export interface TwoFactorStatusResponse {
  enabled: boolean;
  backupCodesRemaining: number;
}
