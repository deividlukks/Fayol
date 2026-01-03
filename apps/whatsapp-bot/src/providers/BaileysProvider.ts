/**
 * Implementação do Provider usando Baileys
 * Gerencia conexão, autenticação, envio e recebimento de mensagens
 */

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  downloadMediaMessage,
  WAMessage,
  proto,
  AnyMessageContent,
  WASocket,
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import * as fs from 'fs';
import * as path from 'path';
import {
  IWhatsAppProvider,
  WhatsAppMessage,
  SendMessageOptions,
} from './IWhatsAppProvider';

export class BaileysProvider implements IWhatsAppProvider {
  private sock: WASocket | null = null;
  private messageHandler?: (message: WhatsAppMessage) => Promise<void>;
  private sessionDir: string;

  constructor(sessionDir: string = './auth_info_baileys') {
    this.sessionDir = sessionDir;

    // Garante que o diretório de sessão existe
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
  }

  async initialize(): Promise<void> {
    const { state, saveCreds } = await useMultiFileAuthState(this.sessionDir);

    this.sock = makeWASocket({
      auth: state,
      printQRInTerminal: true, // Renderiza QR no terminal
      browser: ['Fayol Bot', 'Chrome', '120.0.0'],
      logger: require('pino')({ level: process.env.WHATSAPP_LOG_LEVEL || 'info' }),
      defaultQueryTimeoutMs: undefined, // Remove timeout para evitar erros
    });

    // Salva credenciais quando atualizadas
    this.sock.ev.on('creds.update', saveCreds);

    // Handler de conexão
    this.sock.ev.on('connection.update', async (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('\n📱 Escaneie o QR Code abaixo com seu WhatsApp:\n');
        qrcode.generate(qr, { small: true });
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(
          `⚠️ Conexão fechada (código: ${statusCode}). Reconectando: ${shouldReconnect}`
        );

        if (shouldReconnect) {
          // Aguarda um pouco antes de reconectar
          await new Promise(resolve => setTimeout(resolve, 3000));
          await this.initialize();
        } else {
          console.log('🚪 Deslogado. Execute novamente para escanear QR Code.');
        }
      } else if (connection === 'open') {
        console.log('✅ WhatsApp Bot conectado com sucesso!');
      }
    });

