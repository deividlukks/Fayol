import dotenv from 'dotenv';
import path from 'path';
import { AppConfig } from '../types/config.types';

// Carrega variáveis de ambiente
dotenv.config();

/**
 * Configuração centralizada do aplicativo
 * Todas as configurações são carregadas a partir de variáveis de ambiente
 */
export const config: AppConfig = {
  // API Backend
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  apiTimeout: parseInt(process.env.API_TIMEOUT || '30000', 10),

  // Baileys (Usuários Gratuitos)
  baileys: {
    enabled: process.env.BAILEYS_ENABLED === 'true',
    sessionsPath: process.env.BAILEYS_SESSIONS_PATH || path.join(__dirname, '../../sessions'),
    maxReconnectAttempts: parseInt(process.env.BAILEYS_MAX_RECONNECT_ATTEMPTS || '5', 10),
    qrCodeTimeout: parseInt(process.env.BAILEYS_QR_CODE_TIMEOUT || '60', 10),
  },

  // Twilio (Usuários Premium)
  twilio: {
    enabled: process.env.TWILIO_ENABLED === 'true',
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    webhookUrl: process.env.TWILIO_WEBHOOK_URL || '',
    statusCallbackUrl: process.env.TWILIO_STATUS_CALLBACK_URL,
  },

  // Servidor Express (para webhooks Twilio)
  server: {
    port: parseInt(process.env.SERVER_PORT || '3002', 10),
    host: process.env.SERVER_HOST || '0.0.0.0',
  },

  // OpenAI (para transcrição de voz)
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'whisper-1',
  },

  // Rate Limiting
  rateLimit: {
    maxMessagesPerMinute: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '10', 10),
    maxMessagesPerHour: parseInt(process.env.RATE_LIMIT_PER_HOUR || '100', 10),
  },

  // Logs
  logging: {
    level: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
    directory: process.env.LOG_DIRECTORY || path.join(__dirname, '../../logs'),
  },
};

/**
 * Valida se as configurações necessárias estão presentes
 */
export function validateConfig(): void {
  const errors: string[] = [];

  if (!config.apiUrl) {
    errors.push('API_URL não configurada');
  }

  // Valida Baileys se habilitado
  if (config.baileys.enabled) {
    if (!config.baileys.sessionsPath) {
      errors.push('BAILEYS_SESSIONS_PATH não configurada');
    }
  }

  // Valida Twilio se habilitado
  if (config.twilio.enabled) {
    if (!config.twilio.accountSid) {
      errors.push('TWILIO_ACCOUNT_SID não configurada');
    }
    if (!config.twilio.authToken) {
      errors.push('TWILIO_AUTH_TOKEN não configurada');
    }
    if (!config.twilio.phoneNumber) {
      errors.push('TWILIO_PHONE_NUMBER não configurada');
    }
    if (!config.twilio.webhookUrl) {
      errors.push('TWILIO_WEBHOOK_URL não configurada');
    }
  }

  // Pelo menos um provider deve estar habilitado
  if (!config.baileys.enabled && !config.twilio.enabled) {
    errors.push('Pelo menos um provider (Baileys ou Twilio) deve estar habilitado');
  }

  // Valida OpenAI se usar transcrição de voz
  if (!config.openai.apiKey) {
    console.warn('⚠️  OPENAI_API_KEY não configurada. Transcrição de voz não estará disponível.');
  }

  if (errors.length > 0) {
    throw new Error(`Erros de configuração:\n${errors.join('\n')}`);
  }

  console.log('✅ Configurações validadas com sucesso');
  console.log(`   - Baileys: ${config.baileys.enabled ? '✅ Habilitado' : '❌ Desabilitado'}`);
  console.log(`   - Twilio: ${config.twilio.enabled ? '✅ Habilitado' : '❌ Desabilitado'}`);
}
