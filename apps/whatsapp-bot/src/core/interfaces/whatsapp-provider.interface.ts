/**
 * Interface abstrata para provedores de WhatsApp
 * 
 * Esta interface permite trocar entre Baileys (gratuito) e Twilio (premium)
 * sem alterar a lógica de negócio do bot.
 * 
 * Implementações:
 * - BaileysProvider: Para usuários gratuitos
 * - TwilioProvider: Para usuários premium
 */

import { MessageType } from '../enums/message-type.enum';

export interface IWhatsAppMessage {
  id: string;
  from: string; // Número do remetente no formato whatsapp:+5534999999999
  to: string; // Número do destinatário
  timestamp: Date;
  type: MessageType;
  body?: string; // Texto da mensagem
  mediaUrl?: string; // URL da mídia (se aplicável)
  caption?: string; // Legenda da mídia
  quotedMessage?: IWhatsAppMessage; // Mensagem citada (reply)
}

export interface IWhatsAppProvider {
  /**
   * Inicializa a conexão com o WhatsApp
   * 
   * Baileys: Gera QR Code para autenticação
   * Twilio: Valida credenciais da API
   */
  initialize(): Promise<void>;

  /**
   * Envia uma mensagem de texto simples
   * 
   * @param to - Número do destinatário (formato: whatsapp:+5534999999999)
   * @param message - Texto da mensagem
   */
  sendTextMessage(to: string, message: string): Promise<void>;

  /**
   * Envia uma mensagem com mídia (imagem, áudio, documento)
   * 
   * @param to - Número do destinatário
   * @param mediaUrl - URL pública da mídia ou caminho local
   * @param caption - Legenda opcional
   * @param type - Tipo de mídia
   */
  sendMediaMessage(
    to: string,
    mediaUrl: string,
    caption?: string,
    type?: MessageType
  ): Promise<void>;

  /**
   * Envia uma mensagem com botões interativos
   * 
   * @param to - Número do destinatário
   * @param text - Texto da mensagem
   * @param buttons - Array de botões
   */
  sendButtonMessage(
    to: string,
    text: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<void>;

  /**
   * Envia uma mensagem com lista de opções
   * 
   * @param to - Número do destinatário
   * @param text - Texto da mensagem
   * @param buttonText - Texto do botão que abre a lista
   * @param sections - Seções da lista
   */
  sendListMessage(
    to: string,
    text: string,
    buttonText: string,
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>
  ): Promise<void>;

  /**
   * Marca uma mensagem como lida
   * 
   * @param messageId - ID da mensagem
   */
  markAsRead(messageId: string): Promise<void>;

  /**
   * Verifica se um número existe no WhatsApp
   * 
   * @param phone - Número de telefone
   * @returns true se o número existe no WhatsApp
   */
  checkNumberExists(phone: string): Promise<boolean>;

  /**
   * Obtém o status atual da conexão
   * 
   * @returns Status da conexão
   */
  getConnectionStatus(): Promise<'connected' | 'disconnected' | 'connecting'>;

  /**
   * Desconecta o bot
   */
  disconnect(): Promise<void>;

  /**
   * Baixa mídia de uma mensagem
   * 
   * @param messageId - ID da mensagem
   * @returns Buffer com os dados da mídia
   */
  downloadMedia(messageId: string): Promise<Buffer>;

  /**
   * Envia indicador de "digitando..." (typing)
   * 
   * @param to - Número do destinatário
   */
  sendTyping(to: string): Promise<void>;

  /**
   * Para o indicador de "digitando..."
   * 
   * @param to - Número do destinatário
   */
  stopTyping(to: string): Promise<void>;
}
