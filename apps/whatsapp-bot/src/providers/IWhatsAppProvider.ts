/**
 * Interface abstrata para providers de WhatsApp
 * Permite trocar entre Baileys e Meta API sem alterar lógica de negócio
 *
 * Pattern: Strategy
 */

export interface WhatsAppMessage {
  from: string; // Número do remetente (formato: 5511999999999@s.whatsapp.net)
  body: string; // Texto da mensagem
  isGroup: boolean; // Se veio de um grupo
  groupName?: string; // Nome do grupo (se for grupo)
  timestamp: number; // Unix timestamp
  hasMedia: boolean; // Se contém mídia (imagem, áudio, etc)
  mediaType?: 'image' | 'audio' | 'video' | 'document';
  mediaBuffer?: Buffer; // Buffer da mídia baixada
  mediaFilename?: string; // Nome do arquivo (para documentos)
}

export interface SendMessageOptions {
  to: string; // Número de destino
  text?: string; // Texto da mensagem
  mediaBuffer?: Buffer; // Buffer da mídia
  mediaType?: 'image' | 'audio' | 'video' | 'document';
  caption?: string; // Legenda para mídia
  fileName?: string; // Nome do arquivo (para documentos)
}

/**
 * Provider abstrato de WhatsApp
 * Implementações: BaileysProvider, MetaAPIProvider (futuro)
 */
export interface IWhatsAppProvider {
  /**
   * Inicializa conexão e autentica
   * - Baileys: Exibe QR Code e persiste sessão
   * - Meta API: Valida token de acesso
   */
  initialize(): Promise<void>;

  /**
   * Envia mensagem de texto
   */
  sendMessage(to: string, text: string): Promise<void>;

  /**
   * Envia mídia (imagem, áudio, vídeo, documento)
   */
  sendMedia(options: SendMessageOptions): Promise<void>;

  /**
   * Registra handler para mensagens recebidas
   * Callback será executado para cada mensagem nova
   */
  onMessage(handler: (message: WhatsAppMessage) => Promise<void>): void;

  /**
   * Obtém informações sobre o bot
   */
  getBotInfo(): Promise<{ phoneNumber: string; name: string }>;

  /**
   * Verifica se um número está no WhatsApp
   */
  isOnWhatsApp(phoneNumber: string): Promise<boolean>;

  /**
   * Desconecta gracefully
   */
  disconnect(): Promise<void>;
}
