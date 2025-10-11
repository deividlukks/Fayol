import { Context } from 'telegraf';
import { Markup } from 'telegraf';
import { apiService } from '../services/api.service';
import { sessionService } from '../services/session.service';
import { formatCurrency } from '../utils/parser';
import { loggers } from '../utils/logger';

async function requireAuth(ctx: Context): Promise<boolean> {
  const telegramId = ctx.from?.id;
  if (!telegramId || !await sessionService.isAuthenticated(telegramId)) {
    loggers.warn('Unauthorized access attempt', { userId: telegramId });
    ctx.reply(
      '❌ Você precisa fazer login primeiro.',
      {
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔐 Fazer Login', 'login')],
        ])
      }
    );
    return false;
  }
  return true;
}

// Main accounts menu
export async function contasCommand(ctx: Context) {
  if (!await requireAuth(ctx)) return;

  loggers.command('/contas', ctx.from);

  await ctx.reply(
    '💼 *Gerenciamento de Contas*\n\n' +
      'O que você gostaria de fazer?',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📋 Listar Contas', 'accounts_list')],
        [Markup.button.callback('➕ Nova Conta', 'accounts_create')],
        [Markup.button.callback('✏️ Editar Conta', 'accounts_edit_select')],
        [Markup.button.callback('🗑️ Excluir Conta', 'accounts_delete_select')],
        [Markup.button.callback('🔙 Voltar', 'menu')],
      ])
    }
  );
}

// List accounts
export async function listAccountsCallback(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  await ctx.answerCbQuery();

  const session = await sessionService.getSession(telegramId);
  if (!session) return;

  try {
    loggers.apiRequest('GET', '/accounts', { userId: telegramId });
    const accounts = await apiService.getAccounts(session.accessToken);

    loggers.info('Accounts retrieved', { userId: telegramId, count: accounts.length });

    if (!accounts || accounts.length === 0) {
      await ctx.reply(
        '📭 *Nenhuma conta cadastrada*\n\n' +
          'Você ainda não tem contas. Que tal criar uma agora?',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('➕ Criar Primeira Conta', 'accounts_create')],
            [Markup.button.callback('🔙 Voltar', 'accounts')],
          ])
        }
      );
      return;
    }

    let message = '💼 *Suas Contas*\n\n';

    accounts.forEach((account: any, index: number) => {
      const icon = getAccountIcon(account.type);
      const typeName = getAccountTypeName(account.type);

      message += `${icon} *${account.name}*\n`;
      message += `   Tipo: ${typeName}\n`;
      message += `   Saldo: ${formatCurrency(account.balance || 0)}\n`;
      message += `   Criada em: ${new Date(account.createdAt).toLocaleDateString('pt-BR')}\n\n`;
    });

    message += `_Total: ${accounts.length} conta(s)_`;

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('➕ Nova Conta', 'accounts_create')],
        [Markup.button.callback('✏️ Editar', 'accounts_edit_select')],
        [Markup.button.callback('🗑️ Excluir', 'accounts_delete_select')],
        [Markup.button.callback('🔙 Voltar', 'accounts')],
      ])
    });
  } catch (error: any) {
    loggers.apiError('GET', '/accounts', error, { userId: telegramId });
    await ctx.reply(
      `❌ Erro ao listar contas.\n\n${error.response?.data?.message || 'Tente novamente.'}`,
      {
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Tentar Novamente', 'accounts_list')],
          [Markup.button.callback('🔙 Voltar', 'accounts')],
        ])
      }
    );
  }
}

// Create account - Step 1: Choose type
export async function createAccountCallback(ctx: Context) {
  await ctx.answerCbQuery();

  await ctx.reply(
    '➕ *Criar Nova Conta*\n\n' +
      'Escolha o tipo de conta:\n\n' +
      '🏦 *Conta Corrente* - Conta bancária\n' +
      '💎 *Poupança* - Conta poupança\n' +
      '👛 *Carteira* - Dinheiro físico\n' +
      '💳 *Cartão de Crédito* - Cartão de crédito',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🏦 Conta Corrente', 'account_type_checking')],
        [Markup.button.callback('💎 Poupança', 'account_type_savings')],
        [Markup.button.callback('👛 Carteira', 'account_type_wallet')],
        [Markup.button.callback('💳 Cartão de Crédito', 'account_type_credit_card')],
        [Markup.button.callback('❌ Cancelar', 'accounts')],
      ])
    }
  );
}

// Create account - Step 2: Type selected, ask for name
export async function handleAccountTypeCallback(ctx: Context, type: string) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  await ctx.answerCbQuery();

  const typeName = getAccountTypeName(type);
  const icon = getAccountIcon(type);

  await sessionService.saveUserState(telegramId, {
    step: 'awaiting_account_name',
    accountType: type,
  });

  await ctx.reply(
    `${icon} *Criar ${typeName}*\n\n` +
      'Digite o *nome* da conta:\n\n' +
      '_Exemplo: Banco Itaú, Carteira Principal, etc._',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('❌ Cancelar', 'accounts')],
      ])
    }
  );
}

