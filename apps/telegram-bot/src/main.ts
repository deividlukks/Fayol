import { Telegraf, session, Scenes } from 'telegraf';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { BotApiService } from './services/bot-api.service';
import { CurrencyUtils, DateUtils } from '@fayol/shared-utils';
import type { LaunchType, Transaction } from '@fayol/shared-types';
import { loginWizard } from './scenes/login.scene';
import { onboardingWizard } from './scenes/onboarding.scene';
import { message } from 'telegraf/filters';
import {
  detectTransactionType,
  detectFromPrefix,
  removePrefix,
  getTypeIcon,
  getTypeName,
  type TransactionType,
} from './utils/transaction-detector';

// Carrega .env da raiz do monorepo
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

interface MySession extends Scenes.WizardSession {
  token?: string;
  user?: { name: string; onboardingStep?: number };
}

interface MyContext extends Scenes.WizardContext {
  session: MySession;
}

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_BOT_TOKEN ausente no .env');

const bot = new Telegraf<MyContext>(token);
const apiService = new BotApiService();

// Configura Cenas (Wizard)
const stage = new Scenes.Stage<MyContext>([loginWizard, onboardingWizard]);

bot.use(session());
bot.use(stage.middleware());

// Middleware de Autenticação Automática
bot.use(async (ctx, next) => {
  // Se não estiver logado...
  if (!ctx.session.token) {
    // Permite o comando /start sem login para iniciar o fluxo
    if (ctx.message && 'text' in ctx.message && ctx.message.text === '/start') {
      return next();
    }

    // Se já estiver na cena de login ou onboarding, deixa fluir
    const currentScene = ctx.scene.current?.id;
    if (currentScene === 'login-wizard' || currentScene === 'onboarding-wizard') {
      return next();
    }

    // Qualquer outra interação redireciona para o login
    console.log('⚠️ Usuário não logado. Redirecionando para login.');
    return ctx.scene.enter('login-wizard');
  }

  // Se estiver logado mas onboarding incompleto, força onboarding
  if (
    ctx.session.user?.onboardingStep !== undefined &&
    ctx.session.user.onboardingStep < 5 &&
    ctx.scene.current?.id !== 'onboarding-wizard'
  ) {
    return ctx.scene.enter('onboarding-wizard');
  }

  await next();
});

// --- COMANDOS PRINCIPAIS ---

bot.start((ctx) => {
  if (ctx.session.token) {
    const userName = ctx.session.user?.name || 'Investidor';
    ctx.reply(
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
        `Digite /ajuda para ver todos os comandos.`,
      { parse_mode: 'Markdown' }
    );
  } else {
    ctx.scene.enter('login-wizard');
  }
});

// Comando de ajuda em inglês
bot.help((ctx) => {
  ctx.reply(
    `🤖 *Comandos do Fayol:*\n\n` +
      `💰 *Consultas:*\n` +
      `/saldo - Saldo atual e resumo do mês\n` +
      `/extrato - Últimas 5 transações\n` +
      `/categorias - Gastos por categoria\n` +
      `/insights - Análise inteligente (IA)\n\n` +
      `📝 *Lançamentos:*\n` +
      `/receita - Adicionar receita\n` +
      `/despesa - Adicionar despesa\n\n` +
      `📄 *Relatórios:*\n` +
      `/relatorio - Gerar PDF mensal\n` +
      `/excel - Exportar planilha\n\n` +
      `⚙️ *Outros:*\n` +
      `/ajuda ou /help - Ver esta mensagem\n` +
      `/exemplos - Ver exemplos de uso\n` +
      `/dicas - Dicas para usar melhor o bot\n` +
      `/logout - Sair da conta\n\n` +
      `✨ *Lançamento Rápido (Detecção Automática):*\n` +
      `Digite descrição + valor e o bot detecta o tipo:\n` +
      `• "Salário 5000" → Receita 💰\n` +
      `• "Almoço 35" → Despesa 💸\n\n` +
      `Forçar tipo com prefixo:\n` +
      `• "+ Freelance 800" → Receita\n` +
      `• "- Uber 25.50" → Despesa`,
    { parse_mode: 'Markdown' }
  );
});

// Comando de ajuda em português
bot.command('ajuda', (ctx) => {
  ctx.reply(
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
      `💡 *Dica:* O bot detecta automaticamente se é receita ou despesa baseado nas palavras que você usa!`,
    { parse_mode: 'Markdown' }
  );
});

