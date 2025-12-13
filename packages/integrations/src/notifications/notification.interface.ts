export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export interface INotificationProvider {
  sendEmail(payload: EmailPayload): Promise<boolean>;
  sendSms(to: string, message: string): Promise<boolean>;
}
