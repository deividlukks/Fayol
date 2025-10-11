"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoriasCommand = categoriasCommand;
const api_service_1 = require("../services/api.service");
const session_service_1 = require("../services/session.service");
async function requireAuth(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId || !await session_service_1.sessionService.isAuthenticated(telegramId)) {
        ctx.reply('❌ Você precisa fazer login primeiro.\n\nUse /login para autenticar.');
        return false;
    }
    return true;
}
async function categoriasCommand(ctx) {
    if (!await requireAuth(ctx))
        return;
    const telegramId = ctx.from.id;
    const session = await session_service_1.sessionService.getSession(telegramId);
    try {
        await ctx.reply('⏳ Buscando categorias...');
        const categories = await api_service_1.apiService.getCategories(session.accessToken);
        if (!categories || categories.length === 0) {
            await ctx.reply('📁 Nenhuma categoria encontrada.');
            return;
        }
        // Group by type
        const incomeCategories = categories.filter((c) => c.type === 'income');
        const expenseCategories = categories.filter((c) => c.type === 'expense');
        const investmentCategories = categories.filter((c) => c.type === 'investment');
        let message = '📁 *Categorias Disponíveis*\n\n';
        if (incomeCategories.length > 0) {
            message += '💰 *Receitas*\n';
            incomeCategories.forEach((cat) => {
                const icon = cat.isSystem ? '🔒' : '✏️';
                message += `${icon} ${cat.name}\n`;
            });
            message += '\n';
        }
        if (expenseCategories.length > 0) {
            message += '💳 *Despesas*\n';
            expenseCategories.forEach((cat) => {
                const icon = cat.isSystem ? '🔒' : '✏️';
                message += `${icon} ${cat.name}\n`;
            });
            message += '\n';
        }
        if (investmentCategories.length > 0) {
            message += '📈 *Investimentos*\n';
            investmentCategories.forEach((cat) => {
                const icon = cat.isSystem ? '🔒' : '✏️';
                message += `${icon} ${cat.name}\n`;
            });
            message += '\n';
        }
        message += '\n🔒 = Categoria do sistema\n';
        message += '✏️ = Categoria personalizada\n\n';
        message += '_Categorias personalizadas podem ser criadas via API_';
        await ctx.reply(message, { parse_mode: 'Markdown' });
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        const errorMessage = error.response?.data?.message || 'Erro ao buscar categorias';
        await ctx.reply(`❌ ${errorMessage}`);
    }
}
//# sourceMappingURL=category.commands.js.map