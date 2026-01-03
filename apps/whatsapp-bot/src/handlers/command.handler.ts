/**
 * Handler de comandos do WhatsApp Bot
 * Adaptado de apps/telegram-bot/src/main.ts
 */

import { IWhatsAppProvider, WhatsAppMessage } from '../providers/IWhatsAppProvider';
import { ISessionService } from '../services/ISessionService';
import { BotApiService } from '../services/bot-api.service';
import { CurrencyUtils, DateUtils } from '@fayol/shared-utils';
import type { Transaction } from '@fayol/shared-types';

export class CommandHandler {
  private apiService: BotApiService;

  constructor(
    private provider: IWhatsAppProvider,
    private sessionService: ISessionService
  ) {
    this.apiService = new BotApiService();
  }

  async handle(message: WhatsAppMessage): Promise<void> {
    const command = message.body.toLowerCase().split(' ')[0];
    const phoneNumber = message.from;

    // Comandos que não requerem autenticação
    if (command === '/start') {
      return this.handleStart(phoneNumber);
    }

    // Todos os outros comandos requerem autenticação
    const token = await Promise.resolve(this.sessionService.getToken(phoneNumber));
    if (!token) {
      await this.provider.sendMessage(
        phoneNumber,
        '❌ Você precisa fazer login primeiro.\n\nDigite /start para começar.'
      );
      return;
    }

    // Roteamento de comandos
    switch (command) {
      case '/help':
      case '/ajuda':
        await this.handleHelp(phoneNumber);
        break;

      case '/saldo':
        await this.handleBalance(phoneNumber, token);
        break;

      case '/extrato':
        await this.handleStatement(phoneNumber, token);
        break;

      case '/categorias':
      case '/gastos':
        await this.handleCategories(phoneNumber, token);
        break;

      case '/insights':
        await this.handleInsights(phoneNumber, token);
        break;

      case '/relatorio':
        await this.handleReport(phoneNumber, token);
        break;

      case '/excel':
        await this.handleExcel(phoneNumber, token);
        break;

      case '/receita':
        await this.handleIncomePrompt(phoneNumber);
        break;

      case '/despesa':
        await this.handleExpensePrompt(phoneNumber);
        break;

      case '/exemplos':
        await this.handleExamples(phoneNumber);
        break;

      case '/dicas':
        await this.handleTips(phoneNumber);
        break;

      case '/logout':
        await this.handleLogout(phoneNumber);
        break;

      default:
        await this.provider.sendMessage(
          phoneNumber,
          '❓ Comando não reconhecido.\n\nDigite /ajuda para ver todos os comandos disponíveis.'
        );
    }
  }

  private async handleStart(phoneNumber: string): Promise<void> {
    const isAuthenticated = await Promise.resolve(this.sessionService.isAuthenticated(phoneNumber));

    if (isAuthenticated) {
      const session = await Promise.resolve(this.sessionService.getSession(phoneNumber));
      const userName = session.user?.name || 'Investidor';

      await this.provider.sendMessage(
        phoneNumber,
        `Olá de volta, ${userName}! 👋\n\n` +
          `*Painel Principal:*\n` +
          `💰 /saldo - Resumo financeiro\n` +
          `📄 /extrato - Últimas transações\n` +
          `📊 /categorias - Gastos por categoria\n` +
          `💡 /insights - Dicas da IA\n\n` +
          `✨ *Novo! Detecção Inteligente:*\n` +
          `Digite descrição + valor e o bot detecta automaticamente se é receita ou despesa!\n\n` +
          `*Exemplos:*\n` +
          `• "Salário 5000" → 💰 Receita\n` +
          `• "Almoço 45" → 💸 Despesa\n` +
          `• "+ Freelance 800" → 💰 Receita (forçado)\n\n` +
          `Digite /ajuda para ver todos os comandos.`
      );
    } else {
      // Inicia wizard de login
      const session = await Promise.resolve(this.sessionService.getSession(phoneNumber));
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
    }
  }

