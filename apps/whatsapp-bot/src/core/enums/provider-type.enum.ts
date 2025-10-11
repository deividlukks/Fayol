/**
 * Tipos de provedores WhatsApp disponíveis
 * - BAILEYS: Usuários gratuitos (API não oficial)
 * - TWILIO: Usuários premium (API oficial do WhatsApp Business)
 */
export enum ProviderType {
  BAILEYS = 'baileys',
  TWILIO = 'twilio',
}
