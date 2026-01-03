/**
 * Scene de Onboarding (Wizard manual)
 * Adaptado de apps/telegram-bot/src/scenes/onboarding.scene.ts
 *
 * Fluxo:
 * Step 0: Solicita nome
 * Step 1: Salva nome e solicita nome da conta
 * Step 2: Solicita saldo da conta
 * Step 3: Cria conta e solicita perfil de investidor
 * Step 4: Salva perfil e finaliza
 */

import { WhatsAppMessage, IWhatsAppProvider } from '../providers/IWhatsAppProvider';
import { SessionService } from '../services/session.service';
import { BotApiService } from '../services/bot-api.service';

export class OnboardingScene {
  private apiService: BotApiService;

  constructor(
    private provider: IWhatsAppProvider,
    private sessionService: SessionService
  ) {
    this.apiService = new BotApiService();
  }

  /**
   * Inicia o onboarding (chamado após login)
   */
  async start(phoneNumber: string): Promise<void> {
    const session = this.sessionService.getSession(phoneNumber);
    const currentStep = session.user?.onboardingStep || 0;

    // Posiciona no step correto
    session.sceneStep = currentStep;
    this.sessionService.setSession(phoneNumber, session);

    // Envia mensagem do step atual
    await this.sendStepMessage(phoneNumber, currentStep);
  }

  /**
   * Processa mensagem baseada no step atual
   */
  async handleStep(message: WhatsAppMessage): Promise<void> {
    const phoneNumber = message.from;
    const session = this.sessionService.getSession(phoneNumber);
    const currentStep = session.sceneStep || 0;

    switch (currentStep) {
      case 0:
        await this.stepSaveName(message);
        break;

      case 1:
        await this.stepSaveAccountName(message);
        break;

      case 2:
        await this.stepCreateAccount(message);
        break;

      case 3:
        await this.stepSaveProfile(message);
        break;

      default:
        // Reset se estiver em step inválido
        session.sceneStep = 0;
        this.sessionService.setSession(phoneNumber, session);
        await this.sendStepMessage(phoneNumber, 0);
    }
  }

  /**
   * Envia mensagem apropriada para cada step
   */
  private async sendStepMessage(phoneNumber: string, step: number): Promise<void> {
    switch (step) {
      case 0:
        await this.provider.sendMessage(
          phoneNumber,
          '🚀 *Bem-vindo ao Fayol!*\n\n' +
            'Vamos configurar seu perfil para começar.\n\n' +
            'Primeiro, como você gostaria de ser chamado?'
        );
        break;

      case 1:
        await this.provider.sendMessage(
          phoneNumber,
          'Agora vamos criar sua *Conta Principal*.\n\n' +
            'Qual nome você quer dar para ela?\n\n' +
            '*Exemplos:* Nubank, Carteira, Itaú, Conta Corrente'
        );
        break;

      case 2:
        const session = this.sessionService.getSession(phoneNumber);
        const accountName = session.sceneData?.accountName || 'sua conta';
        await this.provider.sendMessage(
          phoneNumber,
          `Certo, conta "${accountName}".\n\n` +
            'Qual o *saldo atual* dela?\n\n' +
            '*Exemplos:* 1500.00 ou 0'
        );
        break;

      case 3:
        await this.provider.sendMessage(
          phoneNumber,
          '✅ Conta criada!\n\n' +
            'Por fim, qual seu *Perfil de Investidor*?\n\n' +
            '1️⃣ Conservador 🛡️\n' +
            '2️⃣ Moderado ⚖️\n' +
            '3️⃣ Agressivo 🚀\n\n' +
            'Digite *1*, *2* ou *3*:'
        );
        break;
    }
  }

  /**
   * Step 0 → Step 1: Salva nome e pergunta conta
   */
  private async stepSaveName(message: WhatsAppMessage): Promise<void> {
    const phoneNumber = message.from;
    const name = message.body.trim();

    if (!name || name.length < 2) {
      await this.provider.sendMessage(
        phoneNumber,
        '⚠️ Por favor, digite um nome válido (mínimo 2 letras).'
      );
      return;
    }

    const token = this.sessionService.getToken(phoneNumber);
    if (!token) {
      await this.provider.sendMessage(
        phoneNumber,
        '❌ Sessão inválida. Digite /start para recomeçar.'
      );
      return;
    }

    try {
      await this.apiService.updateOnboarding(token, { step: 2, name });

      // Atualiza sessão local
      const session = this.sessionService.getSession(phoneNumber);
      if (session.user) {
        session.user.name = name;
      }
      session.sceneStep = 1;
      this.sessionService.setSession(phoneNumber, session);

      await this.provider.sendMessage(
        phoneNumber,
        `Prazer, ${name}! 👋`
      );

      // Envia próxima pergunta
      await this.sendStepMessage(phoneNumber, 1);
    } catch (error) {
      console.error('❌ Erro ao salvar nome:', error);
      await this.provider.sendMessage(
        phoneNumber,
        '❌ Erro ao salvar nome. Tente novamente.'
      );
    }
  }

