import { Telegraf, session, Scenes } from 'telegraf';
import * as dotenv from 'dotenv';
import { ApiService } from './services/api.service';
import { CurrencyUtils } from '@fayol/shared-utils';
import { loginWizard } from './scenes/login.scene';
import { onboardingWizard } from './scenes/onboarding.scene';
import { message } from 'telegraf/filters';

dotenv.config();

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
const apiService = new ApiService();

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
        `_Envie o valor e descrição (ex: "Pizza 50") para lançar rápido._`,
      { parse_mode: 'Markdown' }
    );
  } else {
    ctx.scene.enter('login-wizard');
  }
});

bot.help((ctx) => {
  ctx.reply(
    `🤖 *Comandos do Fayol:*\n\n` +
      `/saldo - Ver saldo atual e resumo do mês\n` +
      `/extrato - Lista as últimas 5 transações\n` +
      `/categorias - Gráfico de texto dos seus gastos\n` +
      `/insights - Análise inteligente da sua conta\n` +
      `/logout - Sair da conta\n\n` +
      `📝 *Lançamento Rápido:*\n` +
      `Apenas digite o nome e o valor. Ex:\n` +
      `"Uber 25.90"\n` +
      `"Mercado 150"`,
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
    const transactions = await apiService.getLastTransactions(ctx.session.token, 5);
    if (!transactions.length) return ctx.reply('Sem transações recentes.');

    let msg = `📄 *Últimas 5 Transações*\n\n`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transactions.forEach((t: any) => {
      const icon = t.type === 'INCOME' ? 'gw' : '💸';
      const date = new Date(t.date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      });
      msg += `${icon} *${t.description}*\n   ${CurrencyUtils.format(Number(t.amount))}  •  ${date}\n\n`;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const categories: any[] = await apiService.getExpensesByCategory(ctx.session.token);

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insights: any[] = await apiService.getInsights(ctx.session.token);

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

// Handler de Texto (Transação Rápida)
bot.on(message('text'), async (ctx) => {
  if (ctx.scene.current) return;
  const text = ctx.message.text;
  if (text.startsWith('/')) return;

  const numberRegex = /(\d+([.,]\d{1,2})?)/;
  const match = text.match(numberRegex);

  if (!match) {
    // Mensagem genérica se não entender o comando
    return ctx.reply(
      '💡 Para lançar rápido, envie nome e valor. Ex: "Almoço 35.00"\nOu use /ajuda para ver os comandos.'
    );
  }

  const valueStr = match[0].replace(',', '.');
  const amount = parseFloat(valueStr);
  // Remove o valor da string para pegar a descrição
  const description = text.replace(match[0], '').trim() || 'Despesa Rápida';

  try {
    await apiService.createTransaction(ctx.session.token!, description, amount);
    ctx.reply(`✅ Salvo: *${description}*\nValor: ${CurrencyUtils.format(amount)}`, {
      parse_mode: 'Markdown',
    });
  } catch (error: any) {
    if (error.message?.includes('401')) {
      ctx.session.token = undefined;
      ctx.scene.enter('login-wizard');
    } else {
      ctx.reply('❌ Erro ao salvar transação.');
    }
  }
});

console.log('🤖 Fayol Bot iniciado e pronto!');
bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
