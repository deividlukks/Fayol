import { Context } from 'telegraf';
import { Markup } from 'telegraf';
import { apiService } from '../services/api.service';
import { sessionService } from '../services/session.service';
import { formatCurrency } from '../utils/parser';
import { loggers } from '../utils/logger';

async function requireAuth(ctx: Context): Promise<boolean> {
  const telegramId = ctx.from?.id;
  if (!telegramId || !await sessionService.isAuthenticated(telegramId)) {
    ctx.reply('❌ Você precisa fazer login primeiro.\n\nUse /login para autenticar.');
    loggers.warn('Unauthorized access attempt', { userId: telegramId });
    return false;
  }
  return true;
}

export async function orcamentosCommand(ctx: Context) {
  if (!await requireAuth(ctx)) return;

  const telegramId = ctx.from!.id;
  const session = await sessionService.getSession(telegramId);

  loggers.command('/orcamentos', ctx.from);

  try {
    await ctx.reply('⏳ Buscando seus orçamentos...');

    loggers.apiRequest('GET', '/budgets/status', { userId: telegramId });
    const budgets = await apiService.getBudgetStatus(session!.accessToken);

    if (!budgets || budgets.length === 0) {
      await ctx.reply(
        '📊 *Orçamentos*\n\n' +
          'Você ainda não tem orçamentos configurados.\n\n' +
          'Use /novoorcamento para criar um!',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    let message = '📊 *Seus Orçamentos*\n\n';

    budgets.forEach((budget: any) => {
      const icon = budget.isOverBudget ? '🔴' :
                   budget.isNearLimit ? '🟡' : '🟢';

      message += `${icon} *${budget.name}*\n`;
      message += `Categoria: ${budget.category}\n`;
      message += `Período: ${translatePeriod(budget.period)}\n`;
      message += `Orçamento: ${formatCurrency(budget.amount)}\n`;
      message += `Gasto: ${formatCurrency(budget.spent)} (${budget.percentage}%)\n`;
      message += `Disponível: ${formatCurrency(budget.remaining)}\n`;

      if (budget.isOverBudget) {
        message += `⚠️ *ATENÇÃO: Orçamento ultrapassado!*\n`;
      } else if (budget.isNearLimit) {
        message += `⚡ Próximo do limite (${budget.alertThreshold}%)\n`;
      }

      message += '\n';
    });

    message += '_Use /novoorcamento para criar um novo orçamento_';

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error: any) {
    loggers.apiError('GET', '/budgets/status', error, { userId: telegramId });
    const errorMessage = error.response?.data?.message || 'Erro ao buscar orçamentos';
    await ctx.reply(`❌ ${errorMessage}`);
  }
}

export async function novoOrcamentoCommand(ctx: Context) {
  if (!await requireAuth(ctx)) return;

  const telegramId = ctx.from!.id;
  loggers.command('/novoorcamento', ctx.from);

  await sessionService.saveUserState(telegramId, {
    step: 'awaiting_budget_name',
    budgetData: {},
  });

  await ctx.reply(
    '💰 *Criar Novo Orçamento*\n\n' +
      'Qual será o nome do orçamento?\n\n' +
      'Exemplos:\n' +
      '• `Alimentação Mensal`\n' +
      '• `Orçamento de Transporte`\n' +
      '• `Lazer e Entretenimento`\n\n' +
      'Ou use /cancelar para cancelar.',
    { parse_mode: 'Markdown' }
  );
}

export async function alertasCommand(ctx: Context) {
  if (!await requireAuth(ctx)) return;

  const telegramId = ctx.from!.id;
  const session = await sessionService.getSession(telegramId);

  loggers.command('/alertas', ctx.from);

  try {
    await ctx.reply('⏳ Buscando alertas...');

    loggers.apiRequest('GET', '/budgets/alerts/unread', { userId: telegramId });
    const alerts = await apiService.getUnreadAlerts(session!.accessToken);

    if (!alerts || alerts.length === 0) {
      await ctx.reply(
        '🔔 *Alertas*\n\n' +
          'Você não tem alertas não lidos.\n\n' +
          '✅ Tudo certo com seus orçamentos!',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    let message = '🔔 *Alertas de Orçamento*\n\n';

    alerts.forEach((alert: any, index: number) => {
      const date = new Date(alert.createdAt);
      const dateStr = date.toLocaleDateString('pt-BR');

      message += `${index + 1}. ${alert.message}\n`;
      message += `   📅 ${dateStr}\n\n`;
    });

    message += `_Total: ${alerts.length} alerta(s) não lido(s)_`;

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('✅ Marcar todos como lidos', 'mark_all_alerts_read')],
      ])
    });
  } catch (error: any) {
    loggers.apiError('GET', '/budgets/alerts/unread', error, { userId: telegramId });
    const errorMessage = error.response?.data?.message || 'Erro ao buscar alertas';
    await ctx.reply(`❌ ${errorMessage}`);
  }
}

