"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addReceitaCommand = addReceitaCommand;
exports.addDespesaCommand = addDespesaCommand;
exports.cancelCommand = cancelCommand;
exports.handleTransactionFlow = handleTransactionFlow;
const telegraf_1 = require("telegraf");
const api_service_1 = require("../services/api.service");
const session_service_1 = require("../services/session.service");
const parser_1 = require("../utils/parser");
const logger_1 = require("../utils/logger");
async function requireAuth(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId || !await session_service_1.sessionService.isAuthenticated(telegramId)) {
        ctx.reply('❌ Você precisa fazer login primeiro.\n\nUse /login para autenticar.');
        logger_1.loggers.warn('Unauthorized access attempt', { userId: telegramId });
        return false;
    }
    return true;
}
async function addReceitaCommand(ctx) {
    if (!await requireAuth(ctx))
        return;
    const telegramId = ctx.from.id;
    logger_1.loggers.command('/addreceita', ctx.from);
    await session_service_1.sessionService.saveUserState(telegramId, {
        step: 'awaiting_income_data',
        type: 'income',
    });
    await ctx.reply('💰 *Adicionar Receita*\n\n' +
        'Envie o valor e descrição da receita.\n\n' +
        '*Exemplos:*\n' +
        '• `3000 Salário de janeiro`\n' +
        '• `R$ 500,00 Freelance projeto XYZ`\n' +
        '• `Venda de produto 250`\n\n' +
        'Ou use /cancelar para cancelar.', { parse_mode: 'Markdown' });
}
async function addDespesaCommand(ctx) {
    if (!await requireAuth(ctx))
        return;
    const telegramId = ctx.from.id;
    logger_1.loggers.command('/adddespesa', ctx.from);
    await session_service_1.sessionService.saveUserState(telegramId, {
        step: 'awaiting_expense_data',
        type: 'expense',
    });
    await ctx.reply('💳 *Adicionar Despesa*\n\n' +
        'Envie o valor e descrição da despesa.\n\n' +
        '*Exemplos:*\n' +
        '• `50 Uber para o trabalho`\n' +
        '• `R$ 120,00 Supermercado`\n' +
        '• `Almoço no restaurante 45`\n\n' +
        'Ou use /cancelar para cancelar.', { parse_mode: 'Markdown' });
}
async function cancelCommand(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId)
        return;
    logger_1.loggers.command('/cancelar', ctx.from);
    const state = await session_service_1.sessionService.getUserState(telegramId);
    if (!state) {
        await ctx.reply('❌ Não há nenhuma operação em andamento.');
        return;
    }
    await session_service_1.sessionService.clearUserState(telegramId);
    await ctx.reply('✅ Operação cancelada.');
}
async function handleTransactionFlow(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId || !ctx.message || !('text' in ctx.message))
        return;
    const state = await session_service_1.sessionService.getUserState(telegramId);
    if (!state)
        return;
    const text = ctx.message.text;
    try {
        // Handle income/expense data input
        if (state.step === 'awaiting_income_data' || state.step === 'awaiting_expense_data') {
            logger_1.loggers.debug('Processing transaction input', { userId: telegramId, step: state.step, input: text });
            const parsed = (0, parser_1.parseTransactionText)(text);
            if (!parsed) {
                logger_1.loggers.warn('Invalid transaction format', { userId: telegramId, input: text });
                await ctx.reply('❌ *Formato inválido*\n\n' +
                    'Por favor, envie no formato: `valor descrição`\n\n' +
                    'Exemplos:\n' +
                    '• `50 Uber para o trabalho`\n' +
                    '• `R$ 120,00 Supermercado`', { parse_mode: 'Markdown' });
                return;
            }
            logger_1.loggers.info('Transaction parsed successfully', {
                userId: telegramId,
                amount: parsed.amount,
                description: parsed.description,
            });
            // Check if user has session
            const session = await session_service_1.sessionService.getSession(telegramId);
            if (!session) {
                logger_1.loggers.sessionError('Session not found during transaction flow', telegramId);
                await session_service_1.sessionService.clearUserState(telegramId);
                await ctx.reply('❌ *Sessão expirada*\n\n' +
                    'Por favor, faça login novamente com /login', { parse_mode: 'Markdown' });
                return;
            }
            // Get user accounts
            try {
                logger_1.loggers.apiRequest('GET', '/accounts', { userId: telegramId });
                const accounts = await api_service_1.apiService.getAccounts(session.accessToken);
                if (!accounts || accounts.length === 0) {
                    logger_1.loggers.warn('No accounts found for user', { userId: telegramId });
                    await session_service_1.sessionService.clearUserState(telegramId);
                    await ctx.reply('❌ *Você não tem contas cadastradas*\n\n' +
                        'Crie uma conta primeiro usando /contas', {
                        parse_mode: 'Markdown',
                        ...telegraf_1.Markup.inlineKeyboard([
                            [telegraf_1.Markup.button.callback('💼 Gerenciar Contas', 'accounts')],
                        ])
                    });
                    return;
                }
                logger_1.loggers.info('Accounts retrieved', { userId: telegramId, count: accounts.length });
                let message = `✅ Transação: *${(0, parser_1.formatCurrency)(parsed.amount)}* - ${parsed.description}\n\n`;
                message += '*Selecione a conta:*\n\n';
                accounts.forEach((account, index) => {
                    message += `${index + 1}. ${account.name} (${account.type})\n`;
                });
                message += '\nEnvie o número da conta:';
                // Save accounts in state
                await session_service_1.sessionService.saveUserState(telegramId, {
                    ...state,
                    step: 'awaiting_account_selection',
                    amount: parsed.amount,
                    description: parsed.description,
                    accounts,
                });
                await ctx.reply(message, { parse_mode: 'Markdown' });
            }
            catch (error) {
                logger_1.loggers.apiError('GET', '/accounts', error, { userId: telegramId });
                await session_service_1.sessionService.clearUserState(telegramId);
                await ctx.reply('❌ *Erro ao buscar contas*\n\n' +
                    'Tente novamente mais tarde.', { parse_mode: 'Markdown' });
            }
        }
        // Handle account selection
        else if (state.step === 'awaiting_account_selection') {
            const accountIndex = parseInt(text) - 1;
            if (isNaN(accountIndex) || accountIndex < 0 || accountIndex >= state.accounts.length) {
                logger_1.loggers.warn('Invalid account selection', { userId: telegramId, input: text });
                await ctx.reply('❌ Número de conta inválido. Tente novamente.');
                return;
            }
            const selectedAccount = state.accounts[accountIndex];
            logger_1.loggers.info('Account selected', {
                userId: telegramId,
                accountId: selectedAccount.id,
                accountName: selectedAccount.name,
            });
            // Check session again
            const session = await session_service_1.sessionService.getSession(telegramId);
            if (!session) {
                logger_1.loggers.sessionError('Session not found during account selection', telegramId);
                await session_service_1.sessionService.clearUserState(telegramId);
                await ctx.reply('❌ *Sessão expirada*\n\n' +
                    'Por favor, faça login novamente com /login', { parse_mode: 'Markdown' });
                return;
            }
            try {
                // Use AI to suggest category
                logger_1.loggers.apiRequest('POST', '/ai/suggest-category', {
                    userId: telegramId,
                    description: state.description,
                });
                const suggestion = await api_service_1.apiService.suggestCategory(session.accessToken, state.description);
                logger_1.loggers.info('Category suggested', {
                    userId: telegramId,
                    category: suggestion.category,
                    subcategory: suggestion.subcategory,
                    confidence: suggestion.confidence,
                });
                // Get categories
                const categories = await api_service_1.apiService.getCategories(session.accessToken);
                const category = categories.find((c) => c.name === suggestion.category);
                if (!category) {
                    logger_1.loggers.error('Category not found', undefined, {
                        userId: telegramId,
                        suggestedCategory: suggestion.category,
                    });
                    await session_service_1.sessionService.clearUserState(telegramId);
                    await ctx.reply('❌ Erro ao buscar categorias. Tente novamente.');
                    return;
                }
                // Create transaction with suggested category
                const transactionData = {
                    accountId: selectedAccount.id,
                    categoryId: category.id,
                    movementType: state.type,
                    launchType: state.type, // income, expense, investment, transfer
                    amount: state.amount,
                    description: state.description,
                    isRecurring: false, // Transações simples não são recorrentes
                    // Adicionar data correta baseada no tipo
                    ...(state.type === 'expense'
                        ? { dueDate: new Date().toISOString() } // Data de vencimento para despesas
                        : { receiptDate: new Date().toISOString() } // Data de recebimento para receitas
                    ),
                };
                // If there's a subcategory suggestion, try to find it
                if (suggestion.subcategory) {
                    const subcategories = await api_service_1.apiService.getSubcategories(session.accessToken, category.id);
                    const subcategory = subcategories.find((s) => s.name === suggestion.subcategory);
                    if (subcategory) {
                        transactionData.subcategoryId = subcategory.id;
                    }
                }
                logger_1.loggers.apiRequest('POST', '/transactions', {
                    userId: telegramId,
                    data: transactionData,
                });
                const transaction = await api_service_1.apiService.createTransaction(session.accessToken, transactionData);
                logger_1.loggers.info('Transaction created successfully', {
                    userId: telegramId,
                    transactionId: transaction.id,
                    amount: state.amount,
                    type: state.type,
                });
                await session_service_1.sessionService.clearUserState(telegramId);
                const icon = state.type === 'income' ? '💰' : '💳';
                const typeLabel = state.type === 'income' ? 'Receita' : 'Despesa';
                await ctx.reply(`${icon} *${typeLabel} Registrada!*\n\n` +
                    `*Valor:* ${(0, parser_1.formatCurrency)(state.amount)}\n` +
                    `*Descrição:* ${state.description}\n` +
                    `*Conta:* ${selectedAccount.name}\n` +
                    `*Categoria:* ${category.name}${suggestion.subcategory ? ` > ${suggestion.subcategory}` : ''}\n` +
                    `*Código:* #${transaction.code}\n\n` +
                    '✅ Transação salva com sucesso!', { parse_mode: 'Markdown' });
            }
            catch (error) {
                logger_1.loggers.apiError('POST', '/transactions', error, {
                    userId: telegramId,
                    transactionData: {
                        amount: state.amount,
                        description: state.description,
                        type: state.type,
                    },
                });
                await session_service_1.sessionService.clearUserState(telegramId);
                const errorMessage = error.response?.data?.message || 'Erro ao processar transação';
                const errorDetails = error.response?.data?.error || '';
                await ctx.reply(`❌ *Erro ao criar transação*\n\n` +
                    `${errorMessage}\n` +
                    (errorDetails ? `\n_Detalhes: ${errorDetails}_\n` : '') +
                    '\nTente novamente com /addreceita ou /adddespesa', { parse_mode: 'Markdown' });
            }
        }
    }
    catch (error) {
        logger_1.loggers.flowError('transaction', state.step, error, {
            userId: telegramId,
            state,
        });
        await session_service_1.sessionService.clearUserState(telegramId);
        await ctx.reply('❌ Erro inesperado. Use /addreceita ou /adddespesa para tentar novamente.');
    }
}
//# sourceMappingURL=transaction.commands.js.map