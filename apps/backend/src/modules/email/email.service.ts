import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import * as Sentry from '@sentry/node';

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailProvider = this.configService.get<string>('EMAIL_PROVIDER', 'smtp');

    if (emailProvider === 'smtp') {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('SMTP_HOST'),
        port: this.configService.get<number>('SMTP_PORT', 587),
        secure: this.configService.get<boolean>('SMTP_SECURE', false),
        auth: {
          user: this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('SMTP_PASS'),
        },
      });
    } else if (emailProvider === 'gmail') {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: this.configService.get<string>('GMAIL_USER'),
          pass: this.configService.get<string>('GMAIL_APP_PASSWORD'),
        },
      });
    } else {
      this.logger.warn('No email provider configured. Email functionality will be disabled.');
      // Create a test account for development
      if (this.configService.get<string>('NODE_ENV') === 'development') {
        this.createTestAccount();
      }
    }
  }

  private async createTestAccount() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      this.logger.log('Using Ethereal test email account for development');
      this.logger.log(`Preview emails at: https://ethereal.email`);
    } catch (error) {
      this.logger.error('Failed to create test email account', error);
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    try {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
      const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
      const expirationTime = '1 hora';

      const mailOptions = {
        from: this.configService.get<string>('EMAIL_FROM', '"Fayol App" <noreply@fayol.app>'),
        to: email,
        subject: 'Recuperação de Senha - Fayol',
        html: this.getPasswordResetTemplate(resetLink, expirationTime),
        text: `
Olá,

Você solicitou a recuperação de senha para sua conta no Fayol.

Para criar uma nova senha, clique no link abaixo:
${resetLink}

Este link é válido por ${expirationTime}.

Se você não solicitou esta recuperação, ignore este email. Sua senha permanecerá inalterada.

Atenciosamente,
Equipe Fayol
        `.trim(),
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Password reset email sent to ${email}`);

      // Log preview URL in development
      if (this.configService.get<string>('NODE_ENV') === 'development') {
        this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error);
      Sentry.captureException(error, {
        tags: {
          email_type: 'password-reset',
          email_recipient: email,
        },
        extra: {
          error_message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      return false;
    }
  }

  private getPasswordResetTemplate(resetLink: string, expirationTime: string): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperação de Senha</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #4F46E5; padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Fayol</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Recuperação de Senha</h2>

              <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
                Olá,
              </p>

              <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
                Você solicitou a recuperação de senha para sua conta no Fayol.
                Clique no botão abaixo para criar uma nova senha:
              </p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${resetLink}"
                       style="background-color: #4F46E5; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                      Redefinir Senha
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #666666; line-height: 1.6; margin: 20px 0;">
                Este link é válido por <strong>${expirationTime}</strong>.
              </p>

              <p style="color: #666666; line-height: 1.6; margin: 20px 0 0 0;">
                Se você não solicitou esta recuperação, ignore este email.
                Sua senha permanecerá inalterada.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #999999; font-size: 12px; margin: 0 0 10px 0;">
                Se o botão não funcionar, copie e cole este link no seu navegador:
              </p>
              <p style="color: #4F46E5; font-size: 12px; margin: 0; word-break: break-all;">
                ${resetLink}
              </p>
              <p style="color: #999999; font-size: 12px; margin: 20px 0 0 0;">
                © ${new Date().getFullYear()} Fayol. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  async sendWelcomeEmail(email: string, userName: string): Promise<boolean> {
    try {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

      const mailOptions = {
        from: this.configService.get<string>('EMAIL_FROM', '"Fayol App" <noreply@fayol.app>'),
        to: email,
        subject: 'Bem-vindo ao Fayol!',
        html: this.getWelcomeTemplate(userName, frontendUrl),
        text: `
Olá ${userName},

Bem-vindo ao Fayol!

Estamos muito felizes em tê-lo conosco. O Fayol é sua ferramenta completa para gestão financeira pessoal.

Com o Fayol, você pode:
• Acompanhar todas as suas transações
• Criar orçamentos personalizados
• Visualizar relatórios detalhados
• Definir e acompanhar metas financeiras
• E muito mais!

Acesse agora: ${frontendUrl}

Se tiver alguma dúvida, nossa equipe está sempre à disposição.

Atenciosamente,
Equipe Fayol
        `.trim(),
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Welcome email sent to ${email}`);

      if (this.configService.get<string>('NODE_ENV') === 'development') {
        this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}`, error);
      Sentry.captureException(error, {
        tags: {
          email_type: 'welcome',
          email_recipient: email,
        },
        extra: {
          userName,
          error_message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      return false;
    }
  }

  async sendVerificationEmail(email: string, verificationToken: string): Promise<boolean> {
    try {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
      const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;

      const mailOptions = {
        from: this.configService.get<string>('EMAIL_FROM', '"Fayol App" <noreply@fayol.app>'),
        to: email,
        subject: 'Confirme seu email - Fayol',
        html: this.getVerificationTemplate(verificationLink),
        text: `
Olá,

Obrigado por se registrar no Fayol!

Para confirmar seu email e ativar sua conta, clique no link abaixo:
${verificationLink}

Este link é válido por 24 horas.

Se você não criou uma conta no Fayol, ignore este email.

Atenciosamente,
Equipe Fayol
        `.trim(),
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Verification email sent to ${email}`);

      if (this.configService.get<string>('NODE_ENV') === 'development') {
        this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
      Sentry.captureException(error, {
        tags: {
          email_type: 'verification',
          email_recipient: email,
        },
        extra: {
          error_message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      return false;
    }
  }

  private getWelcomeTemplate(userName: string, frontendUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao Fayol</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #4F46E5; padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Fayol</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Gestão Financeira Inteligente</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Bem-vindo, ${userName}!</h2>

              <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
                Estamos muito felizes em tê-lo conosco. O Fayol é sua ferramenta completa para gestão financeira pessoal.
              </p>

              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 18px;">O que você pode fazer:</h3>
                <ul style="color: #666666; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Acompanhar todas as suas transações</li>
                  <li>Criar orçamentos personalizados</li>
                  <li>Visualizar relatórios detalhados</li>
                  <li>Definir e acompanhar metas financeiras</li>
                  <li>Conectar suas contas bancárias</li>
                </ul>
              </div>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${frontendUrl}"
                       style="background-color: #4F46E5; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                      Acessar Fayol
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #666666; line-height: 1.6; margin: 20px 0 0 0;">
                Se tiver alguma dúvida, nossa equipe está sempre à disposição.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Fayol. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private getVerificationTemplate(verificationLink: string): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirme seu Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #4F46E5; padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Fayol</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Confirme seu Email</h2>

              <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
                Olá,
              </p>

              <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
                Obrigado por se registrar no Fayol! Para confirmar seu email e ativar sua conta,
                clique no botão abaixo:
              </p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${verificationLink}"
                       style="background-color: #10B981; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                      Confirmar Email
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #666666; line-height: 1.6; margin: 20px 0;">
                Este link é válido por <strong>24 horas</strong>.
              </p>

              <p style="color: #666666; line-height: 1.6; margin: 20px 0 0 0;">
                Se você não criou uma conta no Fayol, ignore este email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #999999; font-size: 12px; margin: 0 0 10px 0;">
                Se o botão não funcionar, copie e cole este link no seu navegador:
              </p>
              <p style="color: #4F46E5; font-size: 12px; margin: 0; word-break: break-all;">
                ${verificationLink}
              </p>
              <p style="color: #999999; font-size: 12px; margin: 20px 0 0 0;">
                © ${new Date().getFullYear()} Fayol. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  async sendDataExportReadyEmail(email: string, downloadUrl: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.configService.get<string>('EMAIL_FROM', '"Fayol App" <noreply@fayol.app>'),
        to: email,
        subject: 'Seus dados estão prontos para download - Fayol',
        html: this.getDataExportReadyTemplate(downloadUrl),
        text: `
Olá,

Sua solicitação de exportação de dados foi processada com sucesso.

Você pode baixar seus dados através do link abaixo:
${downloadUrl}

Este link expirará em 7 dias.

Atenciosamente,
Equipe Fayol
        `.trim(),
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Data export ready email sent`);

      if (this.configService.get<string>('NODE_ENV') === 'development') {
        this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to send data export ready email`, error);
      Sentry.captureException(error, {
        tags: { email_type: 'data-export-ready' },
      });
      return false;
    }
  }

  async sendAccountDeletionScheduledEmail(
    email: string,
    deletionDate: Date,
    daysUntilDeletion: number
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.configService.get<string>('EMAIL_FROM', '"Fayol App" <noreply@fayol.app>'),
        to: email,
        subject: 'Sua conta será deletada - Fayol',
        html: this.getAccountDeletionScheduledTemplate(deletionDate, daysUntilDeletion),
        text: `
Olá,

Recebemos sua solicitação para deletar sua conta Fayol.

Data de exclusão agendada: ${deletionDate.toLocaleDateString('pt-BR')}

Você tem ${daysUntilDeletion} dias para cancelar esta solicitação, caso tenha mudado de ideia.

Para cancelar a exclusão, faça login em sua conta e acesse as configurações.

Atenção: Após esta data, todos os seus dados serão permanentemente deletados e não poderão ser recuperados.

Atenciosamente,
Equipe Fayol
        `.trim(),
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Account deletion scheduled email sent`);

      if (this.configService.get<string>('NODE_ENV') === 'development') {
        this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to send account deletion scheduled email`, error);
      Sentry.captureException(error, {
        tags: { email_type: 'account-deletion-scheduled' },
      });
      return false;
    }
  }

  async sendAccountDeletionImminentEmail(email: string, deletionDate: Date): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.configService.get<string>('EMAIL_FROM', '"Fayol App" <noreply@fayol.app>'),
        to: email,
        subject: '⚠️ Sua conta será deletada em 7 dias - Fayol',
        html: this.getAccountDeletionImminentTemplate(deletionDate),
        text: `
⚠️ Lembrete: Exclusão de Conta Iminente

Olá,

Este é um lembrete de que sua conta Fayol será permanentemente deletada em:

${deletionDate.toLocaleDateString('pt-BR')} às ${deletionDate.toLocaleTimeString('pt-BR')}

Se você mudou de ideia e deseja manter sua conta, faça login e cancele a exclusão nas configurações.

Após esta data:
- Todos os seus dados serão permanentemente deletados
- Você não poderá mais acessar sua conta
- Esta ação não poderá ser revertida

Atenciosamente,
Equipe Fayol
        `.trim(),
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Account deletion imminent email sent`);

      if (this.configService.get<string>('NODE_ENV') === 'development') {
        this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to send account deletion imminent email`, error);
      Sentry.captureException(error, {
        tags: { email_type: 'account-deletion-imminent' },
      });
      return false;
    }
  }

  async sendAccountDeletedEmail(email: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.configService.get<string>('EMAIL_FROM', '"Fayol App" <noreply@fayol.app>'),
        to: email,
        subject: 'Sua conta foi deletada - Fayol',
        html: this.getAccountDeletedTemplate(),
        text: `
Conta Deletada com Sucesso

Olá,

Sua conta Fayol e todos os dados associados foram permanentemente deletados, conforme solicitado.

Lamentamos vê-lo(a) partir. Se você deseja criar uma nova conta no futuro, será sempre bem-vindo(a).

Obrigado por ter usado o Fayol.

Atenciosamente,
Equipe Fayol
        `.trim(),
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Account deleted email sent`);

      if (this.configService.get<string>('NODE_ENV') === 'development') {
        this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to send account deleted email`, error);
      Sentry.captureException(error, {
        tags: { email_type: 'account-deleted' },
      });
      return false;
    }
  }

  async sendConsentWithdrawnEmail(
    email: string,
    consentType: string,
    consentName: string
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.configService.get<string>('EMAIL_FROM', '"Fayol App" <noreply@fayol.app>'),
        to: email,
        subject: 'Consentimento retirado - Fayol',
        html: this.getConsentWithdrawnTemplate(consentName),
        text: `
Consentimento Retirado

Olá,

Confirmamos que você retirou seu consentimento para:

${consentName}

Esta mudança entra em vigor imediatamente.

Você pode gerenciar seus consentimentos a qualquer momento nas configurações de privacidade.

Atenciosamente,
Equipe Fayol
        `.trim(),
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Consent withdrawn email sent`);

      if (this.configService.get<string>('NODE_ENV') === 'development') {
        this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to send consent withdrawn email`, error);
      Sentry.captureException(error, {
        tags: { email_type: 'consent-withdrawn' },
      });
      return false;
    }
  }

  async sendConsentExpiredEmail(
    email: string,
    consentType: string,
    consentName: string
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.configService.get<string>('EMAIL_FROM', '"Fayol App" <noreply@fayol.app>'),
        to: email,
        subject: 'Consentimento expirado - Fayol',
        html: this.getConsentExpiredTemplate(consentName),
        text: `
Consentimento Expirado

Olá,

Informamos que seu consentimento para ${consentName} expirou.

Para continuar utilizando recursos relacionados, você precisará renovar seu consentimento nas configurações de privacidade.

Atenciosamente,
Equipe Fayol
        `.trim(),
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Consent expired email sent`);

      if (this.configService.get<string>('NODE_ENV') === 'development') {
        this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to send consent expired email`, error);
      Sentry.captureException(error, {
        tags: { email_type: 'consent-expired' },
      });
      return false;
    }
  }

  // ==================== EMAIL TEMPLATES ====================

  private getDataExportReadyTemplate(downloadUrl: string): string {
    return this.getBaseTemplate(
      'Seus dados estão prontos!',
      `
        <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
          Olá,
        </p>

        <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
          Sua solicitação de exportação de dados foi processada com sucesso.
          Você pode baixar seus dados através do botão abaixo:
        </p>

        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <a href="${downloadUrl}"
                 style="background-color: #10B981; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Baixar Meus Dados
              </a>
            </td>
          </tr>
        </table>

        <p style="color: #666666; line-height: 1.6; margin: 20px 0;">
          Este link expirará em <strong>7 dias</strong>.
        </p>
      `,
      downloadUrl
    );
  }

  private getAccountDeletionScheduledTemplate(
    deletionDate: Date,
    daysUntilDeletion: number
  ): string {
    return this.getBaseTemplate(
      'Solicitação de Exclusão de Conta',
      `
        <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
          Olá,
        </p>

        <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
          Recebemos sua solicitação para deletar sua conta Fayol.
        </p>

        <div style="background-color: #FEF3C7; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #F59E0B;">
          <p style="color: #92400E; margin: 0 0 10px 0; font-weight: bold;">
            Data de exclusão agendada:
          </p>
          <p style="color: #92400E; margin: 0; font-size: 18px;">
            ${deletionDate.toLocaleDateString('pt-BR')}
          </p>
        </div>

        <p style="color: #666666; line-height: 1.6; margin: 20px 0;">
          Você tem <strong>${daysUntilDeletion} dias</strong> para cancelar esta solicitação, caso tenha mudado de ideia.
        </p>

        <p style="color: #666666; line-height: 1.6; margin: 20px 0;">
          Para cancelar a exclusão, faça login em sua conta e acesse as configurações.
        </p>

        <div style="background-color: #FEE2E2; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="color: #991B1B; margin: 0; font-size: 14px;">
            <strong>Atenção:</strong> Após esta data, todos os seus dados serão permanentemente deletados e não poderão ser recuperados.
          </p>
        </div>
      `
    );
  }

  private getAccountDeletionImminentTemplate(deletionDate: Date): string {
    return this.getBaseTemplate(
      '⚠️ Lembrete: Exclusão de Conta Iminente',
      `
        <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
          Olá,
        </p>

        <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
          Este é um lembrete de que sua conta Fayol será <strong>permanentemente deletada</strong> em:
        </p>

        <div style="background-color: #FEE2E2; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #DC2626; text-align: center;">
          <p style="color: #991B1B; margin: 0; font-size: 20px; font-weight: bold;">
            ${deletionDate.toLocaleDateString('pt-BR')} às ${deletionDate.toLocaleTimeString('pt-BR')}
          </p>
        </div>

        <p style="color: #666666; line-height: 1.6; margin: 20px 0;">
          Se você mudou de ideia e deseja manter sua conta, faça login e cancele a exclusão nas configurações.
        </p>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 16px;">Após esta data:</h3>
          <ul style="color: #666666; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>Todos os seus dados serão permanentemente deletados</li>
            <li>Você não poderá mais acessar sua conta</li>
            <li>Esta ação não poderá ser revertida</li>
          </ul>
        </div>
      `
    );
  }

  private getAccountDeletedTemplate(): string {
    return this.getBaseTemplate(
      'Conta Deletada com Sucesso',
      `
        <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
          Olá,
        </p>

        <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
          Sua conta Fayol e todos os dados associados foram permanentemente deletados, conforme solicitado.
        </p>

        <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
          Lamentamos vê-lo(a) partir. Se você deseja criar uma nova conta no futuro, será sempre bem-vindo(a).
        </p>

        <p style="color: #666666; line-height: 1.6; margin: 0;">
          Obrigado por ter usado o Fayol.
        </p>
      `
    );
  }

  private getConsentWithdrawnTemplate(consentName: string): string {
    return this.getBaseTemplate(
      'Consentimento Retirado',
      `
        <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
          Olá,
        </p>

        <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
          Confirmamos que você retirou seu consentimento para:
        </p>

        <div style="background-color: #DBEAFE; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center;">
          <p style="color: #1E40AF; margin: 0; font-size: 18px; font-weight: bold;">
            ${consentName}
          </p>
        </div>

        <p style="color: #666666; line-height: 1.6; margin: 20px 0;">
          Esta mudança entra em vigor imediatamente.
        </p>

        <p style="color: #666666; line-height: 1.6; margin: 0;">
          Você pode gerenciar seus consentimentos a qualquer momento nas configurações de privacidade.
        </p>
      `
    );
  }

  private getConsentExpiredTemplate(consentName: string): string {
    return this.getBaseTemplate(
      'Consentimento Expirado',
      `
        <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
          Olá,
        </p>

        <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
          Informamos que seu consentimento para <strong>${consentName}</strong> expirou.
        </p>

        <div style="background-color: #FEF3C7; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <p style="color: #92400E; margin: 0;">
            Para continuar utilizando recursos relacionados, você precisará renovar seu consentimento nas configurações de privacidade.
          </p>
        </div>
      `
    );
  }

  private getBaseTemplate(title: string, content: string, linkUrl?: string): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color: #4F46E5; padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Fayol</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">${title}</h2>
              ${content}
            </td>
          </tr>

          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              ${
                linkUrl
                  ? `
                <p style="color: #999999; font-size: 12px; margin: 0 0 10px 0;">
                  Se o botão não funcionar, copie e cole este link no seu navegador:
                </p>
                <p style="color: #4F46E5; font-size: 12px; margin: 0; word-break: break-all;">
                  ${linkUrl}
                </p>
              `
                  : ''
              }
              <p style="color: #999999; font-size: 12px; margin: ${linkUrl ? '20px' : '0'} 0 0 0;">
                © ${new Date().getFullYear()} Fayol. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Verify email configuration
   */
  async verifyConnection(): Promise<boolean> {
    try {
      if (!this.transporter) {
        this.logger.warn('Email transporter not initialized');
        return false;
      }
      await this.transporter.verify();
      this.logger.log('Email service connection verified successfully');
      return true;
    } catch (error) {
      this.logger.error('Email service connection failed', error);
      return false;
    }
  }
}
