/**
 * Teste de integração: Fluxo completo de autenticação
 * Simula login de usuário + onboarding
 */

import { SessionService } from '../../src/services/session.service';
import { LoginScene } from '../../src/scenes/login.scene';
import { OnboardingScene } from '../../src/scenes/onboarding.scene';
import { BotApiService } from '../../src/services/bot-api.service';
import { WhatsAppMessage, IWhatsAppProvider } from '../../src/providers/IWhatsAppProvider';

// Mock do Provider
class MockWhatsAppProvider implements IWhatsAppProvider {
  public sentMessages: Array<{ to: string; text: string }> = [];

  async initialize(): Promise<void> {}

  async sendMessage(to: string, text: string): Promise<void> {
    this.sentMessages.push({ to, text });
  }

  async sendMedia(): Promise<void> {}

  onMessage(): void {}

  async getBotInfo() {
    return { phoneNumber: '551199999999', name: 'Test Bot' };
  }

  async isOnWhatsApp(): Promise<boolean> {
    return true;
  }

  async disconnect(): Promise<void> {}

  clearSentMessages() {
    this.sentMessages = [];
  }

  getLastMessage(): string | undefined {
    return this.sentMessages[this.sentMessages.length - 1]?.text;
  }
}

// Mock do BotApiService
jest.mock('../../src/services/bot-api.service');

