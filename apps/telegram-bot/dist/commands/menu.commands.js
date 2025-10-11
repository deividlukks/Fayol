"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.menuCommand = menuCommand;
exports.handleMenuCallback = handleMenuCallback;
exports.handleAddTransactionCallback = handleAddTransactionCallback;
exports.handleAddIncomeCallback = handleAddIncomeCallback;
exports.handleAddExpenseCallback = handleAddExpenseCallback;
exports.handleCancelCallback = handleCancelCallback;
exports.handleLogoutConfirmCallback = handleLogoutConfirmCallback;
exports.handleLogoutYesCallback = handleLogoutYesCallback;
const telegraf_1 = require("telegraf");
const session_service_1 = require("../services/session.service");
async function menuCommand(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId)
        return;
    if (!await session_service_1.sessionService.isAuthenticated(telegramId)) {
        await ctx.reply('❌ Você precisa fazer login primeiro.', {
            ...telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('🔐 Fazer Login', 'login')],
            ])
        });
        return;
    }
    const session = await session_service_1.sessionService.getSession(telegramId);
    await ctx.reply(`📊 *Menu Principal*\n\n` +
        `Olá, *${session?.name}*! 👋\n\n` +
        'O que você gostaria de fazer hoje?', {
        parse_mode: 'Markdown',
        ...telegraf_1.Markup.inlineKeyboard([
            [
                telegraf_1.Markup.button.callback('➕ Nova Transação', 'add_transaction'),
                telegraf_1.Markup.button.callback('💰 Ver Saldo', 'view_balance'),
            ],
            [
                telegraf_1.Markup.button.callback('📝 Extrato', 'view_statement'),
                telegraf_1.Markup.button.callback('📊 Relatórios', 'view_reports'),
            ],
            [
                telegraf_1.Markup.button.callback('💼 Minhas Contas', 'accounts'),
                telegraf_1.Markup.button.callback('📁 Categorias', 'categories'),
            ],
            [
                telegraf_1.Markup.button.callback('❓ Ajuda', 'help'),
                telegraf_1.Markup.button.callback('👋 Sair', 'logout_confirm'),
            ],
        ])
    });
}
async function handleMenuCallback(ctx) {
    await ctx.answerCbQuery();
    await menuCommand(ctx);
}
async function handleAddTransactionCallback(ctx) {
    await ctx.answerCbQuery();
    await ctx.reply('➕ *Adicionar Transação*\n\n' +
        'Escolha o tipo de transação:', {
        parse_mode: 'Markdown',
        ...telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('💰 Receita', 'add_income')],
            [telegraf_1.Markup.button.callback('💳 Despesa', 'add_expense')],
            [telegraf_1.Markup.button.callback('🔙 Voltar ao Menu', 'menu')],
        ])
    });
}
async function handleAddIncomeCallback(ctx) {
    await ctx.answerCbQuery();
    const telegramId = ctx.from?.id;
    if (!telegramId)
        return;
    await session_service_1.sessionService.saveUserState(telegramId, {
        step: 'awaiting_income_data',
        type: 'income',
    });
    await ctx.reply('💰 *Adicionar Receita*\n\n' +
        'Envie o valor e descrição da receita:\n\n' +
        '*Exemplos:*\n' +
        '• `3000 Salário de janeiro`\n' +
        '• `R$ 500 Freelance projeto XYZ`\n' +
        '• `Venda de produto 250`', {
        parse_mode: 'Markdown',
        ...telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('❌ Cancelar', 'cancel_operation')],
        ])
    });
}
async function handleAddExpenseCallback(ctx) {
    await ctx.answerCbQuery();
    const telegramId = ctx.from?.id;
    if (!telegramId)
        return;
    await session_service_1.sessionService.saveUserState(telegramId, {
        step: 'awaiting_expense_data',
        type: 'expense',
    });
    await ctx.reply('💳 *Adicionar Despesa*\n\n' +
        'Envie o valor e descrição da despesa:\n\n' +
        '*Exemplos:*\n' +
        '• `50 Uber para o trabalho`\n' +
        '• `R$ 120 Supermercado`\n' +
        '• `Almoço no restaurante 45`', {
        parse_mode: 'Markdown',
        ...telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('❌ Cancelar', 'cancel_operation')],
        ])
    });
}
async function handleCancelCallback(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId)
        return;
    await ctx.answerCbQuery('Operação cancelada');
    await session_service_1.sessionService.clearUserState(telegramId);
    await ctx.reply('✅ *Operação cancelada*', {
        parse_mode: 'Markdown',
        ...telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('🔙 Voltar ao Menu', 'menu')],
        ])
    });
}
async function handleLogoutConfirmCallback(ctx) {
    await ctx.answerCbQuery();
    await ctx.reply('👋 *Confirmar Logout*\n\n' +
        'Tem certeza que deseja sair?', {
        parse_mode: 'Markdown',
        ...telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('✅ Sim, Sair', 'logout_yes')],
            [telegraf_1.Markup.button.callback('❌ Não, Ficar', 'menu')],
        ])
    });
}
async function handleLogoutYesCallback(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId)
        return;
    await ctx.answerCbQuery();
    const session = await session_service_1.sessionService.getSession(telegramId);
    await session_service_1.sessionService.deleteSession(telegramId);
    await ctx.reply(`👋 *Logout realizado com sucesso!*\n\n` +
        `Até logo, *${session?.name}*!\n\n` +
        'Quando quiser voltar, é só fazer login novamente.', {
        parse_mode: 'Markdown',
        ...telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('🔐 Fazer Login', 'login')],
        ])
    });
}
//# sourceMappingURL=menu.commands.js.map