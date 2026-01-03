/**
 * Implementação do Provider usando WhatsApp Business API (Meta)
 * Provider oficial e estável para produção
 * Requer conta WhatsApp Business e chave de API
 */

import axios, { AxiosInstance } from 'axios';
import {
  IWhatsAppProvider,
  WhatsAppMessage,
  SendMessageOptions,
} from './IWhatsAppProvider';

export class MetaAPIProvider implements IWhatsAppProvider {
  private apiUrl: string;
  private accessToken: string;
  private phoneNumberId: string;
  private webhookVerifyToken: string;
  private messageHandler?: (message: WhatsAppMessage) => Promise<void>;
  private httpClient: AxiosInstance;

  constructor() {
    this.accessToken = process.env.META_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.META_PHONE_NUMBER_ID || '';
    this.webhookVerifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || '';
    this.apiUrl = `https://graph.facebook.com/v18.0/${this.phoneNumberId}`;

    if (!this.accessToken || !this.phoneNumberId) {
      throw new Error(
        'META_ACCESS_TOKEN e META_PHONE_NUMBER_ID são obrigatórios no .env'
      );
    }

    this.httpClient = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async initialize(): Promise<void> {
    console.log('🚀 Inicializando MetaAPIProvider...');

    // Testa conexão com a API
    try {
      await this.getBotInfo();
      console.log('✅ MetaAPIProvider conectado com sucesso!');
      console.log('ℹ️  Use webhooks para receber mensagens');
      console.log(`ℹ️  Webhook URL: ${process.env.WEBHOOK_URL || 'não configurada'}`);
    } catch (error: any) {
      console.error('❌ Erro ao conectar Meta API:', error.message);
      throw new Error('Falha ao inicializar Meta API');
    }
  }

  async sendMessage(to: string, text: string): Promise<void> {
    // Remove sufixo @s.whatsapp.net se presente
    const cleanNumber = to.replace('@s.whatsapp.net', '');

    try {
      await this.httpClient.post('/messages', {
        messaging_product: 'whatsapp',
        to: cleanNumber,
        type: 'text',
        text: {
          body: text,
        },
      });
    } catch (error: any) {
      console.error('❌ Erro ao enviar mensagem:', error.response?.data || error.message);
      throw new Error('Falha ao enviar mensagem via Meta API');
    }
  }

  async sendMedia(options: SendMessageOptions): Promise<void> {
    const { to, mediaBuffer, mediaType, caption, fileName } = options;
    const cleanNumber = to.replace('@s.whatsapp.net', '');

    if (!mediaBuffer || !mediaType) {
      throw new Error('mediaBuffer e mediaType são obrigatórios');
    }

    try {
      // 1. Upload da mídia
      const formData = new FormData();
      formData.append('messaging_product', 'whatsapp');
      formData.append('file', new Blob([new Uint8Array(mediaBuffer)]), fileName || 'file');

      const uploadResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${this.phoneNumberId}/media`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      const mediaId = uploadResponse.data.id;

      // 2. Envia mensagem com o media_id
      const messagePayload: any = {
        messaging_product: 'whatsapp',
        to: cleanNumber,
        type: mediaType,
      };

      switch (mediaType) {
        case 'image':
          messagePayload.image = { id: mediaId, caption };
          break;
        case 'audio':
          messagePayload.audio = { id: mediaId };
          break;
        case 'video':
          messagePayload.video = { id: mediaId, caption };
          break;
        case 'document':
          messagePayload.document = { id: mediaId, filename: fileName, caption };
          break;
      }

      await this.httpClient.post('/messages', messagePayload);
    } catch (error: any) {
      console.error('❌ Erro ao enviar mídia:', error.response?.data || error.message);
      throw new Error('Falha ao enviar mídia via Meta API');
    }
  }

  onMessage(handler: (message: WhatsAppMessage) => Promise<void>): void {
    this.messageHandler = handler;
  }

  async getBotInfo(): Promise<{ phoneNumber: string; name: string }> {
    try {
      const response = await this.httpClient.get('/');
      const data = response.data;

      return {
        phoneNumber: data.display_phone_number || this.phoneNumberId,
        name: process.env.WHATSAPP_BOT_NAME || 'Fayol Bot',
      };
    } catch (error: any) {
      console.error('❌ Erro ao obter info do bot:', error.response?.data || error.message);
      throw new Error('Falha ao obter informações do bot');
    }
  }

  async isOnWhatsApp(phoneNumber: string): Promise<boolean> {
    // Meta API não tem endpoint direto para verificar isso
    // Retorna true por padrão (validação será feita no envio)
    return true;
  }

  async disconnect(): Promise<void> {
    console.log('👋 MetaAPIProvider: Desconectado');
    // Meta API usa webhooks, não há conexão persistente
  }

  /**
   * Processa webhook recebido da Meta
   * Deve ser chamado por um endpoint HTTP (ex: POST /webhooks/whatsapp)
   */
  async processWebhook(body: any): Promise<void> {
    if (!this.messageHandler) {
      console.warn('⚠️ Webhook recebido mas nenhum handler registrado');
      return;
    }

    try {
      // Valida que é uma atualização de mensagem
      if (body.object !== 'whatsapp_business_account') {
        return;
      }

      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field !== 'messages') continue;

          const value = change.value;
          if (!value.messages) continue;

          for (const message of value.messages) {
            // Ignora mensagens de status ou do próprio bot
            if (message.from === this.phoneNumberId) continue;

            const whatsappMessage = this.convertToWhatsAppMessage(message, value);
            await this.messageHandler(whatsappMessage);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao processar webhook:', error);
    }
  }

  /**
   * Converte mensagem da Meta API para o formato interno
   */
  private convertToWhatsAppMessage(message: any, value: any): WhatsAppMessage {
    const from = message.from + '@s.whatsapp.net';
    const isGroup = !!message.context?.group_id;

    let body = '';
    let hasMedia = false;
    let mediaType: WhatsAppMessage['mediaType'] = undefined;

    // Extrai corpo da mensagem baseado no tipo
    if (message.type === 'text') {
      body = message.text?.body || '';
    } else if (message.type === 'image') {
      body = message.image?.caption || '';
      hasMedia = true;
      mediaType = 'image';
    } else if (message.type === 'audio') {
      hasMedia = true;
      mediaType = 'audio';
    } else if (message.type === 'video') {
      body = message.video?.caption || '';
      hasMedia = true;
      mediaType = 'video';
    } else if (message.type === 'document') {
      body = message.document?.caption || '';
      hasMedia = true;
      mediaType = 'document';
    }

    return {
      from,
      body,
      isGroup,
      groupName: isGroup ? message.context?.group_name : undefined,
      timestamp: parseInt(message.timestamp),
      hasMedia,
      mediaType,
      // Nota: Meta API requer download separado de mídias
      // Isso seria implementado em downloadMedia() se necessário
      mediaBuffer: undefined,
      mediaFilename: message.document?.filename,
    };
  }

  /**
   * Verifica webhook da Meta (GET request)
   * Deve ser usado no endpoint de webhook
   */
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.webhookVerifyToken) {
      console.log('✅ Webhook verificado');
      return challenge;
    }
    console.error('❌ Falha na verificação do webhook');
    return null;
  }
}
