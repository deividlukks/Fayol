import cron from 'node-cron';
import { logger } from '../utils/logger';
import { SessionManager } from '../middleware/session.middleware';
import { ProviderFactory } from '../providers/factory/provider.factory';
import { ApiService } from '../services/api.service';

/**
 * Cron Jobs para automação
 * 
 * Jobs programados:
 * - Resumo diário (6h e 22h)
 * - Limpeza de sessões expiradas (diário às 3h)
 * - Limpeza de rate limiters (a cada hora)
 */
export class CronJobs {
  /**
   * Inicia todos os cron jobs
   */
  static start(): void {
    logger.info('[CronJobs] Iniciando cron jobs...');

    // Resumo diário da manhã (6h)
    cron.schedule('0 6 * * *', async () => {
      await this.sendDailySummary('morning');
    });

    // Resumo diário da noite (22h)
    cron.schedule('0 22 * * *', async () => {
      await this.sendDailySummary('evening');
    });

    // Limpeza de sessões expiradas (3h da manhã)
    cron.schedule('0 3 * * *', () => {
      this.cleanExpiredSessions();
    });

    // Limpeza de rate limiters (a cada hora)
    cron.schedule('0 * * * *', () => {
      logger.debug('[CronJobs] Limpando contadores de rate limit...');
      // RateLimiter já limpa automaticamente, mas podemos forçar aqui
    });

    logger.info('[CronJobs] ✅ Todos os cron jobs iniciados');
  }

  /**
   * Envia resumo diário para todos os usuários
   */
  private static async sendDailySummary(period: 'morning' | 'evening'): Promise<void> {
    try {
      logger.info(`[CronJobs] Enviando resumo diário (${period})...`);

      const sessionStats = SessionManager.getStatistics();
      let sent = 0;
      let errors = 0;

      // Itera sobre todas as sessões ativas
      for (const [phone, session] of (SessionManager as any).sessions.entries()) {
        try {
          // Obtém provider do usuário
          const provider = await ProviderFactory.getProvider(
            session.userId,
            phone,
            session.tier
          );

          // Busca resumo diário via API
          const apiService = new ApiService();
          apiService.setToken(session.token);
          
          const summary = await apiService.getDailySummary();

          // Monta mensagem
          let message = '';

          if (period === 'morning') {
            message = `☀️ *Bom dia!*\n\n`;
            message += `📊 *Resumo de Ontem*\n\n`;
          } else {
            message += `🌙 *Boa noite!*\n\n`;
            message += `📊 *Resumo de Hoje*\n\n`;
          }

          message += `💵 Receitas: R$ ${summary.income?.toFixed(2) || '0.00'}\n`;
          message += `💸 Despesas: R$ ${summary.expense?.toFixed(2) || '0.00'}\n`;
          message += `💰 Saldo: R$ ${summary.balance?.toFixed(2) || '0.00'}\n\n`;

          if (summary.topCategory) {
            message += `🏆 Maior gasto: ${summary.topCategory.name} (R$ ${summary.topCategory.amount.toFixed(2)})\n\n`;
          }

          message += period === 'morning' 
            ? 'Tenha um ótimo dia! 🚀'
            : 'Descanse bem! 😴';

          // Envia mensagem
          await provider.sendTextMessage(`whatsapp:${phone}`, message);
          sent++;

          // Aguarda 1s entre mensagens para não sobrecarregar
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          logger.error(`[CronJobs] Erro ao enviar resumo para ${phone}:`, error);
          errors++;
        }
      }

      logger.info(
        `[CronJobs] ✅ Resumo diário enviado: ${sent} sucesso, ${errors} erros`
      );
    } catch (error) {
      logger.error('[CronJobs] Erro ao enviar resumos diários:', error);
    }
  }

  /**
   * Limpa sessões expiradas
   */
  private static cleanExpiredSessions(): void {
    logger.info('[CronJobs] Limpando sessões expiradas...');
    SessionManager.cleanExpiredSessions();
  }

  /**
   * Para todos os cron jobs (útil ao encerrar aplicação)
   */
  static stop(): void {
    logger.info('[CronJobs] Parando todos os cron jobs...');
    // cron.schedule retorna um objeto com método .stop()
    // Mas para simplificar, deixamos o Node.js gerenciar
  }
}