  /**
   * Step 1 → Step 2: Salva nome da conta e pergunta saldo
   */
  private async stepSaveAccountName(message: WhatsAppMessage): Promise<void> {
    const phoneNumber = message.from;
    const accountName = message.body.trim();

    if (!accountName) {
      await this.provider.sendMessage(
        phoneNumber,
        '⚠️ Por favor, digite o nome da conta.'
      );
      return;
    }

    // Salva temporariamente no sceneData
    const session = this.sessionService.getSession(phoneNumber);
    session.sceneStep = 2;
    session.sceneData = { accountName };
    this.sessionService.setSession(phoneNumber, session);

    // Envia próxima pergunta
    await this.sendStepMessage(phoneNumber, 2);
  }

  /**
   * Step 2 → Step 3: Cria conta e pergunta perfil
   */
  private async stepCreateAccount(message: WhatsAppMessage): Promise<void> {
    const phoneNumber = message.from;
    const balanceText = message.body.trim().replace(',', '.');
    const balance = parseFloat(balanceText);

    if (isNaN(balance)) {
      await this.provider.sendMessage(
        phoneNumber,
        '⚠️ Por favor, digite um valor numérico válido.\n\n*Exemplos:* 0 ou 1250.50'
      );
      return;
    }

    const token = this.sessionService.getToken(phoneNumber);
    const session = this.sessionService.getSession(phoneNumber);
    const accountName = session.sceneData?.accountName;

    if (!token || !accountName) {
      await this.provider.sendMessage(
        phoneNumber,
        '❌ Sessão inválida. Digite /start para recomeçar.'
      );
      return;
    }

    try {
      await this.provider.sendMessage(phoneNumber, '🔄 Criando conta...');

      await this.apiService.createAccount(token, {
        name: accountName,
        type: 'CHECKING',
        balance: balance,
      });

      // Avança para step 3 no backend
      await this.apiService.updateOnboarding(token, { step: 3 });

      // Atualiza sessão local
      session.sceneStep = 3;
      this.sessionService.setSession(phoneNumber, session);

      // Envia próxima pergunta
      await this.sendStepMessage(phoneNumber, 3);
    } catch (error) {
      console.error('❌ Erro ao criar conta:', error);
      await this.provider.sendMessage(
        phoneNumber,
        '❌ Erro ao criar conta. Vamos tentar o saldo novamente.\n\n' +
          'Digite o saldo da conta:'
      );
    }
  }

  /**
   * Step 3 → Finaliza: Salva perfil de investidor
   */
  private async stepSaveProfile(message: WhatsAppMessage): Promise<void> {
    const phoneNumber = message.from;
    const choice = message.body.trim();

    // Mapeia escolha para perfil
    let profile: string;

    switch (choice) {
      case '1':
        profile = 'CONSERVATIVE';
        break;
      case '2':
        profile = 'MODERATE';
        break;
      case '3':
        profile = 'AGGRESSIVE';
        break;
      default:
        await this.provider.sendMessage(
          phoneNumber,
          '⚠️ Opção inválida. Por favor, digite *1*, *2* ou *3*.'
        );
        return;
    }

    const token = this.sessionService.getToken(phoneNumber);
    if (!token) {
      await this.provider.sendMessage(
        phoneNumber,
        '❌ Sessão inválida. Digite /start para recomeçar.'
      );
      return;
    }

    try {
      await this.apiService.updateOnboarding(token, {
        step: 5, // Finaliza onboarding
        investorProfile: profile,
      });

      // Atualiza sessão: sai do onboarding
      const session = this.sessionService.getSession(phoneNumber);
      if (session.user) {
        session.user.onboardingStep = 5;
      }
      session.currentScene = null;
      session.sceneStep = 0;
      session.sceneData = {};
      this.sessionService.setSession(phoneNumber, session);

      const profileName = profile === 'CONSERVATIVE' ? 'Conservador 🛡️' :
                         profile === 'MODERATE' ? 'Moderado ⚖️' :
                         'Agressivo 🚀';

      await this.provider.sendMessage(
        phoneNumber,
        `🎉 *Tudo Pronto!*\n\n` +
          `Perfil selecionado: *${profileName}*\n\n` +
          `Seu perfil foi configurado com sucesso. Agora você pode começar a controlar suas finanças.\n\n` +
          `💡 *Dica:* Envie "Almoço 25.00" para registrar sua primeira despesa.\n\n` +
          `Use /ajuda para ver todos os comandos disponíveis.`
      );
    } catch (error) {
      console.error('❌ Erro ao salvar perfil:', error);
      await this.provider.sendMessage(
        phoneNumber,
        '❌ Erro ao salvar perfil. Tente selecionar novamente (1, 2 ou 3).'
      );
    }
  }
}
