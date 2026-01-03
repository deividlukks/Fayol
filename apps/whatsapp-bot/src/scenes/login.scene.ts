/**
 * Scene de Login (Wizard manual)
 * Adaptado de apps/telegram-bot/src/scenes/login.scene.ts
 *
 * Fluxo:
 * Step 0: Solicita e-mail/celular
 * Step 1: Valida usuário e solicita senha
 * Step 2: Autentica e redireciona
 */

import { WhatsAppMessage, IWhatsAppProvider } from '../providers/IWhatsAppProvider';
import { SessionService } from '../services/session.service';
import { BotApiService } from '../services/bot-api.service';

export class LoginScene {
  private apiService: BotApiService;

  constructor(
    private provider: IWhatsAppProvider,
    private sessionService: SessionService
  ) {
    this.apiService = new BotApiService();
  }

  async handleStep(message: WhatsAppMessage): Promise<void> {
    const phoneNumber = message.from;
    const session = this.sessionService.getSession(phoneNumber);
    const currentStep = session.sceneStep || 0;

    switch (currentStep) {
      case 0:
        await this.stepValidateIdentifier(message);
        break;

      case 1:
        await this.stepAuthenticate(message);
        break;

      default:
        // Reset se estiver em step inválido
        session.sceneStep = 0;
        this.sessionService.setSession(phoneNumber, session);
        await this.stepValidateIdentifier(message);
    }
  }

  /**
   * Step 0 → Step 1: Valida e-mail/celular e solicita senha
   */
  private async stepValidateIdentifier(message: WhatsAppMessage): Promise<void> {
    const phoneNumber = message.from;
    const identifier = message.body.trim();

    if (!identifier) {
      await this.provider.sendMessage(
        phoneNumber,
        '⚠️ Por favor, envie um e-mail ou celular válido.'
      );
      return;
    }

    await this.provider.sendMessage(phoneNumber, '🔍 Verificando...');

    try {
      const exists = await this.apiService.checkUser(identifier);

      if (!exists) {
        await this.provider.sendMessage(
          phoneNumber,
          `❌ Usuário "${identifier}" não encontrado no sistema.\n\n` +
            `📝 Para criar uma conta, acesse:\n` +
            `${process.env.WEB_APP_URL || 'http://localhost:3000'}/auth/register\n\n` +
            `Digite outro e-mail ou celular para tentar novamente.`
        );
        return;
      }

      // Salva identifier e avança para próximo step
      const session = this.sessionService.getSession(phoneNumber);
      session.sceneStep = 1;
      session.sceneData = { identifier };
      this.sessionService.setSession(phoneNumber, session);

      await this.provider.sendMessage(
        phoneNumber,
        '✅ Encontrado!\n\n🔐 *Passo 2/2:* Digite sua senha:'
      );
    } catch (error: any) {
      console.error('❌ Erro ao verificar usuário:', error);

      const errorMsg = error.message?.includes('ECONN')
        ? '🔌 O servidor do Fayol parece estar offline.\n\nTente novamente em alguns instantes.'
        : '⚠️ Erro técnico ao verificar usuário.\n\nTente novamente.';

      await this.provider.sendMessage(phoneNumber, errorMsg);
    }
  }

  /**
   * Step 1 → Finaliza: Autentica e redireciona
   */
  private async stepAuthenticate(message: WhatsAppMessage): Promise<void> {
    const phoneNumber = message.from;
    const password = message.body.trim();
    const session = this.sessionService.getSession(phoneNumber);
    const identifier = session.sceneData?.identifier;

    if (!identifier) {
      // Recomeça o fluxo se não tiver identifier
      session.sceneStep = 0;
      session.sceneData = {};
      this.sessionService.setSession(phoneNumber, session);

      await this.provider.sendMessage(
        phoneNumber,
        '❌ Sessão inválida. Vamos recomeçar.\n\n📧 Digite seu e-mail ou celular:'
      );
      return;
    }

    if (!password) {
      await this.provider.sendMessage(
        phoneNumber,
        '⚠️ Por favor, digite sua senha.'
      );
      return;
    }

    await this.provider.sendMessage(phoneNumber, '🔐 Autenticando...');

    try {
      const result = await this.apiService.login(identifier, password);

      if (result && result.access_token) {
        // Salva token e dados do usuário
        session.token = result.access_token;
        session.user = result.user;

        // Verifica se precisa completar onboarding
        if (result.user.onboardingStep !== undefined && result.user.onboardingStep < 5) {
          // Sai do login e entra no onboarding
          session.currentScene = 'onboarding';
          session.sceneStep = result.user.onboardingStep;
          session.sceneData = {};
          this.sessionService.setSession(phoneNumber, session);

          await this.provider.sendMessage(
            phoneNumber,
            `🎉 *Bem-vindo, ${result.user.name}!*\n\n` +
              `Antes de começar, vamos configurar sua conta...`
          );

          // Chama o OnboardingScene para continuar
          const { OnboardingScene } = await import('./onboarding.scene');
          const onboardingScene = new OnboardingScene(this.provider, this.sessionService);
          await onboardingScene.start(phoneNumber);

          return;
        }

        // Onboarding completo - finaliza login
        session.currentScene = null;
        session.sceneStep = 0;
        session.sceneData = {};
        this.sessionService.setSession(phoneNumber, session);

        await this.provider.sendMessage(
          phoneNumber,
          `🎉 *Olá de volta, ${result.user.name}!*\n\n` +
            `Estou pronto! Digite "Almoço 20.00" para lançar uma despesa.\n\n` +
            `Use /ajuda para ver todos os comandos disponíveis.`
        );
      } else {
        await this.provider.sendMessage(
          phoneNumber,
          '🚫 Senha incorreta.\n\n' +
            'Digite sua senha novamente ou envie /start para recomeçar.'
        );
      }
    } catch (error: any) {
      console.error('❌ Erro ao fazer login:', error);

      const errorMsg = error.message?.includes('401')
        ? '🚫 E-mail/celular ou senha incorretos.\n\nTente novamente.'
        : error.message?.includes('ECONN')
        ? '🔌 Servidor offline. Tente novamente em alguns instantes.'
        : '⚠️ Erro ao fazer login. Tente novamente.';

      await this.provider.sendMessage(phoneNumber, errorMsg);
    }
  }
}
