/**
 * Handler de mensagens de texto (não-comandos)
 * Processa lançamento rápido de transações e navegação em scenes
 */

import { IWhatsAppProvider, WhatsAppMessage } from '../providers/IWhatsAppProvider';
import { ISessionService } from '../services/ISessionService';
import { BotApiService } from '../services/bot-api.service';
import { CurrencyUtils } from '@fayol/shared-utils';
import type { LaunchType } from '@fayol/shared-types';
import {
  detectTransactionType,
  detectFromPrefix,
  removePrefix,
  getTypeIcon,
  getTypeName,
  type TransactionType,
} from '../utils/transaction-detector';

export class MessageHandler {
  private apiService: BotApiService;

  constructor(
    private provider: IWhatsAppProvider,
    private sessionService: ISessionService
  ) {
    this.apiService = new BotApiService();
  }

  async handle(message: WhatsAppMessage): Promise<void> {
    const phoneNumber = message.from;
    const session = await Promise.resolve(this.sessionService.getSession(phoneNumber));

    // Se está em uma scene (wizard), delega para o handler de scene
    if (session.currentScene) {
      await this.handleSceneMessage(message);
      return;
    }

    // Verifica autenticação
    const isAuth = await Promise.resolve(this.sessionService.isAuthenticated(phoneNumber));
    if (!isAuth) {
      // Se não autenticado, redireciona para login
      session.currentScene = 'login';
      session.sceneStep = 0;
      await Promise.resolve(this.sessionService.setSession(phoneNumber, session));

      await this.provider.sendMessage(
        phoneNumber,
        `🤖 *Bem-vindo ao Fayol Bot!*\n\n` +
          `Seu assistente financeiro inteligente no WhatsApp.\n\n` +
          `Para começar, vou precisar de algumas informações:\n\n` +
          `📧 *Passo 1/2:* Digite seu e-mail cadastrado:`
      );
      return;
    }

    // Se autenticado, processa como lançamento rápido
    await this.handleQuickTransaction(message);
  }

