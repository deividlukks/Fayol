import { Injectable, Logger } from '@nestjs/common';
import { ConsentType } from '@fayol/shared-types';
import { QueueService } from '../../modules/queue/queue.service';

@Injectable()
export class ComplianceNotificationsService {
  private readonly logger = new Logger(ComplianceNotificationsService.name);

  constructor(private queueService: QueueService) {}

  /**
   * Notifica usuário que seu export de dados está pronto
   */
  async notifyDataExportReady(userId: string, email: string, downloadUrl: string): Promise<void> {
    this.logger.log(`Notifying user - Data export ready`);

    try {
      await this.queueService.addEmailJob({
        type: 'data-export-ready',
        email,
        data: {
          downloadUrl,
        },
      });

      this.logger.debug(`Email job queued successfully for data export notification`);
    } catch (error) {
      this.logger.error(
        'Failed to queue data export notification email',
        error instanceof Error ? error.stack : error
      );
      throw error;
    }
  }

  /**
   * Notifica usuário que sua conta foi agendada para deletion
   */
  async notifyAccountDeletionScheduled(
    userId: string,
    email: string,
    deletionDate: Date
  ): Promise<void> {
    this.logger.log(`Notifying user - Account deletion scheduled`);

    const daysUntilDeletion = Math.ceil(
      (deletionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    try {
      await this.queueService.addEmailJob({
        type: 'account-deletion-scheduled',
        email,
        data: {
          deletionDate,
          daysUntilDeletion,
        },
      });

      this.logger.debug(
        `Email job queued successfully for account deletion scheduled notification`
      );
    } catch (error) {
      this.logger.error(
        'Failed to queue account deletion scheduled email',
        error instanceof Error ? error.stack : error
      );
      throw error;
    }
  }

  /**
   * Notifica usuário que sua deletion está próxima (7 dias antes)
   */
  async notifyAccountDeletionImminent(
    userId: string,
    email: string,
    deletionDate: Date
  ): Promise<void> {
    this.logger.log(`Notifying user - Account deletion imminent`);

    try {
      await this.queueService.addEmailJob({
        type: 'account-deletion-imminent',
        email,
        data: {
          deletionDate,
        },
      });

      this.logger.debug(`Email job queued successfully for account deletion imminent notification`);
    } catch (error) {
      this.logger.error(
        'Failed to queue account deletion imminent email',
        error instanceof Error ? error.stack : error
      );
      throw error;
    }
  }

  /**
   * Notifica usuário que sua conta foi deletada (email final)
   */
  async notifyAccountDeleted(email: string): Promise<void> {
    this.logger.log(`Notifying user - Account deleted`);

    try {
      await this.queueService.addEmailJob({
        type: 'account-deleted',
        email,
        data: {},
      });

      this.logger.debug(`Email job queued successfully for account deleted notification`);
    } catch (error) {
      this.logger.error(
        'Failed to queue account deleted email',
        error instanceof Error ? error.stack : error
      );
      throw error;
    }
  }

  /**
   * Notifica usuário que um consentimento foi retirado
   */
  async notifyConsentWithdrawn(
    userId: string,
    email: string,
    consentType: ConsentType
  ): Promise<void> {
    this.logger.log(`Notifying user - Consent withdrawn: ${consentType}`);

    const consentNames = {
      [ConsentType.TERMS_OF_SERVICE]: 'Termos de Serviço',
      [ConsentType.PRIVACY_POLICY]: 'Política de Privacidade',
      [ConsentType.MARKETING]: 'Comunicações de Marketing',
      [ConsentType.ANALYTICS]: 'Análises e Estatísticas',
      [ConsentType.COOKIES]: 'Cookies',
      [ConsentType.DATA_SHARING]: 'Compartilhamento de Dados',
      [ConsentType.PROFILING]: 'Perfilamento',
      [ConsentType.THIRD_PARTY]: 'Serviços de Terceiros',
    };

    try {
      await this.queueService.addEmailJob({
        type: 'consent-withdrawn',
        email,
        data: {
          consentType,
          consentName: consentNames[consentType] || consentType,
        },
      });

      this.logger.debug(`Email job queued successfully for consent withdrawn notification`);
    } catch (error) {
      this.logger.error(
        'Failed to queue consent withdrawn email',
        error instanceof Error ? error.stack : error
      );
      throw error;
    }
  }

  /**
   * Notifica usuário que um consentimento expirou
   */
  async notifyConsentExpired(
    userId: string,
    email: string,
    consentType: ConsentType
  ): Promise<void> {
    this.logger.log(`Notifying user - Consent expired: ${consentType}`);

    const consentNames = {
      [ConsentType.TERMS_OF_SERVICE]: 'Termos de Serviço',
      [ConsentType.PRIVACY_POLICY]: 'Política de Privacidade',
      [ConsentType.MARKETING]: 'Comunicações de Marketing',
      [ConsentType.ANALYTICS]: 'Análises e Estatísticas',
      [ConsentType.COOKIES]: 'Cookies',
      [ConsentType.DATA_SHARING]: 'Compartilhamento de Dados',
      [ConsentType.PROFILING]: 'Perfilamento',
      [ConsentType.THIRD_PARTY]: 'Serviços de Terceiros',
    };

    try {
      await this.queueService.addEmailJob({
        type: 'consent-expired',
        email,
        data: {
          consentType,
          consentName: consentNames[consentType] || consentType,
        },
      });

      this.logger.debug(`Email job queued successfully for consent expired notification`);
    } catch (error) {
      this.logger.error(
        'Failed to queue consent expired email',
        error instanceof Error ? error.stack : error
      );
      throw error;
    }
  }
}
