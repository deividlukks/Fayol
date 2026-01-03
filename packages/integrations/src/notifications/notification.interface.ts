export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export interface PushPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface INotificationProvider {
  sendEmail(payload: EmailPayload): Promise<boolean>;
  sendSms(to: string, message: string): Promise<boolean>;
  // Adicionado para suportar Mobile/PWA
  sendPush?(payload: PushPayload): Promise<boolean>; 
}