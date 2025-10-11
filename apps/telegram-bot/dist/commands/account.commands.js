"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contasCommand = contasCommand;
exports.listAccountsCallback = listAccountsCallback;
exports.createAccountCallback = createAccountCallback;
exports.handleAccountTypeCallback = handleAccountTypeCallback;
exports.handleAccountNameInput = handleAccountNameInput;
exports.handleAccountBalanceInput = handleAccountBalanceInput;
exports.editAccountSelectCallback = editAccountSelectCallback;
exports.handleEditAccountCallback = handleEditAccountCallback;
exports.deleteAccountSelectCallback = deleteAccountSelectCallback;
exports.handleDeleteAccountCallback = handleDeleteAccountCallback;
exports.handleConfirmDeleteCallback = handleConfirmDeleteCallback;
const telegraf_1 = require("telegraf");
const api_service_1 = require("../services/api.service");
const session_service_1 = require("../services/session.service");
const parser_1 = require("../utils/parser");
const logger_1 = require("../utils/logger");
async function requireAuth(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId || !await session_service_1.sessionService.isAuthenticated(telegramId)) {
        logger_1.loggers.warn('Unauthorized access attempt', { userId: telegramId });
        ctx.reply('❌ Você precisa fazer login primeiro.', {
            ...telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('🔐 Fazer Login', 'login')],
            ])
        });
        return false;
    }
    return true;
}
// Main accounts menu
async function contasCommand(ctx) {
    if (!await requireAuth(ctx))
        return;
    logger_1.loggers.command('/contas', ctx.from);
    await ctx.reply('💼 *Gerenciamento de Contas*\n\n' +
        'O que você gostaria de fazer?', {
        parse_mode: 'Markdown',
        ...telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('📋 Listar Contas', 'accounts_list')],
            [telegraf_1.Markup.button.callback('➕ Nova Conta', 'accounts_create')],
            [telegraf_1.Markup.button.callback('✏️ Editar Conta', 'accounts_edit_select')],
            [telegraf_1.Markup.button.callback('🗑️ Excluir Conta', 'accounts_delete_select')],
            [telegraf_1.Markup.button.callback('🔙 Voltar', 'menu')],
        ])
    });
}
// List accounts
async function listAccountsCallback(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId)
        return;
    await ctx.answerCbQuery();
    const session = await session_service_1.sessionService.getSession(telegramId);
    if (!session)
        return;
    try {
        logger_1.loggers.apiRequest('GET', '/accounts', { userId: telegramId });
        const accounts = await api_service_1.apiService.getAccounts(session.accessToken);
        logger_1.loggers.info('Accounts retrieved', { userId: telegramId, count: accounts.length });
        if (!accounts || accounts.length === 0) {
            await ctx.reply('📭 *Nenhuma conta cadastrada*\n\n' +
                'Você ainda não tem contas. Que tal criar uma agora?', {
                parse_mode: 'Markdown',
                ...telegraf_1.Markup.inlineKeyboard([
                    [telegraf_1.Markup.button.callback('➕ Criar Primeira Conta', 'accounts_create')],
                    [telegraf_1.Markup.button.callback('🔙 Voltar', 'accounts')],
                ])
            });
            return;
        }
        let message = '💼 *Suas Contas*\n\n';
        accounts.forEach((account, index) => {
            const icon = getAccountIcon(account.type);
            const typeName = getAccountTypeName(account.type);
            message += `${icon} *${account.name}*\n`;
            message += `   Tipo: ${typeName}\n`;
            message += `   Saldo: ${(0, parser_1.formatCurrency)(account.balance || 0)}\n`;
            message += `   Criada em: ${new Date(account.createdAt).toLocaleDateString('pt-BR')}\n\n`;
        });
        message += `_Total: ${accounts.length} conta(s)_`;
        await ctx.reply(message, {
            parse_mode: 'Markdown',
            ...telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('➕ Nova Conta', 'accounts_create')],
                [telegraf_1.Markup.button.callback('✏️ Editar', 'accounts_edit_select')],
                [telegraf_1.Markup.button.callback('🗑️ Excluir', 'accounts_delete_select')],
                [telegraf_1.Markup.button.callback('🔙 Voltar', 'accounts')],
            ])
        });
    }
    catch (error) {
        logger_1.loggers.apiError('GET', '/accounts', error, { userId: telegramId });
        await ctx.reply(`❌ Erro ao listar contas.\n\n${error.response?.data?.message || 'Tente novamente.'}`, {
            ...telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('🔄 Tentar Novamente', 'accounts_list')],
                [telegraf_1.Markup.button.callback('🔙 Voltar', 'accounts')],
            ])
        });
    }
}
// Create account - Step 1: Choose type
async function createAccountCallback(ctx) {
    await ctx.answerCbQuery();
    await ctx.reply('➕ *Criar Nova Conta*\n\n' +
        'Escolha o tipo de conta:\n\n' +
        '🏦 *Conta Corrente* - Conta bancária\n' +
        '💎 *Poupança* - Conta poupança\n' +
        '👛 *Carteira* - Dinheiro físico\n' +
        '💳 *Cartão de Crédito* - Cartão de crédito', {
        parse_mode: 'Markdown',
        ...telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('🏦 Conta Corrente', 'account_type_checking')],
            [telegraf_1.Markup.button.callback('💎 Poupança', 'account_type_savings')],
            [telegraf_1.Markup.button.callback('👛 Carteira', 'account_type_wallet')],
            [telegraf_1.Markup.button.callback('💳 Cartão de Crédito', 'account_type_credit_card')],
            [telegraf_1.Markup.button.callback('❌ Cancelar', 'accounts')],
        ])
    });
}
// Create account - Step 2: Type selected, ask for name
async function handleAccountTypeCallback(ctx, type) {
    const telegramId = ctx.from?.id;
    if (!telegramId)
        return;
    await ctx.answerCbQuery();
    const typeName = getAccountTypeName(type);
    const icon = getAccountIcon(type);
    await session_service_1.sessionService.saveUserState(telegramId, {
        step: 'awaiting_account_name',
        accountType: type,
    });
    await ctx.reply(`${icon} *Criar ${typeName}*\n\n` +
        'Digite o *nome* da conta:\n\n' +
        '_Exemplo: Banco Itaú, Carteira Principal, etc._', {
        parse_mode: 'Markdown',
        ...telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('❌ Cancelar', 'accounts')],
        ])
    });
}
// Create account - Step 3: Ask for initial balance
async function handleAccountNameInput(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId || !ctx.message || !('text' in ctx.message))
        return;
    const state = await session_service_1.sessionService.getUserState(telegramId);
    if (!state || state.step !== 'awaiting_account_name')
        return;
    const accountName = ctx.message.text;
    await session_service_1.sessionService.saveUserState(telegramId, {
        ...state,
        step: 'awaiting_account_balance',
        accountName,
    });
    await ctx.reply(`💰 *Saldo Inicial*\n\n` +
        'Digite o saldo inicial da conta:\n\n' +
        '_Exemplo: 1000 ou 1000.50 ou 0_\n\n' +
        '💡 Pode ser 0 se a conta está vazia.', {
        parse_mode: 'Markdown',
        ...telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('❌ Cancelar', 'accounts')],
        ])
    });
}
// Create account - Step 4: Create the account
async function handleAccountBalanceInput(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId || !ctx.message || !('text' in ctx.message))
        return;
    const state = await session_service_1.sessionService.getUserState(telegramId);
    if (!state || state.step !== 'awaiting_account_balance')
        return;
    const session = await session_service_1.sessionService.getSession(telegramId);
    if (!session)
        return;
    const balanceText = ctx.message.text.replace(/[^0-9.,]/g, '').replace(',', '.');
    const balance = parseFloat(balanceText);
    if (isNaN(balance) || balance < 0) {
        await ctx.reply('❌ Valor inválido. Digite um número válido (ex: 1000 ou 0):');
        return;
    }
    try {
        await ctx.reply('⏳ *Criando conta...*', { parse_mode: 'Markdown' });
        logger_1.loggers.apiRequest('POST', '/accounts', {
            userId: telegramId,
            data: { name: state.accountName, type: state.accountType, initialBalance: balance },
        });
        const account = await api_service_1.apiService.createAccount(session.accessToken, {
            name: state.accountName,
            type: state.accountType,
            initialBalance: balance,
        });
        logger_1.loggers.info('Account created successfully', {
            userId: telegramId,
            accountId: account.id,
            accountName: account.name,
            accountType: account.type,
        });
        await session_service_1.sessionService.clearUserState(telegramId);
        const icon = getAccountIcon(account.type);
        const typeName = getAccountTypeName(account.type);
        await ctx.reply(`✅ *Conta criada com sucesso!*\n\n` +
            `${icon} *${account.name}*\n` +
            `Tipo: ${typeName}\n` +
            `Saldo inicial: ${(0, parser_1.formatCurrency)(balance)}\n\n` +
            '🎉 Sua conta está pronta para uso!', {
            parse_mode: 'Markdown',
            ...telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('📋 Ver Todas as Contas', 'accounts_list')],
                [telegraf_1.Markup.button.callback('➕ Criar Outra Conta', 'accounts_create')],
                [telegraf_1.Markup.button.callback('🔙 Menu Principal', 'menu')],
            ])
        });
    }
    catch (error) {
        logger_1.loggers.apiError('POST', '/accounts', error, { userId: telegramId });
        await session_service_1.sessionService.clearUserState(telegramId);
        await ctx.reply(`❌ *Erro ao criar conta*\n\n${error.response?.data?.message || 'Tente novamente.'}`, {
            parse_mode: 'Markdown',
            ...telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('🔄 Tentar Novamente', 'accounts_create')],
                [telegraf_1.Markup.button.callback('🔙 Voltar', 'accounts')],
            ])
        });
    }
}
// Edit account - Step 1: Select account
async function editAccountSelectCallback(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId)
        return;
    await ctx.answerCbQuery();
    const session = await session_service_1.sessionService.getSession(telegramId);
    if (!session)
        return;
    try {
        const accounts = await api_service_1.apiService.getAccounts(session.accessToken);
        if (!accounts || accounts.length === 0) {
            await ctx.reply('📭 Nenhuma conta para editar.', {
                ...telegraf_1.Markup.inlineKeyboard([
                    [telegraf_1.Markup.button.callback('🔙 Voltar', 'accounts')],
                ])
            });
            return;
        }
        const buttons = accounts.map((account) => {
            const icon = getAccountIcon(account.type);
            return [telegraf_1.Markup.button.callback(`${icon} ${account.name}`, `edit_account_${account.id}`)];
        });
        buttons.push([telegraf_1.Markup.button.callback('❌ Cancelar', 'accounts')]);
        await ctx.reply('✏️ *Editar Conta*\n\n' +
            'Selecione a conta que deseja editar:', {
            parse_mode: 'Markdown',
            ...telegraf_1.Markup.inlineKeyboard(buttons)
        });
    }
    catch (error) {
        logger_1.loggers.apiError('GET', '/accounts', error, { userId: telegramId });
        await ctx.reply(`❌ Erro ao buscar contas.\n\n${error.response?.data?.message || 'Tente novamente.'}`, {
            ...telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('🔙 Voltar', 'accounts')],
            ])
        });
    }
}
// Edit account - Step 2: Show edit options
async function handleEditAccountCallback(ctx, accountId) {
    const telegramId = ctx.from?.id;
    if (!telegramId)
        return;
    await ctx.answerCbQuery();
    const session = await session_service_1.sessionService.getSession(telegramId);
    if (!session)
        return;
    try {
        const accounts = await api_service_1.apiService.getAccounts(session.accessToken);
        const account = accounts.find((a) => a.id === accountId);
        if (!account) {
            await ctx.reply('❌ Conta não encontrada.');
            return;
        }
        const icon = getAccountIcon(account.type);
        const typeName = getAccountTypeName(account.type);
        await ctx.reply(`✏️ *Editar: ${account.name}*\n\n` +
            `${icon} Tipo: ${typeName}\n` +
            `💰 Saldo: ${(0, parser_1.formatCurrency)(account.balance)}\n\n` +
            'O que deseja editar?', {
            parse_mode: 'Markdown',
            ...telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('✏️ Alterar Nome', `edit_name_${accountId}`)],
                [telegraf_1.Markup.button.callback('🔄 Alterar Tipo', `edit_type_${accountId}`)],
                [telegraf_1.Markup.button.callback('❌ Cancelar', 'accounts')],
            ])
        });
    }
    catch (error) {
        logger_1.loggers.apiError('GET', '/accounts', error, { userId: telegramId });
        await ctx.reply('❌ Erro ao buscar conta.');
    }
}
// Delete account - Step 1: Select account
async function deleteAccountSelectCallback(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId)
        return;
    await ctx.answerCbQuery();
    const session = await session_service_1.sessionService.getSession(telegramId);
    if (!session)
        return;
    try {
        const accounts = await api_service_1.apiService.getAccounts(session.accessToken);
        if (!accounts || accounts.length === 0) {
            await ctx.reply('📭 Nenhuma conta para excluir.', {
                ...telegraf_1.Markup.inlineKeyboard([
                    [telegraf_1.Markup.button.callback('🔙 Voltar', 'accounts')],
                ])
            });
            return;
        }
        const buttons = accounts.map((account) => {
            const icon = getAccountIcon(account.type);
            return [telegraf_1.Markup.button.callback(`${icon} ${account.name}`, `delete_account_${account.id}`)];
        });
        buttons.push([telegraf_1.Markup.button.callback('❌ Cancelar', 'accounts')]);
        await ctx.reply('🗑️ *Excluir Conta*\n\n' +
            '⚠️ Selecione a conta que deseja excluir:', {
            parse_mode: 'Markdown',
            ...telegraf_1.Markup.inlineKeyboard(buttons)
        });
    }
    catch (error) {
        logger_1.loggers.apiError('GET', '/accounts', error, { userId: telegramId });
        await ctx.reply(`❌ Erro ao buscar contas.\n\n${error.response?.data?.message || 'Tente novamente.'}`, {
            ...telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('🔙 Voltar', 'accounts')],
            ])
        });
    }
}
// Delete account - Step 2: Confirm deletion
async function handleDeleteAccountCallback(ctx, accountId) {
    const telegramId = ctx.from?.id;
    if (!telegramId)
        return;
    await ctx.answerCbQuery();
    const session = await session_service_1.sessionService.getSession(telegramId);
    if (!session)
        return;
    try {
        const accounts = await api_service_1.apiService.getAccounts(session.accessToken);
        const account = accounts.find((a) => a.id === accountId);
        if (!account) {
            await ctx.reply('❌ Conta não encontrada.');
            return;
        }
        const icon = getAccountIcon(account.type);
        await ctx.reply(`⚠️ *Confirmar Exclusão*\n\n` +
            `${icon} *${account.name}*\n` +
            `💰 Saldo: ${(0, parser_1.formatCurrency)(account.balance)}\n\n` +
            '🚨 *Atenção:* Esta ação não pode ser desfeita!\n\n' +
            'Tem certeza que deseja excluir esta conta?', {
            parse_mode: 'Markdown',
            ...telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('✅ Sim, Excluir', `confirm_delete_${accountId}`)],
                [telegraf_1.Markup.button.callback('❌ Não, Cancelar', 'accounts')],
            ])
        });
    }
    catch (error) {
        logger_1.loggers.apiError('GET', '/accounts', error, { userId: telegramId });
        await ctx.reply('❌ Erro ao buscar conta.');
    }
}
// Delete account - Step 3: Execute deletion
async function handleConfirmDeleteCallback(ctx, accountId) {
    const telegramId = ctx.from?.id;
    if (!telegramId)
        return;
    await ctx.answerCbQuery();
    const session = await session_service_1.sessionService.getSession(telegramId);
    if (!session)
        return;
    try {
        await ctx.reply('⏳ *Excluindo conta...*', { parse_mode: 'Markdown' });
        logger_1.loggers.apiRequest('DELETE', `/accounts/${accountId}`, { userId: telegramId });
        await api_service_1.apiService.deleteAccount(session.accessToken, accountId);
        logger_1.loggers.info('Account deleted successfully', {
            userId: telegramId,
            accountId,
        });
        await ctx.reply(`✅ *Conta excluída com sucesso!*\n\n` +
            'A conta foi removida permanentemente.', {
            parse_mode: 'Markdown',
            ...telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('📋 Ver Contas', 'accounts_list')],
                [telegraf_1.Markup.button.callback('🔙 Menu Principal', 'menu')],
            ])
        });
    }
    catch (error) {
        logger_1.loggers.apiError('DELETE', `/accounts/${accountId}`, error, { userId: telegramId });
        const errorMessage = error.response?.data?.message || 'Erro ao excluir conta.';
        await ctx.reply(`❌ *Erro*\n\n${errorMessage}\n\n` +
            '💡 _A conta pode ter transações associadas._', {
            parse_mode: 'Markdown',
            ...telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('🔙 Voltar', 'accounts')],
            ])
        });
    }
}
// Helper functions
function getAccountIcon(type) {
    const icons = {
        checking: '🏦',
        savings: '💎',
        wallet: '👛',
        credit_card: '💳',
    };
    return icons[type] || '💼';
}
function getAccountTypeName(type) {
    const names = {
        checking: 'Conta Corrente',
        savings: 'Poupança',
        wallet: 'Carteira',
        credit_card: 'Cartão de Crédito',
    };
    return names[type] || type;
}
//# sourceMappingURL=account.commands.js.map