  private async handleHelp(phoneNumber: string): Promise<void> {
    await this.provider.sendMessage(
      phoneNumber,
      `🤖 *Central de Ajuda - Fayol Bot*\n\n` +
        `Olá! Sou seu assistente financeiro inteligente. Veja como posso te ajudar:\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `💰 *CONSULTAR SUAS FINANÇAS*\n` +
        `/saldo - Ver saldo e resumo mensal\n` +
        `/extrato - Últimas 5 movimentações\n` +
        `/categorias - Seus gastos organizados\n` +
        `/insights - Análise inteligente com IA\n\n` +
        `📝 *REGISTRAR TRANSAÇÕES*\n` +
        `/receita - Adicionar uma receita\n` +
        `/despesa - Adicionar uma despesa\n\n` +
        `✨ *LANÇAMENTO RÁPIDO*\n` +
        `Simplesmente digite a descrição e valor:\n` +
        `• "Salário 5000" (detecta receita)\n` +
        `• "Almoço 35" (detecta despesa)\n` +
        `• "+ Venda 500" (força receita)\n` +
        `• "- Uber 28" (força despesa)\n\n` +
        `📄 *RELATÓRIOS*\n` +
        `/relatorio - Baixar PDF do mês\n` +
        `/excel - Exportar planilha Excel\n\n` +
        `❓ *MAIS AJUDA*\n` +
        `/exemplos - Ver mais exemplos práticos\n` +
        `/dicas - Dicas para usar melhor o bot\n\n` +
        `⚙️ *CONFIGURAÇÕES*\n` +
        `/logout - Sair da sua conta\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `💡 *Dica:* O bot detecta automaticamente se é receita ou despesa baseado nas palavras que você usa!`
    );
  }

  private async handleBalance(phoneNumber: string, token: string): Promise<void> {
    try {
      const data = await this.apiService.getDashboardSummary(token);
      const { totalBalance, periodSummary } = data;

      const resultIcon = periodSummary.result >= 0 ? '🟢' : '🔴';

      const msg =
        `💰 *Saldo Atual:* ${CurrencyUtils.format(totalBalance)}\n\n` +
        `📅 *Resumo do Mês:*\n` +
        `📈 Receitas: ${CurrencyUtils.format(periodSummary.income)}\n` +
        `💸 Despesas: ${CurrencyUtils.format(periodSummary.expense)}\n` +
        `───────────────\n` +
        `${resultIcon} Resultado: ${CurrencyUtils.format(periodSummary.result)}`;

      await this.provider.sendMessage(phoneNumber, msg);
    } catch (error: any) {
      console.error('❌ Erro ao buscar saldo:', error);

      if (error.message?.includes('401')) {
        this.sessionService.clearSession(phoneNumber);
        await this.provider.sendMessage(
          phoneNumber,
          '❌ Sessão expirada. Digite /start para fazer login novamente.'
        );
      } else {
        await this.provider.sendMessage(
          phoneNumber,
          '❌ Erro ao buscar saldo. Tente novamente mais tarde.'
        );
      }
    }
  }

  private async handleStatement(phoneNumber: string, token: string): Promise<void> {
    try {
      const transactions: Transaction[] = await this.apiService.getLastTransactions(token, 5);

      if (!transactions.length) {
        await this.provider.sendMessage(phoneNumber, 'Sem transações recentes.');
        return;
      }

      let msg = `📄 *Últimas 5 Transações*\n\n`;

      transactions.forEach((t) => {
        const icon = t.type === 'INCOME' ? '💰' : '💸';
        const date = DateUtils.formatDate(new Date(t.date));
        const shortDate = date.substring(0, 5); // dd/MM
        msg += `${icon} *${t.description}*\n   ${CurrencyUtils.format(Number(t.amount))}  •  ${shortDate}\n\n`;
      });

      await this.provider.sendMessage(phoneNumber, msg);
    } catch (error: any) {
      console.error('❌ Erro ao buscar extrato:', error);

      if (error.message?.includes('401')) {
        this.sessionService.clearSession(phoneNumber);
        await this.provider.sendMessage(
          phoneNumber,
          '❌ Sessão expirada. Digite /start para fazer login novamente.'
        );
      } else {
        await this.provider.sendMessage(phoneNumber, '❌ Erro ao buscar extrato.');
      }
    }
  }

