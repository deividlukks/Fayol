import { Telegraf, session, Scenes } from 'telegraf';
import * as dotenv from 'dotenv';
import { ApiService } from './services/api.service';
import { CurrencyUtils, DateUtils } from '@fayol/shared-utils';
import { loginWizard } from './scenes/login.scene';

dotenv.config();

interface MySession extends Scenes.WizardSession {
  token?: string;
  user?: { name: string };
}

interface MyContext extends Scenes.WizardContext {
  session: MySession;
}

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_BOT_TOKEN ausente no .env');

const bot = new Telegraf<MyContext>(token);
const apiService = new ApiService();

// Configura Cenas
const stage = new Scenes.Stage<MyContext>([loginWizard]);

bot.use(session());
bot.use(stage.middleware());

// Middleware de Autenticação Automática
bot.use(async (ctx, next) => {
  // Se não estiver logado e não estiver em uma cena...
  if (!ctx.session.token) {
    // Permite apenas o comando /start passar sem login para iniciar o fluxo
    if (ctx.message && 'text' in ctx.message && ctx.message.text === '/start') {
       return next();
    }
    
    // Se já estiver na cena de login, deixa fluir
    if (ctx.scene.current?.id === 'login-wizard') {
        return next();
    }

    // Qualquer outra interação força o login
    console.log('⚠️ Usuário não logado detectado. Redirecionando para login.');
    return ctx.scene.enter('login-wizard');
  }
  await next();
});

bot.start((ctx) => {
  if (ctx.session.token) {
    ctx.reply(
      `Olá de volta, ${ctx.session.user?.name}! 👋\n\n` +
      `💰 /saldo - Ver resumo\n` +
      `📄 /extrato - Ver transações\n` +
      `🚪 /logout - Sair`
    );
  } else {
    ctx.scene.enter('login-wizard');
  }
});

bot.command('logout', (ctx) => {
  ctx.session.token = undefined;
  ctx.session.user = undefined;
  ctx.reply('Desconectado. Digite /start para entrar novamente.');
});

// ... (Comandos saldo e extrato mantidos conforme versão anterior) ...
bot.command('saldo', async (ctx) => {
  if (!ctx.session.token) return;
  ctx.sendChatAction('typing');
  try {
    const data = await apiService.getDashboardSummary(ctx.session.token);
    const { totalBalance, periodSummary } = data;
    const msg = `💰 Saldo: ${CurrencyUtils.format(totalBalance)}\nGw Receita: ${CurrencyUtils.format(periodSummary.income)}\n💸 Despesa: ${CurrencyUtils.format(periodSummary.expense)}`;
    ctx.reply(msg);
  } catch (error) {
    ctx.reply('Erro ao buscar saldo.');
  }
});

bot.command('extrato', async (ctx) => {
  if (!ctx.session.token) return;
  ctx.sendChatAction('typing');
  try {
    const transactions = await apiService.getLastTransactions(ctx.session.token, 5);
    if (!transactions.length) return ctx.reply('Sem transações recentes.');
    
    let msg = `📄 **Últimas 5 Transações**\n\n`;
    transactions.forEach((t: any) => {
        msg += `${t.type === 'INCOME' ? 'Gw' : '💸'} ${t.description} - ${CurrencyUtils.format(Number(t.amount))}\n`;
    });
    ctx.reply(msg, { parse_mode: 'Markdown' });
  } catch (error) {
    ctx.reply('Erro ao buscar extrato.');
  }
});

bot.on('text', async (ctx) => {
  if (ctx.scene.current) return; 
  const text = ctx.message.text;
  if (text.startsWith('/')) return;

  const numberRegex = /(\d+([.,]\d{1,2})?)/;
  const match = text.match(numberRegex);

  if (!match) return ctx.reply('💡 Envie nome e valor. Ex: "Almoço 35.00"');

  const valueStr = match[0].replace(',', '.');
  const amount = parseFloat(valueStr);
  const description = text.replace(match[0], '').trim() || 'Despesa Rápida';

  try {
    await apiService.createTransaction(ctx.session.token!, description, amount);
    ctx.reply(`✅ Salvo: ${description} - ${CurrencyUtils.format(amount)}`);
  } catch (error: any) {
    if (error.message?.includes('401')) {
        ctx.session.token = undefined;
        ctx.scene.enter('login-wizard');
    } else {
        ctx.reply('❌ Erro ao salvar.');
    }
  }
});

console.log('🤖 Fayol Bot iniciado...');
bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));