export async function handleBudgetFlow(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId || !ctx.message || !('text' in ctx.message)) return;

  const state = await sessionService.getUserState(telegramId);
  if (!state || !state.step?.startsWith('awaiting_budget_')) return;

  const text = ctx.message.text;
  const session = await sessionService.getSession(telegramId);

  if (!session) {
    await sessionService.clearUserState(telegramId);
    await ctx.reply('❌ Sessão expirada. Faça login novamente com /login');
    return;
  }

  try {
    if (state.step === 'awaiting_budget_name') {
      await sessionService.saveUserState(telegramId, {
        ...state,
        step: 'awaiting_budget_amount',
        budgetData: { ...state.budgetData, name: text },
      });

      await ctx.reply(
        '💵 Qual será o valor do orçamento?\n\n' +
          'Envie apenas o valor (ex: 1500 ou 1500.00)',
        { parse_mode: 'Markdown' }
      );
    } else if (state.step === 'awaiting_budget_amount') {
      const amount = parseFloat(text.replace(',', '.').replace(/[^\d.]/g, ''));

      if (isNaN(amount) || amount <= 0) {
        await ctx.reply('❌ Valor inválido. Digite um número maior que zero.');
        return;
      }

      await sessionService.saveUserState(telegramId, {
        ...state,
        step: 'awaiting_budget_period',
        budgetData: { ...state.budgetData, amount },
      });

      await ctx.reply(
        '📅 Qual será o período do orçamento?\n\n' +
          '1️⃣ Diário\n' +
          '2️⃣ Semanal\n' +
          '3️⃣ Mensal\n' +
          '4️⃣ Anual\n\n' +
          'Digite o número correspondente:',
        { parse_mode: 'Markdown' }
      );
    } else if (state.step === 'awaiting_budget_period') {
      const periods: { [key: string]: string } = {
        '1': 'daily',
        '2': 'weekly',
        '3': 'monthly',
        '4': 'yearly',
      };

      const period = periods[text];
      if (!period) {
        await ctx.reply('❌ Opção inválida. Digite 1, 2, 3 ou 4.');
        return;
      }

      await sessionService.saveUserState(telegramId, {
        ...state,
        step: 'awaiting_budget_category',
        budgetData: { ...state.budgetData, period },
      });

      // Buscar categorias
      const categories = await apiService.getCategories(session.accessToken);
      const expenseCategories = categories.filter((c: any) => c.type === 'expense');

      let message = '📁 Escolha uma categoria (ou digite 0 para geral):\n\n';
      message += '0️⃣ Orçamento Geral (todas as despesas)\n\n';

      expenseCategories.forEach((cat: any, index: number) => {
        message += `${index + 1}️⃣ ${cat.name}\n`;
      });

      message += '\nDigite o número:';

      await sessionService.saveUserState(telegramId, {
        ...state,
        step: 'awaiting_budget_category',
        budgetData: { ...state.budgetData, period },
        categories: expenseCategories,
      });

      await ctx.reply(message);
    } else if (state.step === 'awaiting_budget_category') {
      const choice = parseInt(text);

      if (isNaN(choice) || choice < 0 || choice > state.categories.length) {
        await ctx.reply('❌ Opção inválida.');
        return;
      }

      const categoryId = choice === 0 ? null : state.categories[choice - 1].id;
      const categoryName = choice === 0 ? 'Geral' : state.categories[choice - 1].name;

      // Criar orçamento
      const budgetData = {
        name: state.budgetData.name,
        amount: state.budgetData.amount,
        period: state.budgetData.period,
        categoryId,
        startDate: new Date().toISOString(),
        alertThreshold: 80, // Padrão: 80%
        isActive: true,
      };

      loggers.apiRequest('POST', '/budgets', { userId: telegramId, data: budgetData });
      const budget = await apiService.createBudget(session.accessToken, budgetData);

      await sessionService.clearUserState(telegramId);

      await ctx.reply(
        '✅ *Orçamento Criado com Sucesso!*\n\n' +
          `📋 *Nome:* ${budget.name}\n` +
          `💵 *Valor:* ${formatCurrency(budget.amount)}\n` +
          `📅 *Período:* ${translatePeriod(budget.period)}\n` +
          `📁 *Categoria:* ${categoryName}\n` +
          `⚡ *Alerta em:* ${budget.alertThreshold}%\n\n` +
          '🔔 Você receberá alertas quando atingir o limite configurado!\n\n' +
          'Use /orcamentos para ver todos os seus orçamentos.',
        { parse_mode: 'Markdown' }
      );
    }
  } catch (error: any) {
    loggers.error('Erro no fluxo de orçamento', error, { userId: telegramId, state });
    await sessionService.clearUserState(telegramId);
    await ctx.reply('❌ Erro ao criar orçamento. Tente novamente com /novoorcamento');
  }
}

function translatePeriod(period: string): string {
  const translations: { [key: string]: string } = {
    daily: 'Diário',
    weekly: 'Semanal',
    monthly: 'Mensal',
    yearly: 'Anual',
  };
  return translations[period] || period;
}