  private async handleCategories(phoneNumber: string, token: string): Promise<void> {
    try {
      const categories = await this.apiService.getExpensesByCategory(token);

      if (!categories || categories.length === 0) {
        await this.provider.sendMessage(
          phoneNumber,
          'Nenhum gasto categorizado neste mês.'
        );
        return;
      }

      const total = categories.reduce((acc, curr) => acc + Number(curr.amount), 0);

      let msg = `📊 *Gastos por Categoria (Top 5)*\n\n`;

      categories.slice(0, 5).forEach((cat) => {
        const percent = ((Number(cat.amount) / total) * 100).toFixed(0);
        const bar = '█'.repeat(Math.ceil(Number(percent) / 10)); // Gráfico simples em texto

        msg += `${cat.icon || '🏷️'} *${cat.name}* (${percent}%)\n`;
        msg += `${bar} ${CurrencyUtils.format(Number(cat.amount))}\n\n`;
      });

      await this.provider.sendMessage(phoneNumber, msg);
    } catch (error: any) {
      console.error('❌ Erro ao buscar categorias:', error);

      if (error.message?.includes('401')) {
        this.sessionService.clearSession(phoneNumber);
        await this.provider.sendMessage(
          phoneNumber,
          '❌ Sessão expirada. Digite /start para fazer login novamente.'
        );
      } else {
        await this.provider.sendMessage(phoneNumber, '❌ Erro ao buscar categorias.');
      }
    }
  }

  private async handleInsights(phoneNumber: string, token: string): Promise<void> {
    try {
      const insights = await this.apiService.getInsights(token);

      if (!insights || insights.length === 0) {
        await this.provider.sendMessage(
          phoneNumber,
          '🤖 A IA ainda está analisando seus dados. Volte mais tarde!'
        );
        return;
      }

      let msg = `💡 *Insights da IA Fayol*\n\n`;

      insights.forEach((insight) => {
        const icon = insight.type === 'warning' ? '⚠️' : insight.type === 'success' ? '✅' : 'ℹ️';
        msg += `${icon} ${insight.text}\n\n`;
      });

      await this.provider.sendMessage(phoneNumber, msg);
    } catch (error: any) {
      console.error('❌ Erro ao gerar insights:', error);

      if (error.message?.includes('401')) {
        this.sessionService.clearSession(phoneNumber);
        await this.provider.sendMessage(
          phoneNumber,
          '❌ Sessão expirada. Digite /start para fazer login novamente.'
        );
      } else {
        await this.provider.sendMessage(phoneNumber, '❌ Erro ao gerar insights.');
      }
    }
  }

  private async handleReport(phoneNumber: string, token: string): Promise<void> {
    try {
      await this.provider.sendMessage(
        phoneNumber,
        '📄 Gerando seu relatório mensal em PDF. Aguarde um momento...'
      );

      const pdfBuffer = await this.apiService.downloadReport(token, 'PDF');

      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `Relatorio_Fayol_${dateStr}.pdf`;

      await this.provider.sendMedia({
        to: phoneNumber,
        mediaBuffer: Buffer.from(pdfBuffer),
        mediaType: 'document',
        fileName: filename,
        caption: '📄 Aqui está o seu relatório mensal consolidado.',
      });
    } catch (error: any) {
      console.error('❌ Erro ao gerar relatório:', error);

      if (error.message?.includes('401')) {
        this.sessionService.clearSession(phoneNumber);
        await this.provider.sendMessage(
          phoneNumber,
          '❌ Sessão expirada. Digite /start para fazer login novamente.'
        );
      } else {
        await this.provider.sendMessage(
          phoneNumber,
          '❌ Ocorreu um erro ao gerar o relatório. Tente novamente mais tarde.'
        );
      }
    }
  }

  private async handleExcel(phoneNumber: string, token: string): Promise<void> {
    try {
      await this.provider.sendMessage(
        phoneNumber,
        '📊 Gerando planilha de transações...'
      );

      const excelBuffer = await this.apiService.downloadReport(token, 'EXCEL');
      const dateStr = new Date().toISOString().slice(0, 10);

      await this.provider.sendMedia({
        to: phoneNumber,
        mediaBuffer: Buffer.from(excelBuffer),
        mediaType: 'document',
        fileName: `Extrato_Fayol_${dateStr}.xlsx`,
      });
    } catch (error: any) {
      console.error('❌ Erro ao gerar planilha:', error);

      if (error.message?.includes('401')) {
        this.sessionService.clearSession(phoneNumber);
        await this.provider.sendMessage(
          phoneNumber,
          '❌ Sessão expirada. Digite /start para fazer login novamente.'
        );
      } else {
        await this.provider.sendMessage(phoneNumber, '❌ Erro ao gerar planilha.');
      }
    }
  }

  private async handleIncomePrompt(phoneNumber: string): Promise<void> {
    await this.provider.sendMessage(
      phoneNumber,
      '💰 *Adicionar Receita*\n\n' +
        'Digite a descrição e o valor da receita:\n\n' +
        '*Exemplos:*\n' +
        '• `Salário 5000`\n' +
        '• `Freelance 1500`\n' +
        '• `Venda 350.50`'
    );
  }