describe('Integration: Auth Flow', () => {
  let sessionService: SessionService;
  let mockProvider: MockWhatsAppProvider;
  let loginScene: LoginScene;
  let onboardingScene: OnboardingScene;
  let mockApiService: jest.Mocked<BotApiService>;

  const testPhone = '5511999999999@s.whatsapp.net';

  beforeEach(() => {
    sessionService = new SessionService();
    mockProvider = new MockWhatsAppProvider();
    loginScene = new LoginScene(mockProvider, sessionService);
    onboardingScene = new OnboardingScene(mockProvider, sessionService);

    // Setup mock do API service
    mockApiService = new BotApiService() as jest.Mocked<BotApiService>;
    (BotApiService as jest.Mock).mockImplementation(() => mockApiService);
  });

  describe('Login completo', () => {
    it('deve completar fluxo de login com sucesso', async () => {
      // Mock das respostas da API
      mockApiService.checkUser = jest.fn().mockResolvedValue(true);
      mockApiService.login = jest.fn().mockResolvedValue({
        access_token: 'test-token',
        user: {
          name: 'João',
          onboardingStep: 5, // Onboarding completo
        },
      });

      // Inicializa sessão como "login"
      const session = sessionService.getSession(testPhone);
      session.currentScene = 'login';
      session.sceneStep = 0;
      sessionService.setSession(testPhone, session);

      // Step 1: Usuário envia e-mail
      mockProvider.clearSentMessages();
      await loginScene.handleStep({
        from: testPhone,
        body: 'joao@example.com',
        isGroup: false,
        timestamp: Date.now(),
        hasMedia: false,
      } as WhatsAppMessage);

      // Deve ter solicitado senha
      const response1 = mockProvider.getLastMessage();
      expect(response1).toContain('senha');

      // Verifica que avançou para step 1
      const sessionAfterEmail = sessionService.getSession(testPhone);
      expect(sessionAfterEmail.sceneStep).toBe(1);

      // Step 2: Usuário envia senha
      mockProvider.clearSentMessages();
      await loginScene.handleStep({
        from: testPhone,
        body: 'senha123',
        isGroup: false,
        timestamp: Date.now(),
        hasMedia: false,
      } as WhatsAppMessage);

      // Deve ter autenticado e saído do login
      const sessionAfterLogin = sessionService.getSession(testPhone);
      expect(sessionAfterLogin.token).toBe('test-token');
      expect(sessionAfterLogin.user?.name).toBe('João');
      expect(sessionAfterLogin.currentScene).toBeNull();

      const finalResponse = mockProvider.getLastMessage();
      expect(finalResponse).toContain('Olá de volta');
    });

    it('deve redirecionar para onboarding se incompleto', async () => {
      mockApiService.checkUser = jest.fn().mockResolvedValue(true);
      mockApiService.login = jest.fn().mockResolvedValue({
        access_token: 'test-token',
        user: {
          name: 'Maria',
          onboardingStep: 2, // Onboarding incompleto
        },
      });

      const session = sessionService.getSession(testPhone);
      session.currentScene = 'login';
      session.sceneStep = 0;
      sessionService.setSession(testPhone, session);

      // Envia email
      await loginScene.handleStep({
        from: testPhone,
        body: 'maria@example.com',
        isGroup: false,
        timestamp: Date.now(),
        hasMedia: false,
      } as WhatsAppMessage);

      // Envia senha
      await loginScene.handleStep({
        from: testPhone,
        body: 'senha456',
        isGroup: false,
        timestamp: Date.now(),
        hasMedia: false,
      } as WhatsAppMessage);

      // Deve ter redirecionado para onboarding
      const sessionAfter = sessionService.getSession(testPhone);
      expect(sessionAfter.currentScene).toBe('onboarding');
      expect(sessionAfter.sceneStep).toBe(2);
    });

    it('deve rejeitar usuário não cadastrado', async () => {
      mockApiService.checkUser = jest.fn().mockResolvedValue(false);

      const session = sessionService.getSession(testPhone);
      session.currentScene = 'login';
      session.sceneStep = 0;
      sessionService.setSession(testPhone, session);

      mockProvider.clearSentMessages();
      await loginScene.handleStep({
        from: testPhone,
        body: 'naoexiste@example.com',
        isGroup: false,
        timestamp: Date.now(),
        hasMedia: false,
      } as WhatsAppMessage);

      const response = mockProvider.getLastMessage();
      expect(response).toContain('não encontrado');

      // Não deve ter avançado de step
      const sessionAfter = sessionService.getSession(testPhone);
      expect(sessionAfter.sceneStep).toBe(0);
    });

    it('deve rejeitar senha incorreta', async () => {
      mockApiService.checkUser = jest.fn().mockResolvedValue(true);
      mockApiService.login = jest.fn().mockResolvedValue(null); // Login falhou

      const session = sessionService.getSession(testPhone);
      session.currentScene = 'login';
      session.sceneStep = 0;
      session.sceneData = { identifier: 'test@example.com' };
      sessionService.setSession(testPhone, session);

      // Avança para step 1 (senha)
      session.sceneStep = 1;
      sessionService.setSession(testPhone, session);

      mockProvider.clearSentMessages();
      await loginScene.handleStep({
        from: testPhone,
        body: 'senhaerrada',
        isGroup: false,
        timestamp: Date.now(),
        hasMedia: false,
      } as WhatsAppMessage);

      const response = mockProvider.getLastMessage();
      expect(response).toContain('incorreta');

      // Não deve ter token
      const sessionAfter = sessionService.getSession(testPhone);
      expect(sessionAfter.token).toBeUndefined();
    });
  });

  describe('Onboarding completo', () => {
    beforeEach(() => {
      // Simula usuário logado mas sem onboarding completo
      sessionService.setSession(testPhone, {
        token: 'valid-token',
        user: { name: 'Pedro', onboardingStep: 0 },
        currentScene: 'onboarding',
        sceneStep: 0,
      });
    });

    it('deve completar onboarding em 4 steps', async () => {
      // Mocks da API
      mockApiService.updateOnboarding = jest.fn().mockResolvedValue({});
      mockApiService.createAccount = jest.fn().mockResolvedValue({ id: 'acc-1' });

      // Step 0: Nome
      mockProvider.clearSentMessages();
      await onboardingScene.handleStep({
        from: testPhone,
        body: 'Pedro Silva',
        isGroup: false,
        timestamp: Date.now(),
        hasMedia: false,
      } as WhatsAppMessage);

      expect(mockApiService.updateOnboarding).toHaveBeenCalledWith('valid-token', {
        step: 2,
        name: 'Pedro Silva',
      });

      let session = sessionService.getSession(testPhone);
      expect(session.sceneStep).toBe(1);

      // Step 1: Nome da conta
      mockProvider.clearSentMessages();
      await onboardingScene.handleStep({
        from: testPhone,
        body: 'Conta Corrente Nubank',
        isGroup: false,
        timestamp: Date.now(),
        hasMedia: false,
      } as WhatsAppMessage);

      session = sessionService.getSession(testPhone);
      expect(session.sceneStep).toBe(2);
      expect(session.sceneData?.accountName).toBe('Conta Corrente Nubank');

      // Step 2: Saldo
      mockProvider.clearSentMessages();
      await onboardingScene.handleStep({
        from: testPhone,
        body: '1500.50',
        isGroup: false,
        timestamp: Date.now(),
        hasMedia: false,
      } as WhatsAppMessage);

      expect(mockApiService.createAccount).toHaveBeenCalledWith('valid-token', {
        name: 'Conta Corrente Nubank',
        type: 'CHECKING',
        balance: 1500.5,
      });

      session = sessionService.getSession(testPhone);
      expect(session.sceneStep).toBe(3);

      // Step 3: Perfil de investidor
      mockProvider.clearSentMessages();
      await onboardingScene.handleStep({
        from: testPhone,
        body: '2', // Moderado
        isGroup: false,
        timestamp: Date.now(),
        hasMedia: false,
      } as WhatsAppMessage);

      expect(mockApiService.updateOnboarding).toHaveBeenCalledWith('valid-token', {
        step: 5,
        investorProfile: 'MODERATE',
      });

      // Deve ter finalizado
      session = sessionService.getSession(testPhone);
      expect(session.currentScene).toBeNull();
      expect(session.user?.onboardingStep).toBe(5);

      const finalMessage = mockProvider.getLastMessage();
      expect(finalMessage).toContain('Tudo Pronto');
    });

    it('deve validar nome mínimo de 2 caracteres', async () => {
      mockProvider.clearSentMessages();
      await onboardingScene.handleStep({
        from: testPhone,
        body: 'A', // Apenas 1 letra
        isGroup: false,
        timestamp: Date.now(),
        hasMedia: false,
      } as WhatsAppMessage);

      const response = mockProvider.getLastMessage();
      expect(response).toContain('mínimo 2 letras');

      // Não deve ter avançado
      const session = sessionService.getSession(testPhone);
      expect(session.sceneStep).toBe(0);
    });

    it('deve validar valor numérico do saldo', async () => {
      // Avança para step 2 (saldo)
      const session = sessionService.getSession(testPhone);
      session.sceneStep = 2;
      session.sceneData = { accountName: 'Conta Teste' };
      sessionService.setSession(testPhone, session);

      mockProvider.clearSentMessages();
      await onboardingScene.handleStep({
        from: testPhone,
        body: 'abc', // Não numérico
        isGroup: false,
        timestamp: Date.now(),
        hasMedia: false,
      } as WhatsAppMessage);

      const response = mockProvider.getLastMessage();
      expect(response).toContain('valor numérico válido');

      // Não deve ter avançado
      const sessionAfter = sessionService.getSession(testPhone);
      expect(sessionAfter.sceneStep).toBe(2);
    });

    it('deve validar opção de perfil (1-3)', async () => {
      // Avança para step 3 (perfil)
      const session = sessionService.getSession(testPhone);
      session.sceneStep = 3;
      sessionService.setSession(testPhone, session);

      mockApiService.createAccount = jest.fn().mockResolvedValue({ id: 'acc-1' });

      mockProvider.clearSentMessages();
      await onboardingScene.handleStep({
        from: testPhone,
        body: '5', // Opção inválida
        isGroup: false,
        timestamp: Date.now(),
        hasMedia: false,
      } as WhatsAppMessage);

      const response = mockProvider.getLastMessage();
      expect(response).toContain('Opção inválida');

      // Não deve ter finalizado
      const sessionAfter = sessionService.getSession(testPhone);
      expect(sessionAfter.sceneStep).toBe(3);
    });
  });
});
