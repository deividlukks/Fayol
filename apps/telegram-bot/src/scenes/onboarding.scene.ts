import { Scenes, Markup } from 'telegraf';
import { BotApiService } from '../services/bot-api.service';

const apiService = new BotApiService();

// Passo 1: Boas-vindas e Nome
const step1 = async (ctx: any) => {
  await ctx.reply(
    '🚀 **Bem-vindo ao Fayol!**\n\nVamos configurar seu perfil para começar.\n\nPrimeiro, como você gostaria de ser chamado?',
    { parse_mode: 'Markdown' }
  );
  return ctx.wizard.next();
};

// Passo 2: Salva Nome e Pergunta Conta
const step2 = async (ctx: any) => {
  const name = ctx.message?.text;
  if (!name || name.length < 2)
    return ctx.reply('Por favor, digite um nome válido (min 2 letras).');

  try {
    await apiService.updateOnboarding(ctx.session.token, { step: 2, name });
    ctx.session.user.name = name; // Atualiza sessão local

    await ctx.reply(
      `Prazer, ${name}! Agora vamos criar sua **Conta Principal**.\n\nQual nome você quer dar para ela? (Ex: Nubank, Carteira, Itaú)`
    );
    return ctx.wizard.next();
  } catch (e) {
    console.error(e);
    await ctx.reply('Erro ao salvar nome. Tente novamente.');
  }
};

// Passo 3: Salva Nome da Conta e Pergunta Saldo
const step3 = async (ctx: any) => {
  const accountName = ctx.message?.text;
  if (!accountName) return ctx.reply('Por favor, digite o nome da conta.');

  ctx.wizard.state.accountName = accountName;

  await ctx.reply(
    `Certo, conta "${accountName}".\n\nQual o **saldo atual** dela? (Digite apenas números, ex: 1500.00)`
  );
  return ctx.wizard.next();
};

// Passo 4: Cria Conta e Pergunta Perfil
const step4 = async (ctx: any) => {
  const balanceText = ctx.message?.text?.replace(',', '.');
  const balance = parseFloat(balanceText);

  if (isNaN(balance))
    return ctx.reply('Por favor, digite um valor numérico válido. Ex: 0 ou 1250.50');

  try {
    await ctx.reply('🔄 Criando conta...');
    await apiService.createAccount(ctx.session.token, {
      name: ctx.wizard.state.accountName,
      type: 'CHECKING',
      balance: balance,
    });

    // Avança para passo 3 no backend
    await apiService.updateOnboarding(ctx.session.token, { step: 3 });

    await ctx.reply(
      '✅ Conta criada!\n\nPor fim, qual seu **Perfil de Investidor**?',
      Markup.inlineKeyboard([
        [Markup.button.callback('🛡️ Conservador', 'profile_CONSERVATIVE')],
        [Markup.button.callback('⚖️ Moderado', 'profile_MODERATE')],
        [Markup.button.callback('🚀 Agressivo', 'profile_AGGRESSIVE')],
      ])
    );
    return ctx.wizard.next();
  } catch (e) {
    console.error(e);
    await ctx.reply('Erro ao criar conta. Vamos tentar o saldo novamente.');
  }
};

// Passo 5: Salva Perfil e Finaliza
const step5 = async (ctx: any) => {
  if (!ctx.callbackQuery) return ctx.reply('Por favor, selecione uma das opções acima.');

  const profile = ctx.callbackQuery.data.replace('profile_', '');

  try {
    await ctx.answerCbQuery();
    await apiService.updateOnboarding(ctx.session.token, {
      step: 5, // Finaliza
      investorProfile: profile,
    });

    // Atualiza sessão
    ctx.session.user.onboardingStep = 5;

    await ctx.reply(
      '🎉 **Tudo Pronto!**\n\nSeu perfil foi configurado com sucesso. Agora você pode começar a controlar suas finanças.',
      { parse_mode: 'Markdown' }
    );
    await ctx.reply('💡 Dica: Envie "Almoço 25.00" para registrar sua primeira despesa.');

    return ctx.scene.leave();
  } catch (e) {
    console.error(e);
    await ctx.reply('Erro ao salvar perfil. Tente selecionar novamente.');
  }
};

export const onboardingWizard = new Scenes.WizardScene(
  'onboarding-wizard',
  step1,
  step2,
  step3,
  step4,
  step5
);
