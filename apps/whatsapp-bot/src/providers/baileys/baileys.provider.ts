import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  proto,
  downloadMediaMessage,
  makeCacheableSignalKeyStore,
  WAMessage,
  isJidUser,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { IWhatsAppProvider, IWhatsAppMessage } from '../../core/interfaces/whatsapp-provider.interface';
import { MessageType } from '../../core/enums/message-type.enum';
import { logger } from '../../utils/logger';

/**
 * Provider Baileys para usuários GRATUITOS
 * 
 * Características:
 * - API não oficial do WhatsApp
 * - Gratuito e sem custos operacionais
 * - Requer QR Code para autenticação
 * - Ideal para fase MVP e usuários free tier
 * 
 * Limitações:
 * - Risco de bloqueio pelo WhatsApp
 * - Não suporta múltiplos dispositivos simultâneos
 * - Menos estável que Twilio para alto volume
 */
export class BaileysProvider implements IWhatsAppProvider {
  private sock: WASocket | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private sessionPath: string;

  constructor(
    private readonly userId: string,
    private readonly phone: string,
    basePath: string = './sessions'
  ) {
    this.sessionPath = path.join(basePath, `session_${phone.replace(/\D/g, '')}`);
    this.ensureSessionDirectory();
  }

  /**
   * Garante que o diretório de sessão existe
   */
  private ensureSessionDirectory(): void {
    if (!fs.existsSync(this.sessionPath)) {
      fs.mkdirSync(this.sessionPath, { recursive: true });
      logger.info(`[Baileys] Diretório de sessão criado: ${this.sessionPath}`);
    }
  }

