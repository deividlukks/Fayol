import twilio from 'twilio';
import { IWhatsAppProvider, IWhatsAppMessage } from '../../core/interfaces/whatsapp-provider.interface';
import { MessageType } from '../../core/enums/message-type.enum';
import { logger } from '../../utils/logger';
import { config } from '../../config/app.config';

/**
 * Provider Twilio para usuários PREMIUM
 * 
 * Características:
 * - API oficial do WhatsApp Business
 * - Pago por mensagem (~R$ 0,05-0,15/msg)
 * - Altamente confiável com SLA
 * - Suporta templates aprovados pelo WhatsApp
 * 
 * Vantagens:
 * - Sem risco de bloqueio
 * - Escalável para alto volume
 * - Recursos empresariais (templates, analytics)
 * - Suporte oficial Meta/Twilio
 */
export class TwilioProvider implements IWhatsAppProvider {
  private client: twilio.Twilio;
  private fromNumber: string;

  constructor(
    private readonly userId: string,
    private readonly phone: string
  ) {
    this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
    this.fromNumber = config.twilio.phoneNumber;

    logger.info(`[Twilio] Provider inicializado para usuário ${userId} (${phone})`);
  }

  /**
   * Inicializa conexão Twilio
   * Como Twilio é stateless, apenas valida credenciais
   */
  async initialize(): Promise<void> {
    try {
      logger.info('[Twilio] Validando credenciais...');

      // Valida credenciais fazendo uma chamada simples
      await this.client.api.accounts(config.twilio.accountSid).fetch();

      logger.info('[Twilio] ✅ Credenciais validadas com sucesso');
    } catch (error) {
      logger.error('[Twilio] ❌ Erro ao validar credenciais:', error);
      throw new Error('[Twilio] Credenciais inválidas. Verifique TWILIO_ACCOUNT_SID e TWILIO_AUTH_TOKEN');
    }
  }