// Create account - Step 3: Ask for initial balance
export async function handleAccountNameInput(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId || !ctx.message || !('text' in ctx.message)) return;

  const state = await sessionService.getUserState(telegramId);
  if (!state || state.step !== 'awaiting_account_name') return;

  const accountName = ctx.message.text;

  await sessionService.saveUserState(telegramId, {
    ...state,
    step: 'awaiting_account_balance',
    accountName,
  });

  await ctx.reply(
    `💰 *Saldo Inicial*\n\n` +
      'Digite o saldo inicial da conta:\n\n' +
      '_Exemplo: 1000 ou 1000.50 ou 0_\n\n' +
      '💡 Pode ser 0 se a conta está vazia.',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('❌ Cancelar', 'accounts')],
      ])
    }
  );
}

// Create account - Step 4: Create the account
export async function handleAccountBalanceInput(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId || !ctx.message || !('text' in ctx.message)) return;

  const state = await sessionService.getUserState(telegramId);
  if (!state || state.step !== 'awaiting_account_balance') return;

  const session = await sessionService.getSession(telegramId);
  if (!session) return;

  const balanceText = ctx.message.text.replace(/[^0-9.,]/g, '').replace(',', '.');
  const balance = parseFloat(balanceText);

  if (isNaN(balance) || balance < 0) {
    await ctx.reply('❌ Valor inválido. Digite um número válido (ex: 1000 ou 0):');
    return;
  }

  try {
    await ctx.reply('⏳ *Criando conta...*', { parse_mode: 'Markdown' });

    loggers.apiRequest('POST', '/accounts', {
      userId: telegramId,
      data: { name: state.accountName, type: state.accountType, initialBalance: balance },
    });

    const account = await apiService.createAccount(session.accessToken, {
      name: state.accountName,
      type: state.accountType,
      initialBalance: balance,
    });

    loggers.info('Account created successfully', {
      userId: telegramId,
      accountId: account.id,
      accountName: account.name,
      accountType: account.type,
    });

    await sessionService.clearUserState(telegramId);

    const icon = getAccountIcon(account.type);
    const typeName = getAccountTypeName(account.type);

    await ctx.reply(
      `✅ *Conta criada com sucesso!*\n\n` +
        `${icon} *${account.name}*\n` +
        `Tipo: ${typeName}\n` +
        `Saldo inicial: ${formatCurrency(balance)}\n\n` +
        '🎉 Sua conta está pronta para uso!',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('📋 Ver Todas as Contas', 'accounts_list')],
          [Markup.button.callback('➕ Criar Outra Conta', 'accounts_create')],
          [Markup.button.callback('🔙 Menu Principal', 'menu')],
        ])
      }
    );
  } catch (error: any) {
    loggers.apiError('POST', '/accounts', error, { userId: telegramId });
    await sessionService.clearUserState(telegramId);

    await ctx.reply(
      `❌ *Erro ao criar conta*\n\n${error.response?.data?.message || 'Tente novamente.'}`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Tentar Novamente', 'accounts_create')],
          [Markup.button.callback('🔙 Voltar', 'accounts')],
        ])
      }
    );
  }
}

// Edit account - Step 1: Select account
export async function editAccountSelectCallback(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  await ctx.answerCbQuery();

  const session = await sessionService.getSession(telegramId);
  if (!session) return;

  try {
    const accounts = await apiService.getAccounts(session.accessToken);

    if (!accounts || accounts.length === 0) {
      await ctx.reply(
        '📭 Nenhuma conta para editar.',
        {
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Voltar', 'accounts')],
          ])
        }
      );
      return;
    }

    const buttons = accounts.map((account: any) => {
      const icon = getAccountIcon(account.type);
      return [Markup.button.callback(`${icon} ${account.name}`, `edit_account_${account.id}`)];
    });

    buttons.push([Markup.button.callback('❌ Cancelar', 'accounts')]);

    await ctx.reply(
      '✏️ *Editar Conta*\n\n' +
        'Selecione a conta que deseja editar:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
      }
    );
  } catch (error: any) {
    loggers.apiError('GET', '/accounts', error, { userId: telegramId });
    await ctx.reply(
      `❌ Erro ao buscar contas.\n\n${error.response?.data?.message || 'Tente novamente.'}`,
      {
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔙 Voltar', 'accounts')],
        ])
      }
    );
  }
}

