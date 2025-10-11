"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saldoCommand = saldoCommand;
exports.extratoCommand = extratoCommand;
exports.relatorioCommand = relatorioCommand;
const api_service_1 = require("../services/api.service");
const session_service_1 = require("../services/session.service");
const parser_1 = require("../utils/parser");
const logger_1 = require("../utils/logger");
async function requireAuth(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId || !await session_service_1.sessionService.isAuthenticated(telegramId)) {
        logger_1.loggers.warn('Unauthorized access attempt', { userId: telegramId });
        ctx.reply('❌ Você precisa fazer login primeiro.\n\nUse /login para autenticar.');
        return false;
    }
    return true;
}
async function saldoCommand(ctx) {
    if (!await requireAuth(ctx))
        return;
    const telegramId = ctx.from.id;
    const session = await session_service_1.sessionService.getSession(telegramId);
    logger_1.loggers.command('/saldo', ctx.from);
    try {
        await ctx.reply('⏳ Consultando saldo...');
        logger_1.loggers.apiRequest('GET', '/dashboard/balance', { userId: telegramId });
        const balance = await api_service_1.apiService.getBalance(session.accessToken);
        logger_1.loggers.apiRequest('GET', '/dashboard/summary-cards', { userId: telegramId });
        const summaryCards = await api_service_1.apiService.getSummaryCards(session.accessToken);
        logger_1.loggers.info('Balance retrieved successfully', { userId: telegramId });
        let message = '💰 *Saldo Geral*\n\n';
        message += `*Total:* ${(0, parser_1.formatCurrency)(balance.totalBalance)}\n\n`;
        message += '📊 *Resumo do Mês*\n\n';
        message += `💵 Receitas: ${(0, parser_1.formatCurrency)(summaryCards.totalIncome)}\n`;
        message += `💳 Despesas: ${(0, parser_1.formatCurrency)(summaryCards.totalExpenses)}\n`;
        message += `💰 Saldo: ${(0, parser_1.formatCurrency)(summaryCards.balance)}\n`;
        message += `📈 Investimentos: ${(0, parser_1.formatCurrency)(summaryCards.totalInvestments)}\n\n`;
        if (balance.accounts && balance.accounts.length > 0) {
            message += '💼 *Contas:*\n\n';
            balance.accounts.forEach((account) => {
                const icon = account.type === 'checking' ? '🏦' :
                    account.type === 'savings' ? '💎' :
                        account.type === 'wallet' ? '👛' : '💳';
                message += `${icon} ${account.name}: ${(0, parser_1.formatCurrency)(account.balance)}\n`;
            });
        }
        await ctx.reply(message, { parse_mode: 'Markdown' });
    }
    catch (error) {
        logger_1.loggers.apiError('GET', '/dashboard/balance', error, { userId: telegramId });
        const errorMessage = error.response?.data?.message || 'Erro ao buscar saldo';
        await ctx.reply(`❌ ${errorMessage}`);
    }
}
async function extratoCommand(ctx) {
    if (!await requireAuth(ctx))
        return;
    const telegramId = ctx.from.id;
    const session = await session_service_1.sessionService.getSession(telegramId);
    logger_1.loggers.command('/extrato', ctx.from);
    try {
        await ctx.reply('⏳ Buscando últimas transações...');
        logger_1.loggers.apiRequest('GET', '/transactions', { userId: telegramId, limit: 10 });
        const result = await api_service_1.apiService.getTransactions(session.accessToken, {
            limit: 10,
            offset: 0,
        });
        logger_1.loggers.info('Transactions retrieved successfully', {
            userId: telegramId,
            count: result.transactions?.length || 0,
        });
        if (!result.transactions || result.transactions.length === 0) {
            await ctx.reply('📝 Você ainda não tem transações registradas.\n\nUse /addreceita ou /adddespesa para começar!');
            return;
        }
        let message = '📝 *Últimas Transações*\n\n';
        result.transactions.forEach((t) => {
            const icon = t.movementType === 'income' ? '💰' :
                t.movementType === 'expense' ? '💳' :
                    t.movementType === 'investment' ? '📈' : '🔄';
            const sign = t.movementType === 'income' ? '+' : '-';
            message += `${icon} *${sign}${(0, parser_1.formatCurrency)(t.amount)}*\n`;
            message += `${t.description}\n`;
            message += `📁 ${t.category.name}`;
            if (t.subcategory) {
                message += ` > ${t.subcategory.name}`;
            }
            message += `\n📅 ${(0, parser_1.formatDate)(t.transactionDate)}\n`;
            message += `#${t.code}\n\n`;
        });
        message += `_Mostrando ${result.transactions.length} de ${result.total} transações_`;
        await ctx.reply(message, { parse_mode: 'Markdown' });
    }
    catch (error) {
        logger_1.loggers.apiError('GET', '/transactions', error, { userId: telegramId });
        const errorMessage = error.response?.data?.message || 'Erro ao buscar extrato';
        await ctx.reply(`❌ ${errorMessage}`);
    }
}
async function relatorioCommand(ctx) {
    if (!await requireAuth(ctx))
        return;
    const telegramId = ctx.from.id;
    const session = await session_service_1.sessionService.getSession(telegramId);
    logger_1.loggers.command('/relatorio', ctx.from);
    try {
        await ctx.reply('⏳ Gerando relatório mensal...');
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        logger_1.loggers.apiRequest('GET', `/reports/monthly/${year}/${month}`, { userId: telegramId });
        const report = await api_service_1.apiService.getMonthlyReport(session.accessToken, year, month);
        logger_1.loggers.apiRequest('GET', '/reports/spending-by-category', { userId: telegramId });
        const spending = await api_service_1.apiService.getSpendingByCategory(session.accessToken);
        logger_1.loggers.info('Report generated successfully', {
            userId: telegramId,
            year,
            month,
        });
        let message = `📊 *Relatório Mensal*\n`;
        message += `📅 ${getMonthName(month)}/${year}\n\n`;
        message += '💰 *Resumo Financeiro*\n\n';
        message += `💵 Receitas: ${(0, parser_1.formatCurrency)(report.totalIncome)}\n`;
        message += `💳 Despesas: ${(0, parser_1.formatCurrency)(report.totalExpenses)}\n`;
        message += `💰 Saldo: ${(0, parser_1.formatCurrency)(report.balance)}\n`;
        message += `📈 Investimentos: ${(0, parser_1.formatCurrency)(report.totalInvestments)}\n\n`;
        if (report.savingsRate !== undefined) {
            const savingsEmoji = report.savingsRate > 20 ? '🎯' :
                report.savingsRate > 10 ? '👍' : '⚠️';
            message += `${savingsEmoji} Taxa de Economia: ${report.savingsRate.toFixed(1)}%\n\n`;
        }
        if (spending && spending.length > 0) {
            message += '📁 *Gastos por Categoria*\n\n';
            spending.slice(0, 5).forEach((cat) => {
                message += `${cat.category}: ${(0, parser_1.formatCurrency)(cat.total)} (${cat.percentage.toFixed(1)}%)\n`;
            });
            if (spending.length > 5) {
                message += `\n_e mais ${spending.length - 5} categorias..._\n`;
            }
        }
        await ctx.reply(message, { parse_mode: 'Markdown' });
    }
    catch (error) {
        logger_1.loggers.apiError('GET', '/reports', error, { userId: telegramId });
        const errorMessage = error.response?.data?.message || 'Erro ao gerar relatório';
        await ctx.reply(`❌ ${errorMessage}`);
    }
}
function getMonthName(month) {
    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1] || '';
}
//# sourceMappingURL=query.commands.js.map