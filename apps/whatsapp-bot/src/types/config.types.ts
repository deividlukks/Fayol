/**
 * Configurações do Bot WhatsApp
 */
export interface AppConfig {
  // API Backend
  apiUrl: string;
  apiTimeout: number;

  // Baileys (Usuários Gratuitos)
  baileys: {
    enabled: boolean;
    sessionsPath: string;
    maxReconnectAttempts: number;
    qrCodeTimeout: number; // segundos
  };

  // Twilio (Usuários Premium)
  twilio: {
    enabled: boolean;
    accountSid: string;
    authToken: string;
    phoneNumber: string; // Formato: whatsapp:+14155238886
    webhookUrl: string;
    statusCallbackUrl?: string;
  };

  // Servidor Express (para webhooks Twilio)
  server: {
    port: number;
    host: string;
  };

  // OpenAI (para transcrição de voz)
  openai: {
    apiKey: string;
    model: string; // whisper-1
  };

  // Rate Limiting
  rateLimit: {
    maxMessagesPerMinute: number;
    maxMessagesPerHour: number;
  };

  // Logs
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    directory: string;
  };

  // Redis (opcional)
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
}
