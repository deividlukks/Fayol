import { config, validateConfig } from './config/app.config';
import { logger } from './utils/logger';
import { BaileysProvider } from './providers/baileys/baileys.provider';
import { TwilioProvider } from './providers/twilio/twilio.provider';
import { ProviderFactory } from './providers/factory/provider.factory';
import { WebhookServer } from './services/webhook-server.service';
import { CronJobs } from './cron/daily-summary.cron';
import { SessionManager } from './middleware/session.middleware';

/**
 * Fayol WhatsApp Bot - Híbrido
 * 
 * Arquitetura:
 * - Baileys: Usuários FREE (gratuito)
 * - Twilio: Usuários PREMIUM (pago)
 * 
 * @version 1.0.0
 */
class FayolWhatsAppBot {
  private webhookServer: WebhookServer | null = null;

  /**
   * Inicializa o bot
   */
  async start(): Promise<void> {
    try {
      logger.info('🚀 Iniciando Fayol WhatsApp Bot...');

      // Valida configurações
      validateConfig();

      // Inicia servidor de webhooks (se Twilio habilitado)
      if (config.twilio.enabled) {
        logger.info('🌐 Iniciando servidor de webhooks Twilio...');
        this.webhookServer = new WebhookServer();
        this.webhookServer.start();
      }

      // Inicia cron jobs
      logger.info('⏰ Iniciando cron jobs...');
      CronJobs.start();

      // Se Baileys habilitado, pode iniciar providers pré-configurados aqui
      // Por enquanto, providers são criados sob demanda via Factory

      logger.info('✅ Fayol WhatsApp Bot iniciado com sucesso!');
      logger.info('');
      logger.info('📊 Status dos Providers:');
      logger.info(`   - Baileys: ${config.baileys.enabled ? '✅ Habilitado' : '❌ Desabilitado'}`);
      logger.info(`   - Twilio: ${config.twilio.enabled ? '✅ Habilitado' : '❌ Desabilitado'}`);
      logger.info('');

      if (config.baileys.enabled) {
        logger.info('ℹ️  Usuários FREE usarão Baileys (gratuito)');
        logger.info('   Para conectar, escaneie o QR Code que aparece no terminal');
      }

      if (config.twilio.enabled) {
        logger.info('ℹ️  Usuários PREMIUM usarão Twilio (pago)');
        logger.info(`   Webhook: ${config.twilio.webhookUrl}`);
      }

      logger.info('');
      logger.info('🎯 Bot pronto para receber mensagens!');

      // Graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('❌ Erro ao iniciar bot:', error);
      process.exit(1);
    }
  }

  /**
   * Configura encerramento gracioso
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`\n📴 Recebido sinal ${signal}. Encerrando graciosamente...`);

      try {
        // Para cron jobs
        CronJobs.stop();

        // Desconecta todos os providers
        await ProviderFactory.clearAll();

        // Limpa sessões
        logger.info('[Shutdown] Salvando sessões...');
        // SessionManager.saveToFile(); // Implementar se necessário

        logger.info('✅ Encerramento concluído');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Erro durante encerramento:', error);
        process.exit(1);
      }
    };

    // Captura sinais de encerramento
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // Captura exceções não tratadas
    process.on('uncaughtException', (error) => {
      logger.error('❌ Exceção não tratada:', error);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('❌ Promise rejeitada não tratada:', reason);
      shutdown('unhandledRejection');
    });
  }

  /**
   * Para o bot
   */
  async stop(): Promise<void> {
    logger.info('🛑 Parando Fayol WhatsApp Bot...');

    // Para cron jobs
    CronJobs.stop();

    // Desconecta providers
    await ProviderFactory.clearAll();

    logger.info('✅ Bot parado com sucesso');
  }
}

// ===============================================
// PONTO DE ENTRADA
// ===============================================

const bot = new FayolWhatsAppBot();

bot.start().catch((error) => {
  logger.error('❌ Erro fatal ao iniciar bot:', error);
  process.exit(1);
});

// Exporta para uso em testes
export default bot;