  private async handleQuickTransaction(message: WhatsAppMessage): Promise<void> {
    const phoneNumber = message.from;
    const token = await Promise.resolve(this.sessionService.getToken(phoneNumber));

    if (!token) {
      // Não deveria chegar aqui, mas por segurança...
      await this.provider.sendMessage(
        phoneNumber,
        '❌ Sessão inválida. Digite /start para fazer login.'
      );
      return;
    }

    // Verifica se há transação OCR pendente de confirmação
    const session = await Promise.resolve(this.sessionService.getSession(phoneNumber));
    const pendingOCR = session.sceneData?.pendingOCRTransaction;

    if (pendingOCR) {
      const response = message.body.trim().toLowerCase();

      if (response === 'sim' || response === 's' || response === 'yes') {
        // Confirma e salva transação
        try {
          await this.apiService.createTransaction(
            token,
            pendingOCR.description,
            pendingOCR.amount,
            pendingOCR.type
          );

          const icon = getTypeIcon(pendingOCR.type as any);
          const typeName = getTypeName(pendingOCR.type as any);

          await this.provider.sendMessage(
            phoneNumber,
            `${icon} *${typeName} salva com sucesso!*\n\n` +
              `📝 Descrição: ${pendingOCR.description}\n` +
              `💵 Valor: ${CurrencyUtils.format(pendingOCR.amount)}\n` +
              `🔍 Tipo: ${typeName} (OCR)`
          );

          // Limpa transação pendente
          session.sceneData = { ...session.sceneData, pendingOCRTransaction: undefined };
          this.sessionService.setSession(phoneNumber, session);
        } catch (error: any) {
          console.error('❌ Erro ao salvar transação OCR:', error);
          await this.provider.sendMessage(
            phoneNumber,
            '❌ Erro ao salvar transação. Tente novamente.'
          );
        }
        return;
      } else if (response === 'não' || response === 'nao' || response === 'n' || response === 'no') {
        // Cancela transação
        await this.provider.sendMessage(
          phoneNumber,
          '❌ Transação cancelada.\n\n' +
            '💡 Envie outra imagem ou digite manualmente:\n' +
            '`Descrição Valor` (ex: "Almoço 45")'
        );

        // Limpa transação pendente
        session.sceneData = { ...session.sceneData, pendingOCRTransaction: undefined };
        this.sessionService.setSession(phoneNumber, session);
        return;
      }
      // Se não for SIM/NÃO, continua processamento normal abaixo
    }

    let text = message.body.trim();

    // Detecta se há prefixo (+/-) para forçar tipo
    const prefixType = detectFromPrefix(text);
    if (prefixType) {
      text = removePrefix(text);
    }

    // Regex melhorado: captura valores com vírgula ou ponto
    const numberRegex = /(\d+(?:[.,]\d{1,2})?)/;
    const match = text.match(numberRegex);

    if (!match) {
      await this.provider.sendMessage(
        phoneNumber,
        '💡 *Como usar o lançamento rápido:*\n\n' +
          '📝 Formato: `[+/-] Descrição Valor`\n\n' +
          '*Exemplos:*\n' +
          '• `Almoço 35.00` (detecta despesa)\n' +
          '• `Salário 5000` (detecta receita)\n' +
          '• `+ Freelance 800` (força receita)\n' +
          '• `- Uber 25.50` (força despesa)\n\n' +
          'Use /ajuda para ver todos os comandos.'
      );
      return;
    }

    const valueStr = match[0].replace(',', '.');
    const amount = parseFloat(valueStr);

    // Remove o valor da string para pegar a descrição
    const description = text.replace(match[0], '').trim() || 'Lançamento Rápido';

    // Determina o tipo da transação
    let transactionType: TransactionType;
    let detectionMethod: string;

    if (prefixType) {
      // Prefixo tem prioridade
      transactionType = prefixType;
      detectionMethod = 'manual (prefixo)';
    } else {
      // Detecção automática por palavras-chave
      const detection = detectTransactionType(description);
      transactionType = detection.type;
      detectionMethod = detection.matchedKeyword
        ? `automática (palavra-chave: "${detection.matchedKeyword}")`
        : 'padrão (sem palavra-chave encontrada)';
    }

    try {
      // Converte TransactionType para LaunchType (compatibilidade com tipos compartilhados)
      const launchType: LaunchType = transactionType as LaunchType;

      await this.apiService.createTransaction(token, description, amount, launchType);

      const icon = getTypeIcon(transactionType);
      const typeName = getTypeName(transactionType);

      await this.provider.sendMessage(
        phoneNumber,
        `${icon} *${typeName} salva com sucesso!*\n\n` +
          `📝 Descrição: ${description}\n` +
          `💵 Valor: ${CurrencyUtils.format(amount)}\n` +
          `🔍 Tipo: ${typeName} (${detectionMethod})`
      );
    } catch (error: any) {
      console.error('❌ Erro ao criar transação:', error);

      if (error.message?.includes('401')) {
        this.sessionService.clearSession(phoneNumber);
        await this.provider.sendMessage(
          phoneNumber,
          '❌ Sessão expirada. Digite /start para fazer login novamente.'
        );
      } else {
        await this.provider.sendMessage(
          phoneNumber,
          '❌ Erro ao salvar transação: ' + (error.message || 'Erro desconhecido')
        );
      }
    }
  }

  private async handleSceneMessage(message: WhatsAppMessage): Promise<void> {
    const phoneNumber = message.from;
    const session = await Promise.resolve(this.sessionService.getSession(phoneNumber));

    // Importa dinamicamente os handlers de scene
    if (session.currentScene === 'login') {
      const { LoginScene } = await import('../scenes/login.scene');
      const loginScene = new LoginScene(this.provider, this.sessionService as any);
      await loginScene.handleStep(message);
    } else if (session.currentScene === 'onboarding') {
      const { OnboardingScene } = await import('../scenes/onboarding.scene');
      const onboardingScene = new OnboardingScene(this.provider, this.sessionService as any);
      await onboardingScene.handleStep(message);
    }
  }
}