  /**
   * Inicializa conexão Baileys
   */
  async initialize(): Promise<void> {
    try {
      logger.info(`[Baileys] Inicializando para usuário ${this.userId} (${this.phone})...`);

      const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);

      this.sock = makeWASocket({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        defaultQueryTimeoutMs: 60000,
        markOnlineOnConnect: true,
      });

      // Salvar credenciais ao atualizar
      this.sock.ev.on('creds.update', saveCreds);

      // Handler de conexão
      this.sock.ev.on('connection.update', async (update) => {
        await this.handleConnectionUpdate(update);
      });

      // Handler de mensagens
      this.sock.ev.on('messages.upsert', async ({ messages }) => {
        await this.handleIncomingMessages(messages);
      });

      logger.info('[Baileys] Conexão inicializada com sucesso');
    } catch (error) {
      logger.error('[Baileys] Erro ao inicializar:', error);
      throw error;
    }
  }

  /**
   * Gerencia atualizações de conexão
   */
  private async handleConnectionUpdate(update: any): Promise<void> {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      logger.info('[Baileys] 📱 QR Code gerado. Escaneie para conectar.');
      // QR Code é exibido automaticamente no terminal via printQRInTerminal
    }

    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

      logger.warn(`[Baileys] Conexão fechada. Reconectar: ${shouldReconnect}`);

      if (shouldReconnect && this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
        this.reconnectAttempts++;
        logger.info(
          `[Baileys] Tentativa de reconexão ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS}`
        );

        await new Promise((resolve) => setTimeout(resolve, 5000)); // Aguarda 5s
        await this.initialize();
      } else if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
        logger.error('[Baileys] ❌ Máximo de tentativas de reconexão atingido');
        throw new Error('Falha ao reconectar após múltiplas tentativas');
      } else {
        logger.info('[Baileys] Usuário deslogado. Necessário novo QR Code.');
      }
    }

    if (connection === 'open') {
      this.reconnectAttempts = 0;
      logger.info('[Baileys] ✅ Conectado com sucesso!');
    }
  }

  /**
   * Processa mensagens recebidas
   */
  private async handleIncomingMessages(messages: WAMessage[]): Promise<void> {
    for (const msg of messages) {
      // Ignora mensagens próprias e status
      if (!msg.message || msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') {
        continue;
      }

      try {
        const normalizedMessage = await this.normalizeMessage(msg);
        
        // Aqui você pode chamar o handler de mensagens
        // Por exemplo: await this.messageHandler.handle(normalizedMessage, this);
        logger.debug('[Baileys] Mensagem recebida:', {
          from: normalizedMessage.from,
          type: normalizedMessage.type,
          body: normalizedMessage.body?.substring(0, 50),
        });
      } catch (error) {
        logger.error('[Baileys] Erro ao processar mensagem:', error);
      }
    }
  }

  /**
   * Normaliza mensagem Baileys para formato padrão
   */
  private async normalizeMessage(msg: WAMessage): Promise<IWhatsAppMessage> {
    const messageContent = msg.message!;
    const messageType = Object.keys(messageContent)[0] as keyof typeof messageContent;

    return {
      id: msg.key.id!,
      from: msg.key.remoteJid!,
      to: this.phone,
      timestamp: new Date((msg.messageTimestamp as number) * 1000),
      type: this.mapMessageType(messageType),
      body:
        messageContent.conversation ||
        messageContent.extendedTextMessage?.text ||
        messageContent.imageMessage?.caption ||
        messageContent.videoMessage?.caption ||
        undefined,
      mediaUrl: undefined, // Será processado sob demanda
      caption:
        messageContent.imageMessage?.caption ||
        messageContent.videoMessage?.caption ||
        undefined,
      quotedMessage: undefined, // Pode ser implementado depois
    };
  }

  /**
   * Mapeia tipo de mensagem Baileys para enum padrão
   */
  private mapMessageType(type: string): MessageType {
    const typeMap: Record<string, MessageType> = {
      conversation: MessageType.TEXT,
      extendedTextMessage: MessageType.TEXT,
      imageMessage: MessageType.IMAGE,
      audioMessage: MessageType.AUDIO,
      videoMessage: MessageType.VIDEO,
      documentMessage: MessageType.DOCUMENT,
      stickerMessage: MessageType.STICKER,
      locationMessage: MessageType.LOCATION,
      contactMessage: MessageType.CONTACT,
    };

    return typeMap[type] || MessageType.TEXT;
  }

  /**
   * Envia mensagem de texto
   */
  async sendTextMessage(to: string, message: string): Promise<void> {
    if (!this.sock) {
      throw new Error('[Baileys] Socket não inicializado');
    }

    try {
      // Remove "whatsapp:" do número se presente
      const jid = to.replace('whatsapp:', '') + '@s.whatsapp.net';

      await this.sock.sendMessage(jid, { text: message });
      logger.info(`[Baileys] ✅ Mensagem enviada para ${to}`);
    } catch (error) {
      logger.error('[Baileys] ❌ Erro ao enviar mensagem:', error);
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
    if (!this.sock) {
      throw new Error('[Baileys] Socket não inicializado');
    }

    try {
      const jid = to.replace('whatsapp:', '') + '@s.whatsapp.net';
      const mediaMessage: any = { caption };

      switch (type) {
        case MessageType.IMAGE:
          mediaMessage.image = { url: mediaUrl };
          break;
        case MessageType.AUDIO:
          mediaMessage.audio = { url: mediaUrl };
          mediaMessage.mimetype = 'audio/ogg; codecs=opus';
          mediaMessage.ptt = true; // Push-to-talk (áudio de voz)
          break;
        case MessageType.VIDEO:
          mediaMessage.video = { url: mediaUrl };
          break;
        case MessageType.DOCUMENT:
          mediaMessage.document = { url: mediaUrl };
          break;
        default:
          throw new Error(`[Baileys] Tipo de mídia não suportado: ${type}`);
      }

      await this.sock.sendMessage(jid, mediaMessage);
      logger.info(`[Baileys] ✅ Mídia enviada para ${to}`);
    } catch (error) {
      logger.error('[Baileys] ❌ Erro ao enviar mídia:', error);
      throw error;
    }
  }

  /**
   * Envia mensagem com botões
   */
  async sendButtonMessage(
    to: string,
    text: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<void> {
    if (!this.sock) {
      throw new Error('[Baileys] Socket não inicializado');
    }

    try {
      const jid = to.replace('whatsapp:', '') + '@s.whatsapp.net';

      const buttonMessage = {
        text,
        footer: 'Fayol - Seu Assistente Financeiro',
        buttons: buttons.map((btn) => ({
          buttonId: btn.id,
          buttonText: { displayText: btn.title },
          type: 1,
        })),
        headerType: 1,
      };

      await this.sock.sendMessage(jid, buttonMessage);
      logger.info(`[Baileys] ✅ Botões enviados para ${to}`);
    } catch (error) {
      logger.error('[Baileys] ❌ Erro ao enviar botões:', error);
      throw error;
    }
  }

  /**
   * Envia mensagem com lista de opções
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
    if (!this.sock) {
      throw new Error('[Baileys] Socket não inicializado');
    }

    try {
      const jid = to.replace('whatsapp:', '') + '@s.whatsapp.net';

      const listMessage = {
        text,
        footer: 'Fayol - Seu Assistente Financeiro',
        title: 'Menu',
        buttonText,
        sections: sections.map((section) => ({
          title: section.title,
          rows: section.rows.map((row) => ({
            rowId: row.id,
            title: row.title,
            description: row.description || '',
          })),
        })),
      };

      await this.sock.sendMessage(jid, listMessage);
      logger.info(`[Baileys] ✅ Lista enviada para ${to}`);
    } catch (error) {
      logger.error('[Baileys] ❌ Erro ao enviar lista:', error);
      throw error;
    }
  }

  /**
   * Marca mensagem como lida
   */
  async markAsRead(messageId: string): Promise<void> {
    // Baileys marca automaticamente como lida
    logger.debug(`[Baileys] Mensagem ${messageId} marcada como lida`);
  }

  /**
   * Verifica se número existe no WhatsApp
   */
  async checkNumberExists(phone: string): Promise<boolean> {
    if (!this.sock) {
      throw new Error('[Baileys] Socket não inicializado');
    }

    try {
      const jid = phone.replace('whatsapp:', '').replace(/\D/g, '') + '@s.whatsapp.net';
      const results = await this.sock.onWhatsApp(jid);
      const result = results && results.length > 0 ? results[0] : null;
      return result?.exists || false;
    } catch (error) {
      logger.error('[Baileys] ❌ Erro ao verificar número:', error);
      return false;
    }
  }

  /**
   * Obtém status da conexão
   */
  async getConnectionStatus(): Promise<'connected' | 'disconnected' | 'connecting'> {
    if (!this.sock) return 'disconnected';
    return this.sock ? 'connected' : 'disconnected';
  }

  /**
   * Desconecta
   */
  async disconnect(): Promise<void> {
    if (this.sock) {
      await this.sock.logout();
      this.sock = null;
      logger.info('[Baileys] Desconectado');
    }
  }

  /**
   * Baixa mídia de uma mensagem
   */
  async downloadMedia(messageId: string): Promise<Buffer> {
    // Implementação futura: buscar mensagem por ID e baixar mídia
    throw new Error('[Baileys] Download de mídia ainda não implementado');
  }

  /**
   * Envia indicador de "digitando..."
   */
  async sendTyping(to: string): Promise<void> {
    if (!this.sock) {
      throw new Error('[Baileys] Socket não inicializado');
    }

    try {
      const jid = to.replace('whatsapp:', '') + '@s.whatsapp.net';
      await this.sock.sendPresenceUpdate('composing', jid);
    } catch (error) {
      logger.error('[Baileys] ❌ Erro ao enviar typing:', error);
    }
  }

  /**
   * Para o indicador de "digitando..."
   */
  async stopTyping(to: string): Promise<void> {
    if (!this.sock) {
      throw new Error('[Baileys] Socket não inicializado');
    }

    try {
      const jid = to.replace('whatsapp:', '') + '@s.whatsapp.net';
      await this.sock.sendPresenceUpdate('paused', jid);
    } catch (error) {
      logger.error('[Baileys] ❌ Erro ao parar typing:', error);
    }
  }

  /**
   * Obtém socket (para uso interno)
   */
  getSocket(): WASocket | null {
    return this.sock;
  }
}
