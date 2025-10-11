import { Context } from 'telegraf';
import { Markup } from 'telegraf';
import { apiService } from '../services/api.service';
import { sessionService } from '../services/session.service';
import { loggers } from '../utils/logger';

export async function startCommand(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  loggers.command('/start', ctx.from);

  const isAuth = await sessionService.isAuthenticated(telegramId);

  if (isAuth) {
    const session = await sessionService.getSession(telegramId);
    loggers.info('User already authenticated on /start', {
      userId: telegramId,
      userName: session?.name,
    });
    await ctx.reply(
      `✅ Você já está autenticado como *${session?.name}*!\n\n` +
        'Use /menu para ver as opções disponíveis.',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  await ctx.reply(
    '✨ *Bem-vindo ao Fayol!*\n\n' +
      '💼 Seu assistente financeiro pessoal inteligente.\n\n' +
      '🎯 *O que você pode fazer:*\n' +
      '• Gerenciar suas finanças\n' +
      '• Adicionar receitas e despesas\n' +
      '• Ver relatórios detalhados\n' +
      '• Categorização automática com IA\n\n' +
      '👉 Para começar, faça login abaixo:',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔐 Fazer Login', 'login')],
        [Markup.button.callback('❓ Ajuda', 'help')],
      ])
    }
  );
}

export async function loginCommand(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  loggers.command('/login', ctx.from);

  if (await sessionService.isAuthenticated(telegramId)) {
    const session = await sessionService.getSession(telegramId);
    loggers.info('User already authenticated on /login', {
      userId: telegramId,
      userName: session?.name,
    });
    await ctx.reply(
      `✅ Você já está autenticado como *${session?.name}*!\n\n` +
        'Use /menu para acessar as funcionalidades.',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  await showLoginOptions(ctx);
}

export async function showLoginOptions(ctx: Context) {
  await ctx.reply(
    '🔐 *Login no Fayol*\n\n' +
      'Escolha como deseja fazer login:\n\n' +
      '📧 *E-mail* - Login com e-mail e senha\n' +
      '📱 *Celular* - Login com número de celular\n' +
      '🆔 *CPF* - Login com CPF e senha',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📧 E-mail', 'login_email')],
        [Markup.button.callback('📱 Celular', 'login_phone')],
        [Markup.button.callback('🆔 CPF', 'login_cpf')],
        [Markup.button.callback('❌ Cancelar', 'cancel')],
      ])
    }
  );
}

export async function logoutCommand(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  loggers.command('/logout', ctx.from);

  if (!await sessionService.isAuthenticated(telegramId)) {
    loggers.warn('Logout attempted without authentication', { userId: telegramId });
    await ctx.reply(
      '❌ Você não está autenticado.\n\n' +
      'Use /login para fazer login.',
      {
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔐 Fazer Login', 'login')],
        ])
      }
    );
    return;
  }

  const session = await sessionService.getSession(telegramId);
  await sessionService.deleteSession(telegramId);

  loggers.info('User logged out', {
    userId: telegramId,
    userName: session?.name,
  });

  await ctx.reply(
    `👋 *Logout realizado com sucesso!*\n\n` +
      `Até logo, *${session?.name}*!\n\n` +
      'Quando quiser voltar, é só fazer login novamente.',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔐 Fazer Login', 'login')],
      ])
    }
  );
}

