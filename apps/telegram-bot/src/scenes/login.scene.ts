import { Scenes, Markup } from 'telegraf';
import { ApiService } from '../services/api.service';

const apiService = new ApiService();

export const loginWizard = new Scenes.WizardScene(
  'login-wizard',

  // PASSO 1: Solicita ID
  async (ctx: any) => {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
      await ctx.reply('🔄 Reiniciando...');
    }
    await ctx.reply(
      '👋 Olá! Bem-vindo ao Fayol.\n\nPara entrar, digite seu **E-mail** ou **Celular**:',
      { parse_mode: 'Markdown' }
    );
    return ctx.wizard.next();
  },

  // PASSO 2: Valida ID
  async (ctx: any) => {
    if (ctx.callbackQuery && ctx.callbackQuery.data === 'retry_login') {
      await ctx.answerCbQuery();
      return ctx.wizard.selectStep(0);
    }

    if (!ctx.message || !ctx.message.text) {
      return ctx.reply('Por favor, envie um texto.');
    }

    const identifier = ctx.message.text.trim();
    await ctx.reply('🔍 Verificando...');

    try {
      const exists = await apiService.checkUser(identifier);

      if (!exists) {
        await ctx.reply(`❌ Usuário "${identifier}" não encontrado no sistema.`, {
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Tentar Novamente', 'retry_login')],
            [Markup.button.url('📝 Criar Conta', 'http://localhost:3000/auth/register')], // URL local para dev
          ]),
        });
        return;
      }

      ctx.wizard.state.identifier = identifier;
      await ctx.reply('✅ Encontrado! Digite sua **senha**:');
      return ctx.wizard.next();
    } catch (error: any) {
      const errorMsg = error.message?.includes('ECONN')
        ? '🔌 O servidor do Fayol parece estar offline.'
        : '⚠️ Erro técnico ao verificar usuário.';

      await ctx.reply(
        errorMsg,
        Markup.inlineKeyboard([Markup.button.callback('🔄 Tentar Novamente', 'retry_login')])
      );
      return;
    }
  },

  // PASSO 3: Login e Redirecionamento
  async (ctx: any) => {
    if (ctx.callbackQuery && ctx.callbackQuery.data === 'retry_login') {
      await ctx.answerCbQuery();
      return ctx.scene.reenter();
    }

    const password = ctx.message?.text;
    const identifier = ctx.wizard.state.identifier;

    if (!password) return ctx.reply('Por favor, digite sua senha.');

    await ctx.reply('🔐 Autenticando...');
    const result = await apiService.login(identifier, password);

    if (result && result.access_token) {
      ctx.session.token = result.access_token;
      ctx.session.user = result.user;

      // VERIFICAÇÃO DE ONBOARDING
      // Se o passo for menor que 5, redireciona para o wizard de configuração
      if (result.user.onboardingStep !== undefined && result.user.onboardingStep < 5) {
        await ctx.scene.leave();
        return ctx.scene.enter('onboarding-wizard');
      }

      // Se já completou o onboarding
      await ctx.reply(`🎉 **Olá de volta, ${result.user.name}!**`, { parse_mode: 'Markdown' });
      await ctx.reply('Estou pronto! Envie "Almoço 20.00" para lançar uma despesa.');
      return ctx.scene.leave();
    } else {
      await ctx.reply(
        '🚫 Senha incorreta.',
        Markup.inlineKeyboard([Markup.button.callback('🔄 Tentar Novamente', 'retry_login')])
      );
      return;
    }
  }
);

loginWizard.action('retry_login', async (ctx: any) => {
  await ctx.answerCbQuery();
  try {
    await ctx.deleteMessage();
  } catch (e) {}
  return ctx.scene.reenter();
});
