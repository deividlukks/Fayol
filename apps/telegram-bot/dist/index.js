"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const filters_1 = require("telegraf/filters");
const config_1 = require("./config");
const session_service_1 = require("./services/session.service");
// Command handlers
const auth_commands_1 = require("./commands/auth.commands");
const menu_commands_1 = require("./commands/menu.commands");
const transaction_commands_1 = require("./commands/transaction.commands");
const query_commands_1 = require("./commands/query.commands");
const category_commands_1 = require("./commands/category.commands");
const help_commands_1 = require("./commands/help.commands");
const account_commands_1 = require("./commands/account.commands");
// Create bot instance
const bot = new telegraf_1.Telegraf(config_1.config.telegram.token);
// Error handler
bot.catch((err, ctx) => {
    console.error('Bot error:', err);
    ctx.reply('❌ Ocorreu um erro inesperado. Tente novamente mais tarde.');
});
// Command handlers
bot.command('start', auth_commands_1.startCommand);
bot.command('login', auth_commands_1.loginCommand);
bot.command('logout', auth_commands_1.logoutCommand);
bot.command('menu', menu_commands_1.menuCommand);
bot.command('contas', account_commands_1.contasCommand);
bot.command('addreceita', transaction_commands_1.addReceitaCommand);
bot.command('adddespesa', transaction_commands_1.addDespesaCommand);
bot.command('cancelar', transaction_commands_1.cancelCommand);
bot.command('saldo', query_commands_1.saldoCommand);
bot.command('extrato', query_commands_1.extratoCommand);
bot.command('relatorio', query_commands_1.relatorioCommand);
bot.command('categorias', category_commands_1.categoriasCommand);
bot.command('ajuda', help_commands_1.ajudaCommand);
// Callback query handlers
// Auth callbacks
bot.action('login', auth_commands_1.handleLoginCallback);
bot.action('login_email', auth_commands_1.handleLoginEmailCallback);
bot.action('login_phone', auth_commands_1.handleLoginPhoneCallback);
bot.action('login_cpf', auth_commands_1.handleLoginCPFCallback);
bot.action('logout_confirm', menu_commands_1.handleLogoutConfirmCallback);
bot.action('logout_yes', menu_commands_1.handleLogoutYesCallback);
// Menu callbacks
bot.action('menu', menu_commands_1.handleMenuCallback);
bot.action('add_transaction', menu_commands_1.handleAddTransactionCallback);
bot.action('add_income', menu_commands_1.handleAddIncomeCallback);
bot.action('add_expense', menu_commands_1.handleAddExpenseCallback);
bot.action('view_balance', async (ctx) => {
    await ctx.answerCbQuery();
    await (0, query_commands_1.saldoCommand)(ctx);
});
bot.action('view_statement', async (ctx) => {
    await ctx.answerCbQuery();
    await (0, query_commands_1.extratoCommand)(ctx);
});
bot.action('view_reports', async (ctx) => {
    await ctx.answerCbQuery();
    await (0, query_commands_1.relatorioCommand)(ctx);
});
bot.action('categories', async (ctx) => {
    await ctx.answerCbQuery();
    await (0, category_commands_1.categoriasCommand)(ctx);
});
bot.action('help', async (ctx) => {
    await ctx.answerCbQuery();
    await (0, help_commands_1.ajudaCommand)(ctx);
});
bot.action('cancel', menu_commands_1.handleCancelCallback);
bot.action('cancel_operation', menu_commands_1.handleCancelCallback);
// Account management callbacks
bot.action('accounts', async (ctx) => {
    await ctx.answerCbQuery();
    await (0, account_commands_1.contasCommand)(ctx);
});
bot.action('accounts_list', account_commands_1.listAccountsCallback);
bot.action('accounts_create', account_commands_1.createAccountCallback);
bot.action('accounts_edit_select', account_commands_1.editAccountSelectCallback);
bot.action('accounts_delete_select', account_commands_1.deleteAccountSelectCallback);
// Account type selection
bot.action('account_type_checking', (ctx) => (0, account_commands_1.handleAccountTypeCallback)(ctx, 'checking'));
bot.action('account_type_savings', (ctx) => (0, account_commands_1.handleAccountTypeCallback)(ctx, 'savings'));
bot.action('account_type_wallet', (ctx) => (0, account_commands_1.handleAccountTypeCallback)(ctx, 'wallet'));
bot.action('account_type_credit_card', (ctx) => (0, account_commands_1.handleAccountTypeCallback)(ctx, 'credit_card'));
// Account edit/delete callbacks - dynamic
bot.action(/^edit_account_(.+)$/, (ctx) => {
    const accountId = ctx.match[1];
    (0, account_commands_1.handleEditAccountCallback)(ctx, accountId);
});
bot.action(/^delete_account_(.+)$/, (ctx) => {
    const accountId = ctx.match[1];
    (0, account_commands_1.handleDeleteAccountCallback)(ctx, accountId);
});
bot.action(/^confirm_delete_(.+)$/, (ctx) => {
    const accountId = ctx.match[1];
    (0, account_commands_1.handleConfirmDeleteCallback)(ctx, accountId);
});
// Handle text messages (for flows)
bot.on((0, filters_1.message)('text'), async (ctx) => {
    const telegramId = ctx.from.id;
    const state = await session_service_1.sessionService.getUserState(telegramId);
    if (!state) {
        // No active flow, ignore
        return;
    }
    // Handle login flow
    if (state.step === 'awaiting_identifier' || state.step === 'awaiting_password') {
        await (0, auth_commands_1.handleLoginFlow)(ctx);
        return;
    }
    // Handle account creation flow
    if (state.step === 'awaiting_account_name') {
        await (0, account_commands_1.handleAccountNameInput)(ctx);
        return;
    }
    if (state.step === 'awaiting_account_balance') {
        await (0, account_commands_1.handleAccountBalanceInput)(ctx);
        return;
    }
    // Handle transaction flow
    if (state.step === 'awaiting_income_data' ||
        state.step === 'awaiting_expense_data' ||
        state.step === 'awaiting_account_selection') {
        await (0, transaction_commands_1.handleTransactionFlow)(ctx);
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
    }
    catch (error) {
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
//# sourceMappingURL=index.js.map