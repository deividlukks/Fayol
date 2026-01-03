/**
 * Serviço principal de gerenciamento do WhatsApp Bot
 * Orquestra provider, handlers e lifecycle
 */

import { IWhatsAppProvider, WhatsAppMessage } from '../providers/IWhatsAppProvider';
import { BaileysProvider } from '../providers/BaileysProvider';
import { MetaAPIProvider } from '../providers/MetaAPIProvider';
import { SessionService } from './session.service';
import { RedisSessionService } from './redis-session.service';
import { ISessionService } from './ISessionService';
import { RateLimitMiddleware } from '../middlewares/rate-limit.middleware';

export class WhatsAppService {
  private provider: IWhatsAppProvider;
  private sessionService: ISessionService;
  private rateLimiter: RateLimitMiddleware;

  // Handlers serão importados dinamicamente para evitar circular dependency
  private commandHandler: any;
  private messageHandler: any;
  private mediaHandler: any;
  private groupHandler: any;

  constructor() {
    // Strategy Pattern: Seleciona provider baseado em ENV
    const providerType = process.env.WHATSAPP_PROVIDER || 'baileys';

    if (providerType === 'baileys') {
      console.log('📱 Usando BaileysProvider (QR Code)');
      this.provider = new BaileysProvider(
        process.env.WHATSAPP_SESSION_DIR || './auth_info_baileys'
      );
    } else if (providerType === 'meta') {
      console.log('📱 Usando MetaAPIProvider (API Oficial)');
      this.provider = new MetaAPIProvider();
    } else {
      throw new Error(`Provider não suportado: ${providerType}`);
    }

    // Strategy Pattern: Seleciona serviço de sessão baseado em ENV
    const useRedis = process.env.USE_REDIS_SESSIONS === 'true';

    if (useRedis) {
      console.log('📦 Usando RedisSessionService (produção)');
      this.sessionService = new RedisSessionService();
    } else {
      console.log('📦 Usando SessionService em memória (desenvolvimento)');
      this.sessionService = new SessionService();
    }

    this.rateLimiter = new RateLimitMiddleware();

    // Registra listener de mensagens
    this.provider.onMessage(this.handleMessage.bind(this));
  }

  async start(): Promise<void> {
    console.log('🚀 Iniciando WhatsApp Bot...');
    console.log(`📦 Provider: ${process.env.WHATSAPP_PROVIDER || 'baileys'}`);
    console.log(`🔗 Backend API: ${process.env.API_BASE_URL}`);

    // Conecta ao Redis se estiver usando RedisSessionService
    if (this.sessionService instanceof RedisSessionService) {
      await this.sessionService.connect();
      const isHealthy = await this.sessionService.healthCheck();
      if (!isHealthy) {
        throw new Error('Redis health check falhou');
      }
    }

    await this.provider.initialize();

    // Inicializa handlers (import dinâmico para evitar circular dependency)
    const { CommandHandler } = await import('../handlers/command.handler');
    const { MessageHandler } = await import('../handlers/message.handler');
    const { MediaHandler } = await import('../handlers/media.handler');
    const { GroupHandler } = await import('../handlers/group.handler');

    this.commandHandler = new CommandHandler(this.provider, this.sessionService);
    this.messageHandler = new MessageHandler(this.provider, this.sessionService);
    this.mediaHandler = new MediaHandler(this.provider, this.sessionService);
    this.groupHandler = new GroupHandler(this.provider, this.sessionService);

    console.log('✅ Bot pronto para uso!');
    console.log('💡 Envie uma mensagem para começar.\n');

    // Log de estatísticas a cada 5 minutos
    setInterval(async () => {
      const stats = await Promise.resolve(this.sessionService.getStats());
      console.log(
        `📊 Stats: ${stats.authenticated} autenticados, ${stats.onboarding} em onboarding`
      );
    }, 5 * 60 * 1000);
  }

  private async handleMessage(message: WhatsAppMessage): Promise<void> {
    try {
      // 1. Rate limiting
      if (this.rateLimiter.isRateLimited(message.from)) {
        const remainingTime = Math.ceil(this.rateLimiter.getRemainingTime(message.from) / 1000);
        await this.provider.sendMessage(
          message.from,
          `⏱️ Você está enviando mensagens muito rápido.\n\nAguarde ${remainingTime}s antes de tentar novamente.`
        );
        return;
      }

      // 2. Se for grupo e suporte desabilitado, ignora
      if (message.isGroup && process.env.ENABLE_GROUP_SUPPORT !== 'true') {
        return;
      }

      // 3. Se for grupo, delega ao GroupHandler
      if (message.isGroup) {
        await this.groupHandler.handle(message);
        return;
      }

      // 4. Se tiver mídia, delega ao MediaHandler
      if (message.hasMedia) {
        await this.mediaHandler.handle(message);
        return;
      }

      // 5. Se começar com /, delega ao CommandHandler
      if (message.body.startsWith('/')) {
        await this.commandHandler.handle(message);
        return;
      }

      // 6. Caso contrário, processa como mensagem normal
      await this.messageHandler.handle(message);
    } catch (error: any) {
      console.error('❌ Erro ao processar mensagem:', error);

      // Tenta enviar mensagem de erro ao usuário
      try {
        await this.provider.sendMessage(
          message.from,
          '❌ Ocorreu um erro ao processar sua mensagem.\n\nTente novamente em alguns instantes.'
        );
      } catch (sendError) {
        console.error('❌ Erro ao enviar mensagem de erro:', sendError);
      }
    }
  }

  async stop(): Promise<void> {
    console.log('\n🛑 Encerrando WhatsApp Bot...');

    // getStats pode ser sync ou async dependendo do tipo de SessionService
    const stats = await (this.sessionService instanceof RedisSessionService
      ? this.sessionService.getStats()
      : Promise.resolve(this.sessionService.getStats()));

    console.log(
      `📊 Estatísticas finais: ${stats.totalSessions} sessões, ${stats.authenticated} autenticados`
    );

    await this.provider.disconnect();

    // Desconecta do Redis se estiver usando RedisSessionService
    if (this.sessionService instanceof RedisSessionService) {
      await this.sessionService.disconnect();
    }

    console.log('👋 Bot encerrado com sucesso.');
  }

  /**
   * Método auxiliar para obter provider (útil para testes)
   */
  getProvider(): IWhatsAppProvider {
    return this.provider;
  }

  /**
   * Método auxiliar para obter session service (útil para testes)
   */
  getSessionService(): ISessionService {
    return this.sessionService;
  }
}