bot.command('receita', async (ctx) => {
  if (!ctx.session.token) return;
  ctx.reply(
    '💰 *Adicionar Receita*\n\n' +
      'Digite a descrição e o valor da receita:\n\n' +
      '*Exemplos:*\n' +
      '• `Salário 5000`\n' +
      '• `Freelance 1500`\n' +
      '• `Venda 350.50`',
    { parse_mode: 'Markdown' }
  );
});

bot.command('despesa', async (ctx) => {
  if (!ctx.session.token) return;
  ctx.reply(
    '💸 *Adicionar Despesa*\n\n' +
      'Digite a descrição e o valor da despesa:\n\n' +
      '*Exemplos:*\n' +
      '• `Almoço 45`\n' +
      '• `Uber 28.50`\n' +
      '• `Mercado 235.90`',
    { parse_mode: 'Markdown' }
  );
});

// Comando de exemplos práticos
bot.command('exemplos', (ctx) => {
  ctx.reply(
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
      `• "Almoço 35.50" ✅`,
    { parse_mode: 'Markdown' }
  );
});

// Comando de dicas
bot.command('dicas', (ctx) => {
  ctx.reply(
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
      `📱 Use /exemplos para ver mais casos práticos!`,
    { parse_mode: 'Markdown' }
  );
});

bot.command('logout', (ctx) => {
  ctx.session.token = undefined;
  ctx.session.user = undefined;
  ctx.reply('Desconectado. Digite /start para entrar novamente.');
});

