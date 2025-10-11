import { Context } from 'telegraf';
import { apiService } from '../services/api.service';
import { sessionService } from '../services/session.service';
import { formatCurrency, formatDate, formatDateTime } from '../utils/parser';
import { loggers } from '../utils/logger';

async function requireAuth(ctx: Context): Promise<boolean> {
  const telegramId = ctx.from?.id;
  if (!telegramId || !await sessionService.isAuthenticated(telegramId)) {
    loggers.warn('Unauthorized access attempt', { userId: telegramId });
    ctx.reply('❌ Você precisa fazer login primeiro.\n\nUse /login para autenticar.');
    return false;
  }
  return true;
}

export async function saldoCommand(ctx: Context) {
  if (!await requireAuth(ctx)) return;

  const telegramId = ctx.from!.id;
  const session = await sessionService.getSession(telegramId);

  loggers.command('/saldo', ctx.from);

  try {
    await ctx.reply('⏳ Consultando saldo...');

    loggers.apiRequest('GET', '/dashboard/balance', { userId: telegramId });
    const balance = await apiService.getBalance(session!.accessToken);

    loggers.apiRequest('GET', '/dashboard/summary-cards', { userId: telegramId });
    const summaryCards = await apiService.getSummaryCards(session!.accessToken);

    loggers.info('Balance retrieved successfully', { userId: telegramId });

    let message = '💰 *Saldo Geral*\n\n';
    message += `*Total:* ${formatCurrency(balance.totalBalance)}\n\n`;

    message += '📊 *Resumo do Mês*\n\n';
    message += `💵 Receitas: ${formatCurrency(summaryCards.totalIncome)}\n`;
    message += `💳 Despesas: ${formatCurrency(summaryCards.totalExpenses)}\n`;
    message += `💰 Saldo: ${formatCurrency(summaryCards.balance)}\n`;
    message += `📈 Investimentos: ${formatCurrency(summaryCards.totalInvestments)}\n\n`;

    if (balance.accounts && balance.accounts.length > 0) {
      message += '💼 *Contas:*\n\n';
      balance.accounts.forEach((account: any) => {
        const icon = account.type === 'checking' ? '🏦' :
                     account.type === 'savings' ? '💎' :
                     account.type === 'wallet' ? '👛' : '💳';
        message += `${icon} ${account.name}: ${formatCurrency(account.balance)}\n`;
      });
    }

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error: any) {
    loggers.apiError('GET', '/dashboard/balance', error, { userId: telegramId });
    const errorMessage = error.response?.data?.message || 'Erro ao buscar saldo';
    await ctx.reply(`❌ ${errorMessage}`);
  }
}

export async function extratoCommand(ctx: Context) {
  if (!await requireAuth(ctx)) return;

  const telegramId = ctx.from!.id;
  const session = await sessionService.getSession(telegramId);

  loggers.command('/extrato', ctx.from);

  try {
    await ctx.reply('⏳ Buscando últimas transações...');

    loggers.apiRequest('GET', '/transactions', { userId: telegramId, limit: 10 });
    const result = await apiService.getTransactions(session!.accessToken, {
      limit: 10,
      offset: 0,
    });

    loggers.info('Transactions retrieved successfully', {
      userId: telegramId,
      count: result.transactions?.length || 0,
    });

    if (!result.transactions || result.transactions.length === 0) {
      await ctx.reply('📝 Você ainda não tem transações registradas.\n\nUse /addreceita ou /adddespesa para começar!');
      return;
    }

    let message = '📝 *Últimas Transações*\n\n';

    result.transactions.forEach((t: any) => {
      const icon = t.movementType === 'income' ? '💰' :
                   t.movementType === 'expense' ? '💳' :
                   t.movementType === 'investment' ? '📈' : '🔄';

      const sign = t.movementType === 'income' ? '+' : '-';

      message += `${icon} *${sign}${formatCurrency(t.amount)}*\n`;
      message += `${t.description}\n`;
      message += `📁 ${t.category.name}`;
      if (t.subcategory) {
        message += ` > ${t.subcategory.name}`;
      }
      message += `\n📅 ${formatDate(t.transactionDate)}\n`;
      message += `#${t.code}\n\n`;
    });

    message += `_Mostrando ${result.transactions.length} de ${result.total} transações_`;

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error: any) {
    loggers.apiError('GET', '/transactions', error, { userId: telegramId });
    const errorMessage = error.response?.data?.message || 'Erro ao buscar extrato';
    await ctx.reply(`❌ ${errorMessage}`);
  }
}

export async function relatorioCommand(ctx: Context) {
  if (!await requireAuth(ctx)) return;

  const telegramId = ctx.from!.id;
  const session = await sessionService.getSession(telegramId);

  loggers.command('/relatorio', ctx.from);

  try {
    await ctx.reply('⏳ Gerando relatório mensal...');

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    loggers.apiRequest('GET', `/reports/monthly/${year}/${month}`, { userId: telegramId });
    const report = await apiService.getMonthlyReport(session!.accessToken, year, month);

    loggers.apiRequest('GET', '/reports/spending-by-category', { userId: telegramId });
    const spending = await apiService.getSpendingByCategory(session!.accessToken);

    loggers.info('Report generated successfully', {
      userId: telegramId,
      year,
      month,
    });

    let message = `📊 *Relatório Mensal*\n`;
    message += `📅 ${getMonthName(month)}/${year}\n\n`;

    message += '💰 *Resumo Financeiro*\n\n';
    message += `💵 Receitas: ${formatCurrency(report.totalIncome)}\n`;
    message += `💳 Despesas: ${formatCurrency(report.totalExpenses)}\n`;
    message += `💰 Saldo: ${formatCurrency(report.balance)}\n`;
    message += `📈 Investimentos: ${formatCurrency(report.totalInvestments)}\n\n`;

    if (report.savingsRate !== undefined) {
      const savingsEmoji = report.savingsRate > 20 ? '🎯' :
                          report.savingsRate > 10 ? '👍' : '⚠️';
      message += `${savingsEmoji} Taxa de Economia: ${report.savingsRate.toFixed(1)}%\n\n`;
    }

    if (spending && spending.length > 0) {
      message += '📁 *Gastos por Categoria*\n\n';

      spending.slice(0, 5).forEach((cat: any) => {
        message += `${cat.category}: ${formatCurrency(cat.total)} (${cat.percentage.toFixed(1)}%)\n`;
      });

      if (spending.length > 5) {
        message += `\n_e mais ${spending.length - 5} categorias..._\n`;
      }
    }

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error: any) {
    loggers.apiError('GET', '/reports', error, { userId: telegramId });
    const errorMessage = error.response?.data?.message || 'Erro ao gerar relatório';
    await ctx.reply(`❌ ${errorMessage}`);
  }
}

function getMonthName(month: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[month - 1] || '';
}