  /**
   * Envia mensagem de texto
   */
  async sendTextMessage(to: string, message: string): Promise<void> {
    try {
      // Remove "whatsapp:" se já estiver presente
      const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

      const response = await this.client.messages.create({
        from: this.fromNumber,
        to: toNumber,
        body: message,
      });

      logger.info(`[Twilio] ✅ Mensagem enviada (SID: ${response.sid})`);
    } catch (error) {
      logger.error('[Twilio] ❌ Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  /**
   * Envia mensagem com mídia
   */
  async sendMediaMessage(
    to: string,
    mediaUrl: string,
    caption?: string,
    type: MessageType = MessageType.IMAGE
  ): Promise<void> {
    try {
      const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

      const response = await this.client.messages.create({
        from: this.fromNumber,
        to: toNumber,
        body: caption || '',
        mediaUrl: [mediaUrl],
      });

      logger.info(`[Twilio] ✅ Mídia enviada (SID: ${response.sid})`);
    } catch (error) {
      logger.error('[Twilio] ❌ Erro ao enviar mídia:', error);
      throw error;
    }
  }

  /**
   * Envia mensagem com botões
   * 
   * NOTA: Twilio não suporta botões nativos via API.
   * Alternativa: usar mensagens de texto formatadas ou templates aprovados
   */
  async sendButtonMessage(
    to: string,
    text: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<void> {
    logger.warn('[Twilio] ⚠️  Botões não suportados nativamente. Enviando como lista de texto.');

    // Formata como lista de opções
    const formattedMessage = `${text}\n\n${buttons
      .map((btn, index) => `${index + 1}. ${btn.title}`)
      .join('\n')}\n\nResponda com o número da opção desejada.`;

    await this.sendTextMessage(to, formattedMessage);
  }

  /**
   * Envia mensagem com lista de opções
   * 
   * NOTA: Twilio não suporta listas nativas via API.
   * Alternativa: usar templates aprovados ou mensagens de texto formatadas
   */
  async sendListMessage(
    to: string,
    text: string,
    buttonText: string,
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>
  ): Promise<void> {
    logger.warn('[Twilio] ⚠️  Listas não suportadas nativamente. Enviando como texto formatado.');

    // Formata como lista de texto
    let formattedMessage = `${text}\n\n`;

    sections.forEach((section) => {
      formattedMessage += `📋 ${section.title}\n`;
      section.rows.forEach((row, index) => {
        formattedMessage += `  ${index + 1}. ${row.title}`;
        if (row.description) {
          formattedMessage += ` - ${row.description}`;
        }
        formattedMessage += '\n';
      });
      formattedMessage += '\n';
    });

    formattedMessage += 'Responda com o número da opção desejada.';

    await this.sendTextMessage(to, formattedMessage);
  }

  /**
   * Envia template aprovado pelo WhatsApp
   * 
   * Templates devem ser pré-aprovados no Twilio Console
   * https://www.twilio.com/console/sms/whatsapp/templates
   */
  async sendTemplate(
    to: string,
    templateSid: string,
    contentVariables?: Record<string, string>
  ): Promise<void> {
    try {
      const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

      const response = await this.client.messages.create({
        from: this.fromNumber,
        to: toNumber,
        contentSid: templateSid,
        contentVariables: contentVariables ? JSON.stringify(contentVariables) : undefined,
      });

      logger.info(`[Twilio] ✅ Template enviado (SID: ${response.sid})`);
    } catch (error) {
      logger.error('[Twilio] ❌ Erro ao enviar template:', error);
      throw error;
    }
  }

  /**
   * Marca mensagem como lida
   * 
   * NOTA: Twilio não fornece API para marcar mensagens como lidas
   */
  async markAsRead(messageId: string): Promise<void> {
    logger.debug('[Twilio] ⚠️  markAsRead não suportado pela API Twilio');
  }

  /**
   * Verifica se número existe no WhatsApp
   * 
   * NOTA: Twilio não fornece endpoint direto para isso.
   * Podemos tentar enviar uma mensagem de teste, mas isso consome créditos.
   */
  async checkNumberExists(phone: string): Promise<boolean> {
    logger.warn('[Twilio] ⚠️  checkNumberExists não suportado diretamente. Retornando true.');
    return true; // Assume que existe para não consumir créditos
  }

  /**
   * Obtém status da conexão
   * 
   * Twilio é stateless, sempre retorna 'connected' se credenciais válidas
   */
  async getConnectionStatus(): Promise<'connected' | 'disconnected' | 'connecting'> {
    try {
      await this.client.api.accounts(config.twilio.accountSid).fetch();
      return 'connected';
    } catch (error) {
      return 'disconnected';
    }
  }

  /**
   * Desconecta
   * 
   * Twilio é stateless, não há necessidade de desconectar
   */
  async disconnect(): Promise<void> {
    logger.info('[Twilio] Desconectado (stateless, sem ação necessária)');
  }

  /**
   * Baixa mídia de uma mensagem
   */
  async downloadMedia(messageId: string): Promise<Buffer> {
    try {
      const message = await this.client.messages(messageId).fetch();

      if (!message.numMedia || parseInt(message.numMedia) === 0) {
        throw new Error('[Twilio] Mensagem não contém mídia');
      }

      const media = await this.client.messages(messageId).media(0).fetch();

      // Twilio fornece URI, precisamos fazer o download
      const response = await fetch(`https://api.twilio.com${media.uri}`, {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${config.twilio.accountSid}:${config.twilio.authToken}`
          ).toString('base64')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`[Twilio] Erro ao baixar mídia: ${response.statusText}`);
      }

      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      logger.error('[Twilio] ❌ Erro ao baixar mídia:', error);
      throw error;
    }
  }

  /**
   * Envia indicador de "digitando..."
   * 
   * NOTA: Twilio não suporta indicadores de presença
   */
  async sendTyping(to: string): Promise<void> {
    logger.debug('[Twilio] ⚠️  sendTyping não suportado pela API Twilio');
  }

  /**
   * Para o indicador de "digitando..."
   * 
   * NOTA: Twilio não suporta indicadores de presença
   */
  async stopTyping(to: string): Promise<void> {
    logger.debug('[Twilio] ⚠️  stopTyping não suportado pela API Twilio');
  }

  /**
   * Obtém informações de uma mensagem
   */
  async getMessageInfo(messageSid: string): Promise<any> {
    try {
      const message = await this.client.messages(messageSid).fetch();
      return {
        sid: message.sid,
        status: message.status,
        from: message.from,
        to: message.to,
        body: message.body,
        dateSent: message.dateSent,
        dateCreated: message.dateCreated,
        price: message.price,
        priceUnit: message.priceUnit,
      };
    } catch (error) {
      logger.error('[Twilio] ❌ Erro ao buscar informações da mensagem:', error);
      throw error;
    }
  }

  /**
   * Lista mensagens enviadas/recebidas
   */
  async listMessages(
    limit: number = 20,
    to?: string,
    from?: string
  ): Promise<any[]> {
    try {
      const messages = await this.client.messages.list({
        limit,
        to: to ? (to.startsWith('whatsapp:') ? to : `whatsapp:${to}`) : undefined,
        from: from || this.fromNumber,
      });

      return messages.map((msg) => ({
        sid: msg.sid,
        status: msg.status,
        from: msg.from,
        to: msg.to,
        body: msg.body,
        dateSent: msg.dateSent,
      }));
    } catch (error) {
      logger.error('[Twilio] ❌ Erro ao listar mensagens:', error);
      throw error;
    }
  }
}
