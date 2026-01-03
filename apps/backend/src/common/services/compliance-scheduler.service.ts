import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConsentService } from '../../consent/consent.service';
import { DataExportService } from '../../data-export/data-export.service';
import { UserDeletionService } from '../../modules/users/services/user-deletion.service';

@Injectable()
export class ComplianceSchedulerService {
  private readonly logger = new Logger(ComplianceSchedulerService.name);

  constructor(
    private consentService: ConsentService,
    private dataExportService: DataExportService,
    private userDeletionService: UserDeletionService
  ) {}

  /**
   * Executa diariamente às 2h - Expira consentimentos antigos
   */
  @Cron('0 2 * * *', {
    name: 'expire-old-consents',
    timeZone: 'America/Sao_Paulo',
  })
  async expireOldConsents() {
    this.logger.log('Starting cron job: expire-old-consents');

    try {
      const count = await this.consentService.expireOldConsents();
      this.logger.log(`Expired ${count} old consents`);
    } catch (error) {
      this.logger.error('Error expiring old consents', error);
    }
  }

  /**
   * Executa diariamente às 3h - Limpa exports expirados (mais de 7 dias)
   */
  @Cron('0 3 * * *', {
    name: 'cleanup-expired-exports',
    timeZone: 'America/Sao_Paulo',
  })
  async cleanupExpiredExports() {
    this.logger.log('Starting cron job: cleanup-expired-exports');

    try {
      const count = await this.dataExportService.cleanupExpiredExports();
      this.logger.log(`Cleaned up ${count} expired export files`);
    } catch (error) {
      this.logger.error('Error cleaning up expired exports', error);
    }
  }

  /**
   * Executa diariamente às 4h - Processa deletions agendadas (após 30 dias)
   */
  @Cron('0 4 * * *', {
    name: 'process-scheduled-deletions',
    timeZone: 'America/Sao_Paulo',
  })
  async processScheduledDeletions() {
    this.logger.log('Starting cron job: process-scheduled-deletions');

    try {
      const count = await this.userDeletionService.processScheduledDeletions();
      this.logger.log(`Processed ${count} scheduled account deletions`);
    } catch (error) {
      this.logger.error('Error processing scheduled deletions', error);
    }
  }

  /**
   * Executa semanalmente aos domingos à 1h - Envia lembretes de deletion iminente (7 dias antes)
   */
  @Cron('0 1 * * 0', {
    name: 'send-deletion-reminders',
    timeZone: 'America/Sao_Paulo',
  })
  async sendDeletionReminders() {
    this.logger.log('Starting cron job: send-deletion-reminders');

    try {
      const count = await this.userDeletionService.sendDeletionReminders();
      this.logger.log(`Sent ${count} deletion reminder emails`);
    } catch (error) {
      this.logger.error('Error sending deletion reminders', error);
    }
  }

  /**
   * Health check - executa a cada 5 minutos para verificar se o scheduler está funcionando
   */
  @Cron(CronExpression.EVERY_5_MINUTES, {
    name: 'scheduler-health-check',
  })
  async healthCheck() {
    this.logger.debug('Compliance scheduler is running');
  }
}
