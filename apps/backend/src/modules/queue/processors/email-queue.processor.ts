import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUES } from '../queue.constants';
import { EmailService } from '../../email/email.service';
import { EmailJob } from '../queue.service';
import * as Sentry from '@sentry/node';

@Processor(QUEUES.EMAIL, {
  concurrency: 5, // Processa até 5 emails simultaneamente
  limiter: {
    max: 10, // Máximo de 10 jobs
    duration: 1000, // Por segundo (para evitar rate limits de provedores de email)
  },
})
export class EmailQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailQueueProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<EmailJob>): Promise<void> {
    this.logger.log(`Processing email job ${job.id} of type ${job.data.type}`);

    try {
      switch (job.data.type) {
        case 'password-reset':
          await this.handlePasswordReset(job.data);
          break;
        case 'welcome':
          await this.handleWelcomeEmail(job.data);
          break;
        case 'verification':
          await this.handleVerificationEmail(job.data);
          break;
        case 'data-export-ready':
          await this.handleDataExportReady(job.data);
          break;
        case 'account-deletion-scheduled':
          await this.handleAccountDeletionScheduled(job.data);
          break;
        case 'account-deletion-imminent':
          await this.handleAccountDeletionImminent(job.data);
          break;
        case 'account-deleted':
          await this.handleAccountDeleted(job.data);
          break;
        case 'consent-withdrawn':
          await this.handleConsentWithdrawn(job.data);
          break;
        case 'consent-expired':
          await this.handleConsentExpired(job.data);
          break;
        default:
          throw new Error(`Unknown email type: ${(job.data as any).type}`);
      }

      this.logger.log(`Email job ${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(`Failed to process email job ${job.id}`, error);

      Sentry.captureException(error, {
        tags: {
          queue: 'email',
          email_type: job.data.type,
          email_recipient: job.data.email,
          job_id: job.id,
        },
        extra: {
          job_data: job.data,
          attempt: job.attemptsMade,
          error_message: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error; // Re-throw para que o BullMQ faça retry
    }
  }

  private async handlePasswordReset(data: EmailJob): Promise<void> {
    if (!data.data.resetToken) {
      throw new Error('Reset token is required for password reset email');
    }

    const success = await this.emailService.sendPasswordResetEmail(
      data.email,
      data.data.resetToken
    );

    if (!success) {
      throw new Error('Failed to send password reset email');
    }
  }

  private async handleWelcomeEmail(data: EmailJob): Promise<void> {
    if (!data.data.userName) {
      throw new Error('User name is required for welcome email');
    }

    const success = await this.emailService.sendWelcomeEmail(data.email, data.data.userName);

    if (!success) {
      throw new Error('Failed to send welcome email');
    }
  }

  private async handleVerificationEmail(data: EmailJob): Promise<void> {
    if (!data.data.verificationToken) {
      throw new Error('Verification token is required for verification email');
    }

    const success = await this.emailService.sendVerificationEmail(
      data.email,
      data.data.verificationToken
    );

    if (!success) {
      throw new Error('Failed to send verification email');
    }
  }

  private async handleDataExportReady(data: EmailJob): Promise<void> {
    if (!data.data.downloadUrl) {
      throw new Error('Download URL is required for data export ready email');
    }

    const success = await this.emailService.sendDataExportReadyEmail(
      data.email,
      data.data.downloadUrl
    );

    if (!success) {
      throw new Error('Failed to send data export ready email');
    }
  }

  private async handleAccountDeletionScheduled(data: EmailJob): Promise<void> {
    if (!data.data.deletionDate) {
      throw new Error('Deletion date is required for account deletion scheduled email');
    }

    const success = await this.emailService.sendAccountDeletionScheduledEmail(
      data.email,
      data.data.deletionDate,
      data.data.daysUntilDeletion || 30
    );

    if (!success) {
      throw new Error('Failed to send account deletion scheduled email');
    }
  }

  private async handleAccountDeletionImminent(data: EmailJob): Promise<void> {
    if (!data.data.deletionDate) {
      throw new Error('Deletion date is required for account deletion imminent email');
    }

    const success = await this.emailService.sendAccountDeletionImminentEmail(
      data.email,
      data.data.deletionDate
    );

    if (!success) {
      throw new Error('Failed to send account deletion imminent email');
    }
  }

  private async handleAccountDeleted(data: EmailJob): Promise<void> {
    const success = await this.emailService.sendAccountDeletedEmail(data.email);

    if (!success) {
      throw new Error('Failed to send account deleted email');
    }
  }

  private async handleConsentWithdrawn(data: EmailJob): Promise<void> {
    if (!data.data.consentType || !data.data.consentName) {
      throw new Error('Consent type and name are required for consent withdrawn email');
    }

    const success = await this.emailService.sendConsentWithdrawnEmail(
      data.email,
      data.data.consentType,
      data.data.consentName
    );

    if (!success) {
      throw new Error('Failed to send consent withdrawn email');
    }
  }

  private async handleConsentExpired(data: EmailJob): Promise<void> {
    if (!data.data.consentType || !data.data.consentName) {
      throw new Error('Consent type and name are required for consent expired email');
    }

    const success = await this.emailService.sendConsentExpiredEmail(
      data.email,
      data.data.consentType,
      data.data.consentName
    );

    if (!success) {
      throw new Error('Failed to send consent expired email');
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<EmailJob>) {
    this.logger.debug(`Job ${job.id} completed for email: ${job.data.email}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<EmailJob>, error: Error) {
    this.logger.error(`Job ${job.id} failed for email: ${job.data.email}`, error.stack);

    // Se o job falhou após todas as tentativas, envia para Sentry
    if (job.attemptsMade >= (job.opts.attempts || 1)) {
      Sentry.captureException(error, {
        tags: {
          queue: 'email',
          email_type: job.data.type,
          email_recipient: job.data.email,
          job_id: job.id,
          final_failure: 'true',
        },
        extra: {
          job_data: job.data,
          attempts_made: job.attemptsMade,
          max_attempts: job.opts.attempts,
          error_message: error.message,
          error_stack: error.stack,
        },
        level: 'error',
      });
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job<EmailJob>) {
    this.logger.debug(`Job ${job.id} is now active`);
  }
}