// Edit account - Step 2: Show edit options
export async function handleEditAccountCallback(ctx: Context, accountId: string) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  await ctx.answerCbQuery();

  const session = await sessionService.getSession(telegramId);
  if (!session) return;

  try {
    const accounts = await apiService.getAccounts(session.accessToken);
    const account = accounts.find((a: any) => a.id === accountId);

    if (!account) {
      await ctx.reply('❌ Conta não encontrada.');
      return;
    }

    const icon = getAccountIcon(account.type);
    const typeName = getAccountTypeName(account.type);

    await ctx.reply(
      `✏️ *Editar: ${account.name}*\n\n` +
        `${icon} Tipo: ${typeName}\n` +
        `💰 Saldo: ${formatCurrency(account.balance)}\n\n` +
        'O que deseja editar?',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('✏️ Alterar Nome', `edit_name_${accountId}`)],
          [Markup.button.callback('🔄 Alterar Tipo', `edit_type_${accountId}`)],
          [Markup.button.callback('❌ Cancelar', 'accounts')],
        ])
      }
    );
  } catch (error: any) {
    loggers.apiError('GET', '/accounts', error, { userId: telegramId });
    await ctx.reply('❌ Erro ao buscar conta.');
  }
}

// Delete account - Step 1: Select account
export async function deleteAccountSelectCallback(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  await ctx.answerCbQuery();

  const session = await sessionService.getSession(telegramId);
  if (!session) return;

  try {
    const accounts = await apiService.getAccounts(session.accessToken);

    if (!accounts || accounts.length === 0) {
      await ctx.reply(
        '📭 Nenhuma conta para excluir.',
        {
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Voltar', 'accounts')],
          ])
        }
      );
      return;
    }

    const buttons = accounts.map((account: any) => {
      const icon = getAccountIcon(account.type);
      return [Markup.button.callback(`${icon} ${account.name}`, `delete_account_${account.id}`)];
    });

    buttons.push([Markup.button.callback('❌ Cancelar', 'accounts')]);

    await ctx.reply(
      '🗑️ *Excluir Conta*\n\n' +
        '⚠️ Selecione a conta que deseja excluir:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
      }
    );
  } catch (error: any) {
    loggers.apiError('GET', '/accounts', error, { userId: telegramId });
    await ctx.reply(
      `❌ Erro ao buscar contas.\n\n${error.response?.data?.message || 'Tente novamente.'}`,
      {
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔙 Voltar', 'accounts')],
        ])
      }
    );
  }
}

// Delete account - Step 2: Confirm deletion
export async function handleDeleteAccountCallback(ctx: Context, accountId: string) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  await ctx.answerCbQuery();

  const session = await sessionService.getSession(telegramId);
  if (!session) return;

  try {
    const accounts = await apiService.getAccounts(session.accessToken);
    const account = accounts.find((a: any) => a.id === accountId);

    if (!account) {
      await ctx.reply('❌ Conta não encontrada.');
      return;
    }

    const icon = getAccountIcon(account.type);

    await ctx.reply(
      `⚠️ *Confirmar Exclusão*\n\n` +
        `${icon} *${account.name}*\n` +
        `💰 Saldo: ${formatCurrency(account.balance)}\n\n` +
        '🚨 *Atenção:* Esta ação não pode ser desfeita!\n\n' +
        'Tem certeza que deseja excluir esta conta?',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('✅ Sim, Excluir', `confirm_delete_${accountId}`)],
          [Markup.button.callback('❌ Não, Cancelar', 'accounts')],
        ])
      }
    );
  } catch (error: any) {
    loggers.apiError('GET', '/accounts', error, { userId: telegramId });
    await ctx.reply('❌ Erro ao buscar conta.');
  }
}

// Delete account - Step 3: Execute deletion
export async function handleConfirmDeleteCallback(ctx: Context, accountId: string) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  await ctx.answerCbQuery();

  const session = await sessionService.getSession(telegramId);
  if (!session) return;

  try {
    await ctx.reply('⏳ *Excluindo conta...*', { parse_mode: 'Markdown' });

    loggers.apiRequest('DELETE', `/accounts/${accountId}`, { userId: telegramId });

    await apiService.deleteAccount(session.accessToken, accountId);

    loggers.info('Account deleted successfully', {
      userId: telegramId,
      accountId,
    });

    await ctx.reply(
      `✅ *Conta excluída com sucesso!*\n\n` +
        'A conta foi removida permanentemente.',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('📋 Ver Contas', 'accounts_list')],
          [Markup.button.callback('🔙 Menu Principal', 'menu')],
        ])
      }
    );
  } catch (error: any) {
    loggers.apiError('DELETE', `/accounts/${accountId}`, error, { userId: telegramId });

    const errorMessage = error.response?.data?.message || 'Erro ao excluir conta.';
    await ctx.reply(
      `❌ *Erro*\n\n${errorMessage}\n\n` +
        '💡 _A conta pode ter transações associadas._',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔙 Voltar', 'accounts')],
        ])
      }
    );
  }
}

// Helper functions
function getAccountIcon(type: string): string {
  const icons: { [key: string]: string } = {
    checking: '🏦',
    savings: '💎',
    wallet: '👛',
    credit_card: '💳',
  };
  return icons[type] || '💼';
}

function getAccountTypeName(type: string): string {
  const names: { [key: string]: string } = {
    checking: 'Conta Corrente',
    savings: 'Poupança',
    wallet: 'Carteira',
    credit_card: 'Cartão de Crédito',
  };
  return names[type] || type;
}
