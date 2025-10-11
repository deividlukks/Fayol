import { IWhatsAppProvider, IWhatsAppMessage } from '../core/interfaces/whatsapp-provider.interface';
import { MessageType } from '../core/enums/message-type.enum';
import { ApiService } from '../services/api.service';
import { logger } from '../utils/logger';

/**
 * Handler principal de mensagens recebidas
 * 
 * Processa diferentes tipos de mensagens:
 * - Texto: Parser inteligente
 * - Áudio: Transcrição com Whisper
 * - Imagem: OCR para notas fiscais
 * - Comandos: /start, /help, etc
 */
export class MessageHandler {
  private apiService: ApiService;

  constructor() {
    this.apiService = new ApiService();
  }

  /**
   * Handler principal - roteia mensagem para handler específico
   */
  async handle(message: IWhatsAppMessage, provider: IWhatsAppProvider): Promise<void> {
    try {
      logger.info(`[MessageHandler] Processando mensagem de ${message.from}`);

      // Envia indicador "digitando..."
      await provider.sendTyping(message.from);

      // Roteamento baseado no tipo de mensagem
      switch (message.type) {
        case MessageType.TEXT:
          await this.handleTextMessage(message, provider);
          break;

        case MessageType.AUDIO:
          await this.handleAudioMessage(message, provider);
          break;

        case MessageType.IMAGE:
          await this.handleImageMessage(message, provider);
          break;

        default:
          await provider.sendTextMessage(
            message.from,
            '⚠️ Tipo de mensagem não suportado. Use texto, áudio ou imagem.'
          );
      }

      // Para indicador "digitando..."
      await provider.stopTyping(message.from);
    } catch (error) {
      logger.error('[MessageHandler] Erro ao processar mensagem:', error);
      
      await provider.sendTextMessage(
        message.from,
        '❌ Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.'
      );
    }
  }

  /**
   * Processa mensagens de texto
   */
  private async handleTextMessage(
    message: IWhatsAppMessage,
    provider: IWhatsAppProvider
  ): Promise<void> {
    const text = message.body?.trim();

    if (!text) {
      return;
    }

    // Comandos começam com /
    if (text.startsWith('/')) {
      await this.handleCommand(text, message.from, provider);
      return;
    }

    // Mensagem livre - tenta parser de transação
    await this.handleFreeTextTransaction(text, message.from, provider);
  }

  /**
   * Processa comandos
   */
  private async handleCommand(
    command: string,
    from: string,
    provider: IWhatsAppProvider
  ): Promise<void> {
    const [cmd, ...args] = command.toLowerCase().split(' ');

    switch (cmd) {
      case '/start':
        await this.handleStartCommand(from, provider);
        break;

      case '/help':
      case '/ajuda':
        await this.handleHelpCommand(from, provider);
        break;

      case '/saldo':
        await this.handleBalanceCommand(from, provider);
        break;

      case '/extrato':
        await this.handleStatementCommand(from, provider);
        break;

      case '/relatorio':
        await this.handleReportCommand(from, provider);
        break;

      case '/categorias':
        await this.handleCategoriesCommand(from, provider);
        break;

      default:
        await provider.sendTextMessage(
          from,
          `❓ Comando desconhecido: ${cmd}\n\nDigite /ajuda para ver os comandos disponíveis.`
        );
    }
  }

  /**
   * Comando /start
   */
  private async handleStartCommand(from: string, provider: IWhatsAppProvider): Promise<void> {
    const welcomeMessage = `
🤖 *Bem-vindo ao Fayol!*

Sou seu assistente financeiro pessoal. Estou aqui para ajudar você a gerenciar suas finanças de forma simples e eficiente.

📱 *Como usar:*

*1️⃣ Adicionar Transação*
Envie mensagens naturais como:
• "Gastei 50 reais no almoço"
• "Recebi salário de 3000"
• "Paguei conta de luz 150"

*2️⃣ Comandos Úteis*
• /saldo - Consultar saldo
• /extrato - Últimas transações
• /relatorio - Relatório mensal
• /categorias - Ver categorias

*3️⃣ Outras Formas*
📸 Envie foto da nota fiscal
🎤 Grave áudio descrevendo o gasto

Digite /ajuda para mais informações.

Vamos começar? 🚀
    `.trim();

    await provider.sendTextMessage(from, welcomeMessage);
  }

