/**
 * Tipos de usuários
 */
export enum UserTier {
  FREE = 'free', // Usa Baileys
  PREMIUM = 'premium', // Usa Twilio
}

/**
 * Informações do usuário armazenadas na sessão
 */
export interface UserSession {
  userId: string;
  phone: string;
  name: string;
  tier: UserTier;
  accessToken: string; // JWT da API
  providerType: 'baileys' | 'twilio';
  createdAt: Date;
  lastActivity: Date;
}

/**
 * Dados da sessão Baileys
 */
export interface BaileysSessionData {
  userId: string;
  phone: string;
  sessionPath: string;
  qrCodeAttempts: number;
  isConnected: boolean;
  lastConnection: Date | null;
}

/**
 * Configurações do usuário
 */
export interface UserSettings {
  notificationsEnabled: boolean;
  dailySummaryTime?: string; // Formato HH:MM
  language: 'pt-BR' | 'en-US';
  timezone: string;
}