    // Handler de mensagens
    this.sock.ev.on('messages.upsert', async ({ messages }: { messages: WAMessage[] }) => {
      for (const msg of messages) {
        // Ignora mensagens do próprio bot
        if (msg.key.fromMe) continue;

        // Ignora mensagens muito antigas (mais de 1 minuto)
        const messageAge = Date.now() - (msg.messageTimestamp as number) * 1000;
        if (messageAge > 60000) continue;

        await this.processMessage(msg);
      }
    });
  }

  private async processMessage(msg: WAMessage): Promise<void> {
    if (!this.messageHandler) return;

    const from = msg.key.remoteJid!;
    const isGroup = from.endsWith('@g.us');

    // Extrai texto da mensagem (suporta vários tipos)
    const body =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption ||
      msg.message?.documentMessage?.caption ||
      '';

    // Detecta mídia
    const hasMedia = !!(
      msg.message?.imageMessage ||
      msg.message?.audioMessage ||
      msg.message?.videoMessage ||
      msg.message?.documentMessage
    );

    let mediaType: 'image' | 'audio' | 'video' | 'document' | undefined;
    let mediaBuffer: Buffer | undefined;
    let mediaFilename: string | undefined;

    if (hasMedia) {
      try {
        if (msg.message?.imageMessage) {
          mediaType = 'image';
          mediaBuffer = await downloadMediaMessage(
            msg,
            'buffer',
            {},
            {
              logger: require('pino')({ level: 'silent' }),
              reuploadRequest: this.sock!.updateMediaMessage,
            }
          ) as Buffer;
        } else if (msg.message?.audioMessage) {
          mediaType = 'audio';
          mediaBuffer = await downloadMediaMessage(
            msg,
            'buffer',
            {},
            {
              logger: require('pino')({ level: 'silent' }),
              reuploadRequest: this.sock!.updateMediaMessage,
            }
          ) as Buffer;
        } else if (msg.message?.videoMessage) {
          mediaType = 'video';
          mediaBuffer = await downloadMediaMessage(
            msg,
            'buffer',
            {},
            {
              logger: require('pino')({ level: 'silent' }),
              reuploadRequest: this.sock!.updateMediaMessage,
            }
          ) as Buffer;
        } else if (msg.message?.documentMessage) {
          mediaType = 'document';
          mediaBuffer = await downloadMediaMessage(
            msg,
            'buffer',
            {},
            {
              logger: require('pino')({ level: 'silent' }),
              reuploadRequest: this.sock!.updateMediaMessage,
            }
          ) as Buffer;
          mediaFilename = msg.message.documentMessage.fileName || undefined;
        }
      } catch (error) {
        console.error('❌ Erro ao baixar mídia:', error);
      }
    }

    const whatsappMessage: WhatsAppMessage = {
      from,
      body,
      isGroup,
      groupName: isGroup ? await this.getGroupName(from) : undefined,
      timestamp: msg.messageTimestamp as number,
      hasMedia,
      mediaType,
      mediaBuffer,
      mediaFilename,
    };

    try {
      await this.messageHandler(whatsappMessage);
    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
    }
  }

  private async getGroupName(groupJid: string): Promise<string> {
    try {
      if (!this.sock) return 'Grupo';
      const metadata = await this.sock.groupMetadata(groupJid);
      return metadata.subject;
    } catch (error) {
      return 'Grupo';
    }
  }

  async sendMessage(to: string, text: string): Promise<void> {
    if (!this.sock) {
      throw new Error('Socket não inicializado. Chame initialize() primeiro.');
    }

    await this.sock.sendMessage(to, { text });
  }

  async sendMedia(options: SendMessageOptions): Promise<void> {
    if (!this.sock) {
      throw new Error('Socket não inicializado. Chame initialize() primeiro.');
    }

    const { to, mediaBuffer, mediaType, caption, fileName } = options;

    if (!mediaBuffer || !mediaType) {
      throw new Error('mediaBuffer e mediaType são obrigatórios');
    }

    let messageContent: AnyMessageContent;

    switch (mediaType) {
      case 'image':
        messageContent = {
          image: mediaBuffer,
          caption: caption,
        };
        break;

      case 'audio':
        messageContent = {
          audio: mediaBuffer,
          mimetype: 'audio/ogg; codecs=opus',
          ptt: true, // Push-to-talk (áudio de voz)
        };
        break;

      case 'video':
        messageContent = {
          video: mediaBuffer,
          caption: caption,
        };
        break;

      case 'document':
        messageContent = {
          document: mediaBuffer,
          fileName: fileName || 'documento.pdf',
          caption: caption,
          mimetype: 'application/pdf',
        };
        break;

      default:
        throw new Error(`Tipo de mídia não suportado: ${mediaType}`);
    }

    await this.sock.sendMessage(to, messageContent);
  }

  onMessage(handler: (message: WhatsAppMessage) => Promise<void>): void {
    this.messageHandler = handler;
  }

  async getBotInfo(): Promise<{ phoneNumber: string; name: string }> {
    if (!this.sock || !this.sock.user) {
      throw new Error('Bot não autenticado. Escaneie o QR Code primeiro.');
    }

    const me = this.sock.user;
    return {
      phoneNumber: me.id.split(':')[0],
      name: me.name || process.env.WHATSAPP_BOT_NAME || 'Fayol Bot',
    };
  }

  async isOnWhatsApp(phoneNumber: string): Promise<boolean> {
    if (!this.sock) {
      throw new Error('Socket não inicializado.');
    }

    try {
      const results = await this.sock.onWhatsApp(phoneNumber);
      if (results && results.length > 0 && results[0]) {
        return Boolean(results[0].exists);
      }
      return false;
    } catch (error) {
      console.error('Erro ao verificar número:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.sock) {
      await this.sock.logout();
      this.sock = null;
    }
  }
}
