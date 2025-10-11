import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { config } from './config';
import { sessionService } from './services/session.service';

// Command handlers
import {
  startCommand,
  loginCommand,
  logoutCommand,
  handleLoginFlow,
  handleLoginCallback,
  handleLoginEmailCallback,
  handleLoginPhoneCallback,
  handleLoginCPFCallback,
} from './commands/auth.commands';

import {
  menuCommand,
  handleMenuCallback,
  handleAddTransactionCallback,
  handleAddIncomeCallback,
  handleAddExpenseCallback,
  handleCancelCallback,
  handleLogoutConfirmCallback,
  handleLogoutYesCallback,
} from './commands/menu.commands';

import {
  addReceitaCommand,
  addDespesaCommand,
  cancelCommand,
  handleTransactionFlow,
} from './commands/transaction.commands';

import { saldoCommand, extratoCommand, relatorioCommand } from './commands/query.commands';
import { categoriasCommand } from './commands/category.commands';
import { ajudaCommand } from './commands/help.commands';

import {
  contasCommand,
  listAccountsCallback,
  createAccountCallback,
  handleAccountTypeCallback,
  handleAccountNameInput,
  handleAccountBalanceInput,
  editAccountSelectCallback,
  handleEditAccountCallback,
  deleteAccountSelectCallback,
  handleDeleteAccountCallback,
  handleConfirmDeleteCallback,
} from './commands/account.commands';

// Create bot instance
const bot = new Telegraf(config.telegram.token);

// Error handler
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('❌ Ocorreu um erro inesperado. Tente novamente mais tarde.');
});

// Command handlers
bot.command('start', startCommand);
bot.command('login', loginCommand);
bot.command('logout', logoutCommand);
bot.command('menu', menuCommand);
bot.command('contas', contasCommand);
bot.command('addreceita', addReceitaCommand);
bot.command('adddespesa', addDespesaCommand);
bot.command('cancelar', cancelCommand);
bot.command('saldo', saldoCommand);
bot.command('extrato', extratoCommand);
bot.command('relatorio', relatorioCommand);
bot.command('categorias', categoriasCommand);
bot.command('ajuda', ajudaCommand);

// Callback query handlers

// Auth callbacks
bot.action('login', handleLoginCallback);
bot.action('login_email', handleLoginEmailCallback);
bot.action('login_phone', handleLoginPhoneCallback);
bot.action('login_cpf', handleLoginCPFCallback);
bot.action('logout_confirm', handleLogoutConfirmCallback);
bot.action('logout_yes', handleLogoutYesCallback);

// Menu callbacks
bot.action('menu', handleMenuCallback);
bot.action('add_transaction', handleAddTransactionCallback);
bot.action('add_income', handleAddIncomeCallback);
bot.action('add_expense', handleAddExpenseCallback);
bot.action('view_balance', async (ctx) => {
  await ctx.answerCbQuery();
  await saldoCommand(ctx);
});
bot.action('view_statement', async (ctx) => {
  await ctx.answerCbQuery();
  await extratoCommand(ctx);
});
bot.action('view_reports', async (ctx) => {
  await ctx.answerCbQuery();
  await relatorioCommand(ctx);
});
bot.action('categories', async (ctx) => {
  await ctx.answerCbQuery();
  await categoriasCommand(ctx);
});
bot.action('help', async (ctx) => {
  await ctx.answerCbQuery();
  await ajudaCommand(ctx);
});
bot.action('cancel', handleCancelCallback);
bot.action('cancel_operation', handleCancelCallback);

// Account management callbacks
bot.action('accounts', async (ctx) => {
  await ctx.answerCbQuery();
  await contasCommand(ctx);
});
bot.action('accounts_list', listAccountsCallback);
bot.action('accounts_create', createAccountCallback);
bot.action('accounts_edit_select', editAccountSelectCallback);
bot.action('accounts_delete_select', deleteAccountSelectCallback);

// Account type selection
bot.action('account_type_checking', (ctx) => handleAccountTypeCallback(ctx, 'checking'));
bot.action('account_type_savings', (ctx) => handleAccountTypeCallback(ctx, 'savings'));
bot.action('account_type_wallet', (ctx) => handleAccountTypeCallback(ctx, 'wallet'));
bot.action('account_type_credit_card', (ctx) => handleAccountTypeCallback(ctx, 'credit_card'));

// Account edit/delete callbacks - dynamic
bot.action(/^edit_account_(.+)$/, (ctx) => {
  const accountId = ctx.match[1];
  handleEditAccountCallback(ctx, accountId);
});

bot.action(/^delete_account_(.+)$/, (ctx) => {
  const accountId = ctx.match[1];
  handleDeleteAccountCallback(ctx, accountId);
});

bot.action(/^confirm_delete_(.+)$/, (ctx) => {
  const accountId = ctx.match[1];
  handleConfirmDeleteCallback(ctx, accountId);
});

// Handle text messages (for flows)
bot.on(message('text'), async (ctx) => {
  const telegramId = ctx.from.id;
  const state = await sessionService.getUserState(telegramId);

  if (!state) {
    // No active flow, ignore
    return;
  }

  // Handle login flow
  if (state.step === 'awaiting_identifier' || state.step === 'awaiting_password') {
    await handleLoginFlow(ctx);
    return;
  }

  // Handle account creation flow
  if (state.step === 'awaiting_account_name') {
    await handleAccountNameInput(ctx);
    return;
  }

  if (state.step === 'awaiting_account_balance') {
    await handleAccountBalanceInput(ctx);
    return;
  }

  // Handle transaction flow
  if (
    state.step === 'awaiting_income_data' ||
    state.step === 'awaiting_expense_data' ||
    state.step === 'awaiting_account_selection'
  ) {
    await handleTransactionFlow(ctx);
    return;
  }
});

// Start bot
async function startBot() {
  try {
    console.log('🤖 Starting Fayol Telegram Bot...');
    console.log('📡 Connecting to Telegram...');

    await bot.launch();

    console.log('✅ Bot is running!');
    console.log('📱 Start chatting with your bot on Telegram');
    console.log('');
    console.log('Press Ctrl+C to stop');

    // Enable graceful stop
    process.once('SIGINT', () => {
      console.log('\n👋 Stopping bot...');
      bot.stop('SIGINT');
    });

    process.once('SIGTERM', () => {
      console.log('\n👋 Stopping bot...');
      bot.stop('SIGTERM');
    });
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the bot
startBot();