  /**
   * Comando /help
   */
  private async handleHelpCommand(from: string, provider: IWhatsAppProvider): Promise<void> {
    const helpMessage = `
📚 *Central de Ajuda - Fayol*

*💰 TRANSAÇÕES*
• Texto livre: "Gastei 25 no uber"
• Foto: Envie imagem da nota fiscal
• Áudio: Grave descrição do gasto

*📊 CONSULTAS*
• /saldo - Saldo atual
• /extrato - Últimas 10 transações
• /relatorio - Relatório do mês

*📋 CATEGORIAS*
• /categorias - Listar categorias

*⚙️ CONFIGURAÇÕES*
• /contas - Ver suas contas
• /perfil - Dados pessoais

*❓ SUPORTE*
• /ajuda - Esta mensagem
• /contato - Falar com suporte

Precisa de ajuda? Estou sempre aqui! 😊
    `.trim();

    await provider.sendTextMessage(from, helpMessage);
  }

  /**
   * Comando /saldo
   */
  private async handleBalanceCommand(from: string, provider: IWhatsAppProvider): Promise<void> {
    try {
      const balance = await this.apiService.getBalance();

      let message = `💰 *Saldo Total*\n\nR$ ${balance.total.toFixed(2)}\n\n`;
      message += '*Por Conta:*\n';

      balance.accounts.forEach((account) => {
        message += `• ${account.name}: R$ ${account.balance.toFixed(2)}\n`;
      });

      await provider.sendTextMessage(from, message);
    } catch (error) {
      logger.error('[MessageHandler] Erro ao buscar saldo:', error);
      await provider.sendTextMessage(
        from,
        '❌ Não foi possível buscar seu saldo. Tente novamente mais tarde.'
      );
    }
  }

  /**
   * Comando /extrato
   */
  private async handleStatementCommand(
    from: string,
    provider: IWhatsAppProvider
  ): Promise<void> {
    try {
      const transactions = await this.apiService.getLatestTransactions(10);

      if (transactions.length === 0) {
        await provider.sendTextMessage(
          from,
          '📋 Você ainda não possui transações registradas.\n\nComece adicionando seu primeiro gasto!'
        );
        return;
      }

      let message = `📋 *Últimas Transações*\n\n`;

      transactions.forEach((tx: any, index: number) => {
        const icon = tx.movementType === 'income' ? '📈' : '📉';
        const sign = tx.movementType === 'income' ? '+' : '-';
        
        message += `${icon} ${tx.description || 'Sem descrição'}\n`;
        message += `   ${sign}R$ ${tx.amount.toFixed(2)}\n`;
        message += `   ${new Date(tx.createdAt).toLocaleDateString('pt-BR')}\n\n`;
      });

      await provider.sendTextMessage(from, message);
    } catch (error) {
      logger.error('[MessageHandler] Erro ao buscar extrato:', error);
      await provider.sendTextMessage(
        from,
        '❌ Não foi possível buscar seu extrato. Tente novamente.'
      );
    }
  }

  /**
   * Comando /relatorio
   */
  private async handleReportCommand(from: string, provider: IWhatsAppProvider): Promise<void> {
    try {
      const report = await this.apiService.getMonthlyReport();

      let message = `📊 *Relatório Mensal*\n\n`;
      message += `💵 Receitas: R$ ${report.summary.totalIncome.toFixed(2)}\n`;
      message += `💸 Despesas: R$ ${report.summary.totalExpense.toFixed(2)}\n`;
      message += `💰 Saldo: R$ ${report.summary.netBalance.toFixed(2)}\n\n`;

      if (report.topExpenseCategory) {
        message += `🏆 *Maior Gasto*\n`;
        message += `${report.topExpenseCategory.name}: R$ ${report.topExpenseCategory.amount.toFixed(2)}\n`;
      }

      await provider.sendTextMessage(from, message);
    } catch (error) {
      logger.error('[MessageHandler] Erro ao gerar relatório:', error);
      await provider.sendTextMessage(
        from,
        '❌ Não foi possível gerar o relatório. Tente novamente.'
      );
    }
  }