bot.command('saldo', async (ctx) => {
  if (!ctx.session.token) return;
  ctx.sendChatAction('typing');
  try {
    const data = await apiService.getDashboardSummary(ctx.session.token);
    const { totalBalance, periodSummary } = data;

    const resultIcon = periodSummary.result >= 0 ? '🟢' : '🔴';

    const msg =
      `💰 *Saldo Atual:* ${CurrencyUtils.format(totalBalance)}\n\n` +
      `📅 *Resumo do Mês:*\n` +
      `📈 Receitas: ${CurrencyUtils.format(periodSummary.income)}\n` +
      `💸 Despesas: ${CurrencyUtils.format(periodSummary.expense)}\n` +
      `───────────────\n` +
      `${resultIcon} Resultado: ${CurrencyUtils.format(periodSummary.result)}`;

    ctx.reply(msg, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error(error);
    ctx.reply('Erro ao buscar saldo. Tente novamente mais tarde.');
  }
});

bot.command('extrato', async (ctx) => {
  if (!ctx.session.token) return;
  ctx.sendChatAction('typing');
  try {
    const transactions: Transaction[] = await apiService.getLastTransactions(ctx.session.token, 5);
    if (!transactions.length) return ctx.reply('Sem transações recentes.');

    let msg = `📄 *Últimas 5 Transações*\n\n`;
    transactions.forEach((t) => {
      const icon = t.type === 'INCOME' ? '💰' : '💸';
      const date = DateUtils.formatDate(new Date(t.date));
      const shortDate = date.substring(0, 5); // dd/MM
      msg += `${icon} *${t.description}*\n   ${CurrencyUtils.format(Number(t.amount))}  •  ${shortDate}\n\n`;
    });
    ctx.reply(msg, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error(error);
    ctx.reply('Erro ao buscar extrato.');
  }
});

bot.command(['categorias', 'gastos'], async (ctx) => {
  if (!ctx.session.token) return;
  ctx.sendChatAction('typing');
  try {
    const categories = await apiService.getExpensesByCategory(ctx.session.token);

    if (!categories || categories.length === 0) {
      return ctx.reply('Nenhum gasto categorizado neste mês.');
    }

    const total = categories.reduce((acc, curr) => acc + Number(curr.amount), 0);

    let msg = `📊 *Gastos por Categoria (Top 5)*\n\n`;

    categories.slice(0, 5).forEach((cat) => {
      const percent = ((Number(cat.amount) / total) * 100).toFixed(0);
      const bar = '█'.repeat(Math.ceil(Number(percent) / 10)); // Gráfico simples em texto

      msg += `${cat.icon || '🏷️'} *${cat.name}* (${percent}%)\n`;
      msg += `${bar} ${CurrencyUtils.format(Number(cat.amount))}\n\n`;
    });

    ctx.reply(msg, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error(error);
    ctx.reply('Erro ao buscar categorias.');
  }
});

bot.command('insights', async (ctx) => {
  if (!ctx.session.token) return;
  ctx.sendChatAction('typing');
  try {
    const insights = await apiService.getInsights(ctx.session.token);

    if (!insights || insights.length === 0) {
      return ctx.reply('🤖 A IA ainda está analisando seus dados. Volte mais tarde!');
    }

    let msg = `💡 *Insights da IA Fayol*\n\n`;

    insights.forEach((insight) => {
      const icon = insight.type === 'warning' ? '⚠️' : insight.type === 'success' ? '✅' : 'ℹ️';
      msg += `${icon} ${insight.text}\n\n`;
    });

    ctx.reply(msg, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error(error);
    ctx.reply('Erro ao gerar insights.');
  }
});

bot.command('relatorio', async (ctx) => {
  if (!ctx.session.token) return;

  // Feedback imediato
  await ctx.reply('Hz Gerando seu relatório mensal em PDF. Aguarde um momento...');
  ctx.sendChatAction('upload_document');

  try {
    const pdfBuffer = await apiService.downloadReport(ctx.session.token, 'PDF');

    // Data atual para o nome do arquivo
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `Relatorio_Fayol_${dateStr}.pdf`;

    await ctx.replyWithDocument(
      {
        source: Buffer.from(pdfBuffer),
        filename: filename,
      },
      {
        caption: '📄 Aqui está o seu relatório mensal consolidado.',
      }
    );
  } catch (error) {
    console.error(error);
    ctx.reply('❌ Ocorreu um erro ao gerar o relatório. Tente novamente mais tarde.');
  }
});

// Adicione também uma opção de Excel se desejar
bot.command('excel', async (ctx) => {
  if (!ctx.session.token) return;
  await ctx.reply('📊 Gerando planilha de transações...');
  ctx.sendChatAction('upload_document');

  try {
    const excelBuffer = await apiService.downloadReport(ctx.session.token, 'EXCEL');
    const dateStr = new Date().toISOString().slice(0, 10);

    await ctx.replyWithDocument({
      source: Buffer.from(excelBuffer),
      filename: `Extrato_Fayol_${dateStr}.xlsx`,
    });
  } catch (error) {
    ctx.reply('❌ Erro ao gerar planilha.');
  }
});

// --- HANDLERS GERAIS ---

// Handler de Áudio (Placeholder para IA)
bot.on(message('voice'), async (ctx) => {
  await ctx.reply(
    '🎤 Recebi seu áudio! O serviço de IA para transcrição será ativado na próxima atualização.'
  );
});

// Handler de Imagem (Placeholder para OCR)
bot.on(message('photo'), async (ctx) => {
  await ctx.reply(
    '📸 Recebi sua foto! O serviço de leitura de comprovantes (OCR) será ativado na próxima atualização.'
  );
});

// Handler de Texto (Transação Rápida com Detecção Inteligente)
bot.on(message('text'), async (ctx) => {
  if (ctx.scene.current) return;
  let text = ctx.message.text;
  if (text.startsWith('/')) return;

  // Detecta se há prefixo (+/-) para forçar tipo
  const prefixType = detectFromPrefix(text);
  if (prefixType) {
    text = removePrefix(text);
  }

  // Regex melhorado: captura valores com vírgula ou ponto
  const numberRegex = /(\d+(?:[.,]\d{1,2})?)/;
  const match = text.match(numberRegex);

  if (!match) {
    return ctx.reply(
      '💡 *Como usar o lançamento rápido:*\n\n' +
        '📝 Formato: `[+/-] Descrição Valor`\n\n' +
        '*Exemplos:*\n' +
        '• `Almoço 35.00` (detecta despesa)\n' +
        '• `Salário 5000` (detecta receita)\n' +
        '• `+ Freelance 800` (força receita)\n' +
        '• `- Uber 25.50` (força despesa)\n\n' +
        'Use /ajuda para ver todos os comandos.',
      { parse_mode: 'Markdown' }
    );
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

    await apiService.createTransaction(ctx.session.token!, description, amount, launchType);

    const icon = getTypeIcon(transactionType);
    const typeName = getTypeName(transactionType);

    ctx.reply(
      `${icon} *${typeName} salva com sucesso!*\n\n` +
        `📝 Descrição: ${description}\n` +
        `💵 Valor: ${CurrencyUtils.format(amount)}\n` +
        `🔍 Tipo: ${typeName} (${detectionMethod})`,
      { parse_mode: 'Markdown' }
    );
  } catch (error: any) {
    if (error.message?.includes('401')) {
      ctx.session.token = undefined;
      ctx.scene.enter('login-wizard');
    } else {
      ctx.reply('❌ Erro ao salvar transação: ' + (error.message || 'Erro desconhecido'));
    }
  }
});

console.log('🤖 Fayol Bot iniciado e pronto!');
bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