  private async handleExpensePrompt(phoneNumber: string): Promise<void> {
    await this.provider.sendMessage(
      phoneNumber,
      '💸 *Adicionar Despesa*\n\n' +
        'Digite a descrição e o valor da despesa:\n\n' +
        '*Exemplos:*\n' +
        '• `Almoço 45`\n' +
        '• `Uber 28.50`\n' +
        '• `Mercado 235.90`'
    );
  }

  private async handleExamples(phoneNumber: string): Promise<void> {
    await this.provider.sendMessage(
      phoneNumber,
      `📚 *Exemplos Práticos de Uso*\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `💰 *RECEITAS (detectadas automaticamente):*\n\n` +
        `✅ "Salário 5000"\n` +
        `✅ "Freelance projeto web 1500"\n` +
        `✅ "Venda notebook 2800"\n` +
        `✅ "Pagamento cliente 950"\n` +
        `✅ "Bônus empresa 800"\n` +
        `✅ "Dividendos ações 250.50"\n` +
        `✅ "Reembolso despesas 180"\n` +
        `✅ "Prêmio loteria 500"\n\n` +
        `💸 *DESPESAS (detectadas automaticamente):*\n\n` +
        `✅ "Almoço restaurante 45"\n` +
        `✅ "Uber para casa 28.50"\n` +
        `✅ "Mercado supermercado 235.90"\n` +
        `✅ "Gasolina 180"\n` +
        `✅ "Netflix 39.90"\n` +
        `✅ "Conta de luz 150"\n` +
        `✅ "Farmácia remédios 85.50"\n` +
        `✅ "Cinema 40"\n` +
        `✅ "Pizza delivery 65"\n` +
        `✅ "Academia mensalidade 99"\n\n` +
        `✨ *USANDO PREFIXOS (forçar tipo):*\n\n` +
        `➕ "+ Presente recebido 200" (força receita)\n` +
        `➕ "+ Estorno cartão 89.90" (força receita)\n` +
        `➖ "- Compra online 450" (força despesa)\n` +
        `➖ "- Pagamento boleto 320" (força despesa)\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `💡 *Lembre-se:* Você pode usar vírgula ou ponto para decimais:\n` +
        `• "Almoço 35,50" ✅\n` +
        `• "Almoço 35.50" ✅`
    );
  }

  private async handleTips(phoneNumber: string): Promise<void> {
    await this.provider.sendMessage(
      phoneNumber,
      `💡 *Dicas para Usar Melhor o Fayol Bot*\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🎯 *DICA 1: Seja Específico na Descrição*\n` +
        `Quanto mais detalhada a descrição, melhor!\n` +
        `❌ "Compra 150"\n` +
        `✅ "Mercado supermercado 150"\n\n` +
        `🎯 *DICA 2: Use Palavras-chave Conhecidas*\n` +
        `O bot reconhece mais de 90 palavras!\n` +
        `• Receitas: salário, freelance, venda, bônus\n` +
        `• Despesas: almoço, uber, mercado, conta\n\n` +
        `🎯 *DICA 3: Prefixos para Casos Ambíguos*\n` +
        `Se o bot errar, use + ou - para corrigir:\n` +
        `"+ Estorno 50" (força receita)\n` +
        `"- Pagamento 100" (força despesa)\n\n` +
        `🎯 *DICA 4: Consulte Regularmente*\n` +
        `Use /saldo diariamente para acompanhar\n` +
        `Use /categorias para ver onde está gastando\n` +
        `Use /insights para dicas da IA\n\n` +
        `🎯 *DICA 5: Exporte Seus Dados*\n` +
        `Use /relatorio para PDF completo\n` +
        `Use /excel para análise em planilhas\n\n` +
        `🎯 *DICA 6: Registre no Momento*\n` +
        `Quanto mais rápido registrar, menos esquece!\n` +
        `O bot foi feito para ser RÁPIDO 🚀\n\n` +
        `🎯 *DICA 7: Formatos Flexíveis*\n` +
        `Todos funcionam igualmente:\n` +
        `• "Almoço 35,50"\n` +
        `• "Almoço 35.50"\n` +
        `• "35.50 Almoço"\n` +
        `• "35,50 Almoço"\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📱 Use /exemplos para ver mais casos práticos!`
    );
  }

  private async handleLogout(phoneNumber: string): Promise<void> {
    this.sessionService.clearSession(phoneNumber);
    await this.provider.sendMessage(
      phoneNumber,
      '👋 Desconectado. Digite /start para entrar novamente.'
    );
  }
}