  /**
   * Comando /categorias
   */
  private async handleCategoriesCommand(
    from: string,
    provider: IWhatsAppProvider
  ): Promise<void> {
    try {
      const categories = await this.apiService.getCategories();

      let message = `📁 *Categorias Disponíveis*\n\n`;

      // Agrupa por tipo
      const byType: Record<string, any[]> = {
        income: [],
        expense: [],
        investment: [],
      };

      categories.forEach((cat: any) => {
        byType[cat.type].push(cat);
      });

      // Receitas
      if (byType.income.length > 0) {
        message += `*💵 RECEITAS*\n`;
        byType.income.forEach((cat: any) => {
          message += `• ${cat.name}\n`;
        });
        message += '\n';
      }

      // Despesas
      if (byType.expense.length > 0) {
        message += `*💸 DESPESAS*\n`;
        byType.expense.forEach((cat: any) => {
          message += `• ${cat.name}\n`;
        });
        message += '\n';
      }

      // Investimentos
      if (byType.investment.length > 0) {
        message += `*📈 INVESTIMENTOS*\n`;
        byType.investment.forEach((cat: any) => {
          message += `• ${cat.name}\n`;
        });
      }

      await provider.sendTextMessage(from, message);
    } catch (error) {
      logger.error('[MessageHandler] Erro ao listar categorias:', error);
      await provider.sendTextMessage(
        from,
        '❌ Não foi possível listar as categorias. Tente novamente.'
      );
    }
  }

  /**
   * Processa texto livre como possível transação
   */
  private async handleFreeTextTransaction(
    text: string,
    from: string,
    provider: IWhatsAppProvider
  ): Promise<void> {
    // Parser simples (pode ser melhorado com IA)
    const parsed = this.parseTransactionText(text);

    if (!parsed) {
      await provider.sendTextMessage(
        from,
        '🤔 Não consegui entender. Tente algo como:\n\n"Gastei 50 reais no supermercado"\n"Recebi salário de 3000"'
      );
      return;
    }

    // Sugere categoria com IA
    try {
      const suggestion = await this.apiService.suggestCategory(parsed.description);

      // Aqui você pode implementar confirmação interativa
      // Por enquanto, cria a transação diretamente

      await provider.sendTextMessage(
        from,
        `✅ Entendi!\n\n💰 Valor: R$ ${parsed.amount.toFixed(2)}\n📝 ${parsed.description}\n📁 Categoria: ${suggestion.category}\n\n⏳ Criando transação...`
      );

      // TODO: Implementar criação de transação
      // Precisa obter accountId do usuário

    } catch (error) {
      logger.error('[MessageHandler] Erro ao processar transação:', error);
      await provider.sendTextMessage(
        from,
        '❌ Erro ao processar transação. Tente novamente.'
      );
    }
  }

  /**
   * Parser básico de texto para transação
   */
  private parseTransactionText(text: string): {
    amount: number;
    description: string;
    type: 'income' | 'expense';
  } | null {
    // Regex para capturar valor
    const valueRegex = /(?:R\$\s*)?(\d+(?:[.,]\d{1,2})?)/;
    const match = text.match(valueRegex);

    if (!match) {
      return null;
    }

    const amount = parseFloat(match[1].replace(',', '.'));

    // Determina tipo (receita ou despesa)
    const incomeKeywords = ['recebi', 'ganhei', 'salário', 'salario', 'recebimento'];
    const isIncome = incomeKeywords.some((keyword) =>
      text.toLowerCase().includes(keyword)
    );

    // Remove o valor do texto para obter descrição
    const description = text.replace(valueRegex, '').trim();

    return {
      amount,
      description: description || 'Sem descrição',
      type: isIncome ? 'income' : 'expense',
    };
  }

  /**
   * Processa mensagem de áudio
   */
  private async handleAudioMessage(
    message: IWhatsAppMessage,
    provider: IWhatsAppProvider
  ): Promise<void> {
    await provider.sendTextMessage(
      message.from,
      '🎤 Transcrição de áudio ainda não implementada.\n\nPor enquanto, use texto ou imagem.'
    );

    // TODO: Implementar transcrição com OpenAI Whisper
    // 1. Baixar áudio: await provider.downloadMedia(message.id)
    // 2. Converter para formato aceito (.mp3, .wav)
    // 3. Enviar para OpenAI Whisper API
    // 4. Processar texto transcrito
  }

  /**
   * Processa mensagem de imagem (nota fiscal)
   */
  private async handleImageMessage(
    message: IWhatsAppMessage,
    provider: IWhatsAppProvider
  ): Promise<void> {
    await provider.sendTextMessage(
      message.from,
      '📸 OCR de nota fiscal ainda não implementado.\n\nPor enquanto, use texto descrevendo o gasto.'
    );

    // TODO: Implementar OCR
    // 1. Baixar imagem: await provider.downloadMedia(message.id)
    // 2. Processar com Tesseract.js ou Google Vision API
    // 3. Extrair: valor, estabelecimento, data
    // 4. Criar transação
  }
}
