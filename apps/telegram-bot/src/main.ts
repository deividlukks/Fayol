import { Telegraf, session, Scenes } from 'telegraf';
import * as dotenv from 'dotenv';
import { ApiService } from './services/api.service';
import { CurrencyUtils } from '@fayol/shared-utils';
import { loginWizard } from './scenes/login.scene';

dotenv.config();

// CORREÇÃO: Estender WizardSession (que já inclui a estrutura __scenes)
// ao invés de WizardSessionData (que é apenas o conteúdo interno)
interface MySession extends Scenes.WizardSession {
  token?: string;
  user?: { name: string };
}

interface MyContext extends Scenes.WizardContext {
  session: MySession;
}

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_BOT_TOKEN ausente');

const bot = new Telegraf<MyContext>(token);
const apiService = new ApiService();

// 1. Configura Cenas
const stage = new Scenes.Stage<MyContext>([loginWizard]);

bot.use(session());
bot.use(stage.middleware());

// 2. Middleware de Autenticação Automática
bot.use(async (ctx, next) => {
  // Ignora comandos de start/help para não travar o primeiro contato
  // Se não tiver token na sessão e não estiver já na cena de login...
  // Usamos 'text' in ctx.message para garantir que é mensagem de texto
  if (!ctx.session.token && ctx.message && 'text' in ctx.message && ctx.message.text !== '/start') {
    // Verifica se já não está em uma cena (ctx.scene.current)
    if (!ctx.scene.current) {
        console.log('Usuário não logado. Iniciando Wizard de Login.');
        return ctx.scene.enter('login-wizard');
    }
  }
  await next();
});

bot.start((ctx) => {
  if (ctx.session.token) {
    ctx.reply(`Olá de volta, ${ctx.session.user?.name}! 👋`);
  } else {
    // O middleware acima já deve capturar, mas por garantia:
    ctx.scene.enter('login-wizard');
  }
});

bot.command('logout', (ctx) => {
  ctx.session.token = undefined;
  ctx.session.user = undefined;
  ctx.reply('Desconectado. Envie qualquer mensagem para logar novamente.');
});

// Lógica de Transação
bot.on('text', async (ctx) => {
  // Se estiver em uma cena (como digitando senha), ignora este handler
  if (ctx.scene.current) return; 

  const text = ctx.message.text;
  const numberRegex = /(\d+([.,]\d{1,2})?)/;
  const match = text.match(numberRegex);

  if (!match) {
    // Como o login é automático, se ele mandar algo sem número e estiver logado, é conversa fiada
    return ctx.reply('Para lançar um gasto, preciso de um valor. Ex: "Café 5.00"');
  }

  const valueStr = match[0].replace(',', '.');
  const amount = parseFloat(valueStr);
  const description = text.replace(match[0], '').trim() || 'Despesa Rápida';

  // Feedback visual "escrevendo..."
  ctx.sendChatAction('typing');

  try {
    // O token existe pois o middleware garante o login antes de chegar aqui
    await apiService.createTransaction(ctx.session.token!, description, amount);
    const formattedValue = CurrencyUtils.format(amount);
    ctx.reply(`✅ Despesa registrada!\n\n📝 ${description}\n💰 ${formattedValue}`);
  } catch (error: any) {
    if (error.message && error.message.includes('401')) {
        ctx.reply('Sua sessão expirou. Vamos logar novamente.');
        ctx.session.token = undefined;
        ctx.scene.enter('login-wizard');
    } else {
        ctx.reply('❌ Erro ao salvar: ' + (error.message || 'Tente novamente.'));
    }
  }
});

console.log('🤖 Fayol Bot Inteligente iniciando...');
bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));