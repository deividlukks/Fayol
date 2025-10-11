import express, { Request, Response } from 'express';
import twilio from 'twilio';
import { config } from '../config/app.config';
import { logger } from '../utils/logger';
import { ProviderFactory } from '../providers/factory/provider.factory';
import { SessionManager } from '../middleware/session.middleware';
import { RateLimiter } from '../middleware/rate-limit.middleware';
import { MessageHandler } from '../handlers/message.handler';
import { IWhatsAppMessage } from '../core/interfaces/whatsapp-provider.interface';
import { MessageType } from '../core/enums/message-type.enum';

/**
 * Servidor Express para receber webhooks do Twilio
 * 
 * Endpoints:
 * - POST /webhook/whatsapp - Recebe mensagens do Twilio
 * - POST /webhook/status - Recebe status de mensagens
 * - GET /health - Health check
 * - GET /metrics - Métricas do bot
 */
export class WebhookServer {
  private app: express.Application;
  private messageHandler: MessageHandler;

  constructor() {
    this.app = express();
    this.messageHandler = new MessageHandler();
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Configura middleware do Express
   */
  private setupMiddleware(): void {
    // Parse URL-encoded bodies (Twilio envia neste formato)
    this.app.use(express.urlencoded({ extended: true }));
    
    // Parse JSON bodies
    this.app.use(express.json());

    // Log de requests
    this.app.use((req, res, next) => {
      logger.debug(`[WebhookServer] ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Configura rotas
   */
  private setupRoutes(): void {
    // Webhook principal do WhatsApp
    this.app.post('/webhook/whatsapp', async (req, res) => {
      await this.handleWhatsAppWebhook(req, res);
    });

    // Webhook de status (opcional)
    this.app.post('/webhook/status', async (req, res) => {
      await this.handleStatusWebhook(req, res);
    });

    // Health check
    this.app.get('/health', (req, res) => {
      this.handleHealthCheck(req, res);
    });

    // Métricas
    this.app.get('/metrics', (req, res) => {
      this.handleMetrics(req, res);
    });

    // 404 para outras rotas
    this.app.use((req, res) => {
      res.status(404).json({ error: 'Not found' });
    });
  }

  /**
   * Handler do webhook WhatsApp (Twilio)
   */
  private async handleWhatsAppWebhook(req: Request, res: Response): Promise<void> {
    try {
      // Valida assinatura Twilio (segurança)
      if (!this.validateTwilioSignature(req)) {
        logger.warn('[WebhookServer] ⚠️  Assinatura Twilio inválida');
        res.status(403).send('Forbidden');
        return;
      }

      // Extrai dados da mensagem
      const { From, To, Body, MediaUrl0, MessageSid } = req.body;

      logger.info(`[WebhookServer] Mensagem recebida de ${From}`);

      // Normaliza mensagem para formato padrão
      const message: IWhatsAppMessage = {
        id: MessageSid,
        from: From, // whatsapp:+5534999999999
        to: To,
        timestamp: new Date(),
        type: MediaUrl0 ? MessageType.IMAGE : MessageType.TEXT,
        body: Body || undefined,
        mediaUrl: MediaUrl0 || undefined,
      };

      // Extrai telefone (remove "whatsapp:" prefix)
      const phone = From.replace('whatsapp:', '');

      // Verifica rate limiting
      const rateLimitCheck = RateLimiter.checkLimit(phone);
      if (!rateLimitCheck.allowed) {
        // Responde com TwiML
        const twiml = new twilio.twiml.MessagingResponse();
        twiml.message(`⚠️ ${rateLimitCheck.reason}`);
        res.type('text/xml').send(twiml.toString());
        return;
      }

      // Busca sessão do usuário
      const session = SessionManager.getSession(phone);

      if (!session) {
        // Usuário não autenticado
        const twiml = new twilio.twiml.MessagingResponse();
        twiml.message(
          '🔐 Você precisa fazer login primeiro.\n\nEnvie: /start para começar.'
        );
        res.type('text/xml').send(twiml.toString());
        return;
      }

      // Obtém provider do usuário
      const provider = await ProviderFactory.getProvider(
        session.userId,
        phone,
        session.tier === 'premium' ? 'PREMIUM' : 'FREE'
      );

      // Processa mensagem de forma assíncrona
      // (Twilio precisa de resposta em 15s, então não esperamos)
      this.messageHandler.handle(message, provider).catch((error) => {
        logger.error('[WebhookServer] Erro ao processar mensagem:', error);
      });

      // Responde imediatamente ao Twilio (200 OK)
      res.status(200).send();
    } catch (error) {
      logger.error('[WebhookServer] Erro no webhook:', error);
      res.status(500).send('Internal Server Error');
    }
  }

  /**
   * Handler do webhook de status
   */
  private async handleStatusWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { MessageSid, MessageStatus, ErrorCode } = req.body;

      logger.info(
        `[WebhookServer] Status atualizado: ${MessageSid} = ${MessageStatus}`
      );

      if (ErrorCode) {
        logger.error(`[WebhookServer] Erro no envio: ${ErrorCode}`);
      }

      res.status(200).send();
    } catch (error) {
      logger.error('[WebhookServer] Erro no webhook de status:', error);
      res.status(500).send('Internal Server Error');
    }
  }

  /**
   * Valida assinatura Twilio
   */
  private validateTwilioSignature(req: Request): boolean {
    // Em desenvolvimento, pode pular validação
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    const signature = req.headers['x-twilio-signature'] as string;

    if (!signature) {
      return false;
    }

    // Reconstrói URL completa
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const url = `${protocol}://${host}${req.originalUrl}`;

    // Valida usando método do Twilio
    return twilio.validateRequest(
      config.twilio.authToken,
      signature,
      url,
      req.body
    );
  }

  /**
   * Health check endpoint
   */
  private handleHealthCheck(req: Request, res: Response): void {
    const uptime = process.uptime();
    const stats = ProviderFactory.getStatistics();

    res.json({
      status: 'healthy',
      uptime: Math.floor(uptime),
      timestamp: new Date().toISOString(),
      providers: {
        baileys: config.baileys.enabled ? 'enabled' : 'disabled',
        twilio: config.twilio.enabled ? 'enabled' : 'disabled',
      },
      activeProviders: stats,
    });
  }

  /**
   * Métricas endpoint
   */
  private handleMetrics(req: Request, res: Response): void {
    const providerStats = ProviderFactory.getStatistics();
    const sessionStats = SessionManager.getStatistics();

    res.json({
      providers: {
        total: providerStats.totalProviders,
        baileys: providerStats.byType.baileys,
        twilio: providerStats.byType.twilio,
      },
      sessions: {
        total: sessionStats.total,
        free: sessionStats.byTier.free,
        premium: sessionStats.byTier.premium,
      },
      uptime: Math.floor(process.uptime()),
      memory: {
        used: Math.floor(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.floor(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    });
  }

  /**
   * Inicia o servidor
   */
  start(): void {
    const { port, host } = config.server;

    this.app.listen(port, host, () => {
      logger.info(`[WebhookServer] 🚀 Servidor iniciado em http://${host}:${port}`);
      logger.info(`[WebhookServer] Webhook URL: http://${host}:${port}/webhook/whatsapp`);
      logger.info(`[WebhookServer] Health check: http://${host}:${port}/health`);
    });
  }

  /**
   * Obtém app Express (útil para testes)
   */
  getApp(): express.Application {
    return this.app;
  }
}
