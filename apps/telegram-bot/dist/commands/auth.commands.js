"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCommand = startCommand;
exports.loginCommand = loginCommand;
exports.showLoginOptions = showLoginOptions;
exports.logoutCommand = logoutCommand;
exports.handleLoginFlow = handleLoginFlow;
exports.handleLoginCallback = handleLoginCallback;
exports.handleLoginEmailCallback = handleLoginEmailCallback;
exports.handleLoginPhoneCallback = handleLoginPhoneCallback;
exports.handleLoginCPFCallback = handleLoginCPFCallback;
const telegraf_1 = require("telegraf");
const api_service_1 = require("../services/api.service");
const session_service_1 = require("../services/session.service");
const logger_1 = require("../utils/logger");
async function startCommand(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId)
        return;
    logger_1.loggers.command('/start', ctx.from);
    const isAuth = await session_service_1.sessionService.isAuthenticated(telegramId);
    if (isAuth) {
        const session = await session_service_1.sessionService.getSession(telegramId);
        logger_1.loggers.info('User already authenticated on /start', {
            userId: telegramId,
            userName: session?.name,
        });
        await ctx.reply(`✅ Você já está autenticado como *${session?.name}*!\n\n` +
            'Use /menu para ver as opções disponíveis.', { parse_mode: 'Markdown' });
        return;
    }
    await ctx.reply('✨ *Bem-vindo ao Fayol!*\n\n' +
        '💼 Seu assistente financeiro pessoal inteligente.\n\n' +
        '🎯 *O que você pode fazer:*\n' +
        '• Gerenciar suas finanças\n' +
        '• Adicionar receitas e despesas\n' +
        '• Ver relatórios detalhados\n' +
        '• Categorização automática com IA\n\n' +
        '👉 Para começar, faça login abaixo:', {
        parse_mode: 'Markdown',
        ...telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('🔐 Fazer Login', 'login')],
            [telegraf_1.Markup.button.callback('❓ Ajuda', 'help')],
        ])
    });
}
async function loginCommand(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId)
        return;
    logger_1.loggers.command('/login', ctx.from);
    if (await session_service_1.sessionService.isAuthenticated(telegramId)) {
        const session = await session_service_1.sessionService.getSession(telegramId);
        logger_1.loggers.info('User already authenticated on /login', {
            userId: telegramId,
            userName: session?.name,
        });
        await ctx.reply(`✅ Você já está autenticado como *${session?.name}*!\n\n` +
            'Use /menu para acessar as funcionalidades.', { parse_mode: 'Markdown' });
        return;
    }
    await showLoginOptions(ctx);
}
async function showLoginOptions(ctx) {
    await ctx.reply('🔐 *Login no Fayol*\n\n' +
        'Escolha como deseja fazer login:\n\n' +
        '📧 *E-mail* - Login com e-mail e senha\n' +
        '📱 *Celular* - Login com número de celular\n' +
        '🆔 *CPF* - Login com CPF e senha', {
        parse_mode: 'Markdown',
        ...telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('📧 E-mail', 'login_email')],
            [telegraf_1.Markup.button.callback('📱 Celular', 'login_phone')],
            [telegraf_1.Markup.button.callback('🆔 CPF', 'login_cpf')],
            [telegraf_1.Markup.button.callback('❌ Cancelar', 'cancel')],
        ])
    });
}
async function logoutCommand(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId)
        return;
    logger_1.loggers.command('/logout', ctx.from);
    if (!await session_service_1.sessionService.isAuthenticated(telegramId)) {
        logger_1.loggers.warn('Logout attempted without authentication', { userId: telegramId });
        await ctx.reply('❌ Você não está autenticado.\n\n' +
            'Use /login para fazer login.', {
            ...telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('🔐 Fazer Login', 'login')],
            ])
        });
        return;
    }
    const session = await session_service_1.sessionService.getSession(telegramId);
    await session_service_1.sessionService.deleteSession(telegramId);
    logger_1.loggers.info('User logged out', {
        userId: telegramId,
        userName: session?.name,
    });
    await ctx.reply(`👋 *Logout realizado com sucesso!*\n\n` +
        `Até logo, *${session?.name}*!\n\n` +
        'Quando quiser voltar, é só fazer login novamente.', {
        parse_mode: 'Markdown',
        ...telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('🔐 Fazer Login', 'login')],
        ])
    });
}
async function handleLoginFlow(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId || !ctx.message || !('text' in ctx.message))
        return;
    const state = await session_service_1.sessionService.getUserState(telegramId);
    if (!state)
        return;
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
            }
            else if (loginType === 'phone') {
                const phoneRegex = /^[0-9]{10,11}$/;
                const cleanPhone = text.replace(/\D/g, '');
                isValid = phoneRegex.test(cleanPhone);
                errorMessage = '❌ Celular inválido. Envie apenas números (10-11 dígitos):';
            }
            else if (loginType === 'cpf') {
                const cpfRegex = /^[0-9]{11}$/;
                const cleanCPF = text.replace(/\D/g, '');
                isValid = cpfRegex.test(cleanCPF);
                errorMessage = '❌ CPF inválido. Envie apenas números (11 dígitos):';
            }
            if (!isValid) {
                logger_1.loggers.warn('Invalid login identifier', {
                    userId: telegramId,
                    loginType,
                    input: text.substring(0, 3) + '***', // Log only first 3 chars for privacy
                });
                await ctx.reply(errorMessage);
                return;
            }
            logger_1.loggers.debug('Login identifier validated', {
                userId: telegramId,
                loginType,
            });
            await session_service_1.sessionService.saveUserState(telegramId, {
                ...state,
                step: 'awaiting_password',
                identifier: loginType === 'phone' || loginType === 'cpf' ? text.replace(/\D/g, '') : text,
            });
            await ctx.reply('🔑 *Agora envie sua senha:*\n\n' +
                '_Sua senha não será armazenada._', { parse_mode: 'Markdown' });
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
                }
                else if (state.loginType === 'cpf') {
                    loginIdentifier = state.identifier; // Use CPF directly
                }
                logger_1.loggers.apiRequest('POST', '/auth/login', {
                    userId: telegramId,
                    loginType: state.loginType,
                });
                const session = await api_service_1.apiService.login(loginIdentifier, text);
                await session_service_1.sessionService.saveSession(telegramId, session);
                await session_service_1.sessionService.clearUserState(telegramId);
                logger_1.loggers.info('User logged in successfully', {
                    userId: telegramId,
                    userName: session.name,
                    loginType: state.loginType,
                });
                await ctx.reply(`✅ *Login realizado com sucesso!*\n\n` +
                    `Olá, *${session.name}*! 👋\n\n` +
                    '🎉 Você está pronto para gerenciar suas finanças!\n\n' +
                    'Use /menu para começar.', {
                    parse_mode: 'Markdown',
                    ...telegraf_1.Markup.inlineKeyboard([
                        [telegraf_1.Markup.button.callback('📊 Menu Principal', 'menu')],
                        [telegraf_1.Markup.button.callback('➕ Adicionar Transação', 'add_transaction')],
                    ])
                });
            }
            catch (error) {
                logger_1.loggers.apiError('POST', '/auth/login', error, {
                    userId: telegramId,
                    loginType: state.loginType,
                });
                await session_service_1.sessionService.clearUserState(telegramId);
                const errorMessage = error.response?.data?.message || 'Credenciais inválidas';
                await ctx.reply(`❌ *Erro no login*\n\n` +
                    `${errorMessage}\n\n` +
                    'Tente novamente com /login', {
                    parse_mode: 'Markdown',
                    ...telegraf_1.Markup.inlineKeyboard([
                        [telegraf_1.Markup.button.callback('🔐 Tentar Novamente', 'login')],
                    ])
                });
            }
        }
    }
    catch (error) {
        logger_1.loggers.flowError('login', state?.step || 'unknown', error, {
            userId: telegramId,
            state,
        });
        await session_service_1.sessionService.clearUserState(telegramId);
        await ctx.reply('❌ Erro inesperado. Use /login para tentar novamente.', {
            ...telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('🔐 Fazer Login', 'login')],
            ])
        });
    }
}
// Callback query handlers
async function handleLoginCallback(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId)
        return;
    await ctx.answerCbQuery();
    await showLoginOptions(ctx);
}
async function handleLoginEmailCallback(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId)
        return;
    await ctx.answerCbQuery();
    logger_1.loggers.botEvent('login_method_selected', ctx.from, { method: 'email' });
    await session_service_1.sessionService.saveUserState(telegramId, {
        step: 'awaiting_identifier',
        loginType: 'email'
    });
    await ctx.reply('📧 *Login com E-mail*\n\n' +
        'Por favor, envie seu *e-mail*:\n\n' +
        '_Exemplo: joao@example.com_', { parse_mode: 'Markdown' });
}
async function handleLoginPhoneCallback(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId)
        return;
    await ctx.answerCbQuery();
    logger_1.loggers.botEvent('login_method_selected', ctx.from, { method: 'phone' });
    await session_service_1.sessionService.saveUserState(telegramId, {
        step: 'awaiting_identifier',
        loginType: 'phone'
    });
    await ctx.reply('📱 *Login com Celular*\n\n' +
        'Por favor, envie seu *número de celular*:\n\n' +
        '_Exemplo: 11999999999 (apenas números)_', { parse_mode: 'Markdown' });
}
async function handleLoginCPFCallback(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId)
        return;
    await ctx.answerCbQuery();
    logger_1.loggers.botEvent('login_method_selected', ctx.from, { method: 'cpf' });
    await session_service_1.sessionService.saveUserState(telegramId, {
        step: 'awaiting_identifier',
        loginType: 'cpf'
    });
    await ctx.reply('🆔 *Login com CPF*\n\n' +
        'Por favor, envie seu *CPF*:\n\n' +
        '_Exemplo: 12345678900 (apenas números)_', { parse_mode: 'Markdown' });
}
//# sourceMappingURL=auth.commands.js.map