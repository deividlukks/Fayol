import { INotificationProvider, EmailPayload } from './notification.interface';

export class ResendProvider implements INotificationProvider {
  async sendEmail(payload: EmailPayload): Promise<boolean> {
    console.log(`[Resend] Enviando e-mail para ${payload.to}: ${payload.subject}`);
    return true;
  }

  async sendSms(to: string, message: string): Promise<boolean> {
    console.warn('[Resend] SMS não suportado nativamente. Use TwilioProvider.');
    return false;
  }
}
