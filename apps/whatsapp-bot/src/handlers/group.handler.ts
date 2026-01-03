/**
 * Handler de mensagens de grupos
 * Configurável: responde apenas quando mencionado ou em comandos diretos
 */

import { IWhatsAppProvider, WhatsAppMessage } from '../providers/IWhatsAppProvider';
import { ISessionService } from '../services/ISessionService';

export class GroupHandler {
  private botPhoneNumber?: string;

  constructor(
    private provider: IWhatsAppProvider,
    private sessionService: ISessionService
  ) {
    // Obtém número do bot para detectar menções
    this.initializeBotInfo();
  }

  private async initializeBotInfo(): Promise<void> {
    try {
      const botInfo = await this.provider.getBotInfo();
      this.botPhoneNumber = botInfo.phoneNumber;
    } catch (error) {
      console.error('⚠️ Erro ao obter informações do bot:', error);
    }
  }

  async handle(message: WhatsAppMessage): Promise<void> {
    const groupName = message.groupName || 'Grupo';

    // Configuração: responde apenas se mencionado ou comando direto
    const shouldRespond = this.shouldRespondToMessage(message);

    if (!shouldRespond) {
      // Ignora silenciosamente
      console.log(`ℹ️ Mensagem ignorada do grupo "${groupName}" (não mencionado)`);
      return;
    }

    // Se foi mencionado ou é comando, processa normalmente
    if (message.body.startsWith('/')) {
      await this.handleGroupCommand(message);
    } else {
      await this.handleGroupMention(message);
    }
  }

  /**
   * Decide se o bot deve responder à mensagem do grupo
   */
  private shouldRespondToMessage(message: WhatsAppMessage): boolean {
    const text = message.body.toLowerCase();

    // Sempre responde a comandos
    if (text.startsWith('/')) {
      return true;
    }

    // Verifica se foi mencionado
    if (this.botPhoneNumber && text.includes(this.botPhoneNumber)) {
      return true;
    }

    // Palavras-chave que ativam o bot
    const activationKeywords = ['fayol', 'bot', '@bot'];
    const wasMentioned = activationKeywords.some((keyword) => text.includes(keyword));

    return wasMentioned;
  }

  /**
   * Processa comandos enviados no grupo
   */
  private async handleGroupCommand(message: WhatsAppMessage): Promise<void> {
    const command = message.body.toLowerCase().split(' ')[0];
    const groupName = message.groupName || 'Grupo';

    // Apenas comandos informativos são permitidos em grupos
    const allowedCommands = ['/start', '/help', '/ajuda', '/exemplos', '/dicas'];

    if (!allowedCommands.includes(command)) {
      await this.provider.sendMessage(
        message.from,
        `⚠️ *Uso em Grupo Limitado*\n\n` +
          `Por questões de privacidade, comandos financeiros não são permitidos em grupos.\n\n` +
          `💡 *Fale comigo no privado para:*\n` +
          `• Ver seu saldo e extratos\n` +
          `• Registrar transações\n` +
          `• Gerar relatórios\n\n` +
          `*Comandos permitidos aqui:*\n` +
          `/help - Ver ajuda\n` +
          `/exemplos - Ver exemplos de uso\n` +
          `/dicas - Dicas do bot`
      );
      return;
    }

    // Responde com informações gerais
    switch (command) {
      case '/start':
      case '/help':
      case '/ajuda':
        await this.sendGroupHelp(message.from);
        break;

      case '/exemplos':
        await this.sendGroupExamples(message.from);
        break;

      case '/dicas':
        await this.sendGroupTips(message.from);
        break;
    }
  }

  /**
   * Responde quando mencionado no grupo
   */
  private async handleGroupMention(message: WhatsAppMessage): Promise<void> {
    const groupName = message.groupName || 'Grupo';

    await this.provider.sendMessage(
      message.from,
      `👋 Olá! Sou o *Fayol Bot*, assistente financeiro.\n\n` +
        `🔒 Por privacidade, não posso processar transações aqui no grupo "${groupName}".\n\n` +
        `💬 *Fale comigo no privado* para:\n` +
        `• Consultar saldo e extratos\n` +
        `• Registrar receitas e despesas\n` +
        `• Gerar relatórios e insights\n\n` +
        `📱 Adicione-me aos seus contatos e envie uma mensagem!\n\n` +
        `Use /help para ver o que posso fazer.`
    );
  }

  private async sendGroupHelp(groupJid: string): Promise<void> {
    await this.provider.sendMessage(
      groupJid,
      `🤖 *Fayol Bot - Ajuda*\n\n` +
        `Sou seu assistente financeiro pessoal!\n\n` +
        `🔒 *Privacidade em Primeiro Lugar*\n` +
        `Por segurança, comandos financeiros só funcionam em conversas privadas.\n\n` +
        `💬 *Como usar:*\n` +
        `1. Adicione-me aos seus contatos\n` +
        `2. Envie /start no privado\n` +
        `3. Faça login com sua conta Fayol\n` +
        `4. Comece a gerenciar suas finanças!\n\n` +
        `📚 Use /exemplos para ver casos de uso`
    );
  }

  private async sendGroupExamples(groupJid: string): Promise<void> {
    await this.provider.sendMessage(
      groupJid,
      `📚 *Exemplos de Uso (no privado)*\n\n` +
        `💰 *Lançamento Rápido:*\n` +
        `• "Salário 5000" → Receita\n` +
        `• "Almoço 45" → Despesa\n` +
        `• "+ Freelance 800" → Força receita\n\n` +
        `📊 *Consultas:*\n` +
        `/saldo - Ver resumo financeiro\n` +
        `/extrato - Últimas transações\n` +
        `/categorias - Gastos organizados\n\n` +
        `📄 *Relatórios:*\n` +
        `/relatorio - Baixar PDF\n` +
        `/excel - Exportar planilha\n\n` +
        `💬 Fale comigo no privado para começar!`
    );
  }

  private async sendGroupTips(groupJid: string): Promise<void> {
    await this.provider.sendMessage(
      groupJid,
      `💡 *Dicas do Fayol Bot*\n\n` +
        `🚀 *Lançamento Rápido:*\n` +
        `Digite "Descrição + Valor" e o bot detecta automaticamente o tipo!\n\n` +
        `🎯 *Detecção Inteligente:*\n` +
        `Reconhece 90+ palavras-chave como "salário", "almoço", "uber", etc.\n\n` +
        `✨ *Use Prefixos:*\n` +
        `+ para forçar receita\n` +
        `- para forçar despesa\n\n` +
        `📱 *Privacidade:*\n` +
        `Todas as funções financeiras são EXCLUSIVAS de conversas privadas.\n\n` +
        `Adicione-me e envie /start!`
    );
  }
}
