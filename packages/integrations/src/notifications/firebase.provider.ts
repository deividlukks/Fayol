import { INotificationProvider, EmailPayload, PushPayload } from './notification.interface';

// Interface simples para simular a lib firebase-admin se não estiver instalada
interface FirebaseAdminMock {
  messaging(): {
    send(message: { token: string; notification: { title: string; body: string }; data?: any }): Promise<string>;
  };
}

export class FirebaseProvider implements INotificationProvider {
  private firebaseApp: FirebaseAdminMock | any;

  constructor(firebaseAppInstance: any) {
    this.firebaseApp = firebaseAppInstance;
  }

  async sendEmail(payload: EmailPayload): Promise<boolean> {
    console.warn('[Firebase] Email sending not supported natively. Use ResendProvider.');
    return false;
  }

  async sendSms(to: string, message: string): Promise<boolean> {
    console.warn('[Firebase] SMS sending requires extension. Use TwilioProvider.');
    return false;
  }

  async sendPush(payload: PushPayload): Promise<boolean> {
    try {
      if (!this.firebaseApp) {
        console.error('[Firebase] App not initialized');
        return false;
      }

      await this.firebaseApp.messaging().send({
        token: payload.token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data || {},
      });

      console.log(`[Firebase] Push sent to ${payload.token.substring(0, 10)}...`);
      return true;
    } catch (error) {
      console.error('[Firebase] Error sending push:', error);
      return false;
    }
  }
}