export async function handleLoginFlow(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId || !ctx.message || !('text' in ctx.message)) return;

  const state = await sessionService.getUserState(telegramId);
  if (!state) return;

  const text = ctx.message.text;

  try {
    // Handle identifier input (email, phone, or CPF)
    if (state.step === 'awaiting_identifier') {
      const { loginType } = state;
      let isValid = false;
      let errorMessage = '';

      // Validate based on login type
      if (loginType === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        isValid = emailRegex.test(text);
        errorMessage = '❌ E-mail inválido. Por favor, envie um e-mail válido:';
      } else if (loginType === 'phone') {
        const phoneRegex = /^[0-9]{10,11}$/;
        const cleanPhone = text.replace(/\D/g, '');
        isValid = phoneRegex.test(cleanPhone);
        errorMessage = '❌ Celular inválido. Envie apenas números (10-11 dígitos):';
      } else if (loginType === 'cpf') {
        const cpfRegex = /^[0-9]{11}$/;
        const cleanCPF = text.replace(/\D/g, '');
        isValid = cpfRegex.test(cleanCPF);
        errorMessage = '❌ CPF inválido. Envie apenas números (11 dígitos):';
      }

      if (!isValid) {
        loggers.warn('Invalid login identifier', {
          userId: telegramId,
          loginType,
          input: text.substring(0, 3) + '***', // Log only first 3 chars for privacy
        });
        await ctx.reply(errorMessage);
        return;
      }

      loggers.debug('Login identifier validated', {
        userId: telegramId,
        loginType,
      });

      await sessionService.saveUserState(telegramId, {
        ...state,
        step: 'awaiting_password',
        identifier: loginType === 'phone' || loginType === 'cpf' ? text.replace(/\D/g, '') : text,
      });

      await ctx.reply(
        '🔑 *Agora envie sua senha:*\n\n' +
        '_Sua senha não será armazenada._',
        { parse_mode: 'Markdown' }
      );
    }
    // Handle password input
    else if (state.step === 'awaiting_password') {
      await ctx.reply('⏳ *Autenticando...*', { parse_mode: 'Markdown' });

      try {
        // Try to login based on identifier type
        let loginIdentifier = state.identifier;

        // For phone and CPF, we'll use email field in the API (needs API update)
        // For now, convert to email format as fallback
        if (state.loginType === 'phone') {
          loginIdentifier = state.identifier; // Use phone directly
        } else if (state.loginType === 'cpf') {
          loginIdentifier = state.identifier; // Use CPF directly
        }

        loggers.apiRequest('POST', '/auth/login', {
          userId: telegramId,
          loginType: state.loginType,
        });

        const session = await apiService.login(loginIdentifier, text);
        await sessionService.saveSession(telegramId, session);
        await sessionService.clearUserState(telegramId);

        loggers.info('User logged in successfully', {
          userId: telegramId,
          userName: session.name,
          loginType: state.loginType,
        });

        await ctx.reply(
          `✅ *Login realizado com sucesso!*\n\n` +
            `Olá, *${session.name}*! 👋\n\n` +
            '🎉 Você está pronto para gerenciar suas finanças!\n\n' +
            'Use /menu para começar.',
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('📊 Menu Principal', 'menu')],
              [Markup.button.callback('➕ Adicionar Transação', 'add_transaction')],
            ])
          }
        );
      } catch (error: any) {
        loggers.apiError('POST', '/auth/login', error, {
          userId: telegramId,
          loginType: state.loginType,
        });

        await sessionService.clearUserState(telegramId);

        const errorMessage = error.response?.data?.message || 'Credenciais inválidas';
        await ctx.reply(
          `❌ *Erro no login*\n\n` +
            `${errorMessage}\n\n` +
            'Tente novamente com /login',
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('🔐 Tentar Novamente', 'login')],
            ])
          }
        );
      }
    }
  } catch (error: any) {
    loggers.flowError('login', state?.step || 'unknown', error, {
      userId: telegramId,
      state,
    });

    await sessionService.clearUserState(telegramId);
    await ctx.reply(
      '❌ Erro inesperado. Use /login para tentar novamente.',
      {
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔐 Fazer Login', 'login')],
        ])
      }
    );
  }
}

// Callback query handlers
export async function handleLoginCallback(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  await ctx.answerCbQuery();
  await showLoginOptions(ctx);
}

export async function handleLoginEmailCallback(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  await ctx.answerCbQuery();

  loggers.botEvent('login_method_selected', ctx.from, { method: 'email' });

  await sessionService.saveUserState(telegramId, {
    step: 'awaiting_identifier',
    loginType: 'email'
  });

  await ctx.reply(
    '📧 *Login com E-mail*\n\n' +
      'Por favor, envie seu *e-mail*:\n\n' +
      '_Exemplo: joao@example.com_',
    { parse_mode: 'Markdown' }
  );
}

export async function handleLoginPhoneCallback(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  await ctx.answerCbQuery();

  loggers.botEvent('login_method_selected', ctx.from, { method: 'phone' });

  await sessionService.saveUserState(telegramId, {
    step: 'awaiting_identifier',
    loginType: 'phone'
  });

  await ctx.reply(
    '📱 *Login com Celular*\n\n' +
      'Por favor, envie seu *número de celular*:\n\n' +
      '_Exemplo: 11999999999 (apenas números)_',
    { parse_mode: 'Markdown' }
  );
}

export async function handleLoginCPFCallback(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  await ctx.answerCbQuery();

  loggers.botEvent('login_method_selected', ctx.from, { method: 'cpf' });

  await sessionService.saveUserState(telegramId, {
    step: 'awaiting_identifier',
    loginType: 'cpf'
  });

  await ctx.reply(
    '🆔 *Login com CPF*\n\n' +
      'Por favor, envie seu *CPF*:\n\n' +
      '_Exemplo: 12345678900 (apenas números)_',
    { parse_mode: 'Markdown' }
  );
}
