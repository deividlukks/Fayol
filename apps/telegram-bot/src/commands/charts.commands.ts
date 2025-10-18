import { Context } from 'telegraf';
import { apiService } from '../services/api.service';
import { sessionService } from '../services/session.service';
import { loggers } from '../utils/logger';
import axios from 'axios';
import { InputFile } from 'telegraf/types';

async function requireAuth(ctx: Context): Promise<boolean> {
  const telegramId = ctx.from?.id;
  if (!telegramId || !await sessionService.isAuthenticated(telegramId)) {
    ctx.reply('❌ Você precisa fazer login primeiro.\n\nUse /login para autenticar.');
    loggers.warn('Unauthorized access attempt', { userId: telegramId });
    return false;
  }
  return true;
}

export async function graficosCommand(ctx: Context) {
  if (!await requireAuth(ctx)) return;

  const telegramId = ctx.from!.id;
  loggers.command('/graficos', ctx.from);

  await ctx.reply(
    '📊 *Gráficos Disponíveis*\n\n' +
      'Escolha qual gráfico deseja visualizar:\n\n' +
      '1️⃣ Gastos por Categoria (Pizza)\n' +
      '2️⃣ Receitas vs Despesas (Barras)\n' +
      '3️⃣ Evolução do Saldo (Linha)\n' +
      '4️⃣ Todos os gráficos\n\n' +
      'Digite o número ou use /cancelar:',
    { parse_mode: 'Markdown' }
  );

  await sessionService.saveUserState(telegramId, {
    step: 'awaiting_chart_selection',
  });
}

export async function handleChartFlow(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId || !ctx.message || !('text' in ctx.message)) return;

  const state = await sessionService.getUserState(telegramId);
  if (!state || state.step !== 'awaiting_chart_selection') return;

  const text = ctx.message.text;
  const session = await sessionService.getSession(telegramId);

  if (!session) {
    await sessionService.clearUserState(telegramId);
    await ctx.reply('❌ Sessão expirada. Faça login novamente com /login');
    return;
  }

  try {
    const choice = text.trim();

    if (choice === '1') {
      await sendSpendingByCategory(ctx, session.accessToken);
    } else if (choice === '2') {
      await sendMonthlyComparison(ctx, session.accessToken);
    } else if (choice === '3') {
      await sendBalanceEvolution(ctx, session.accessToken);
    } else if (choice === '4') {
      await ctx.reply('📊 Gerando todos os gráficos... Isso pode levar alguns segundos.');
      await sendSpendingByCategory(ctx, session.accessToken);
      await sendMonthlyComparison(ctx, session.accessToken);
      await sendBalanceEvolution(ctx, session.accessToken);
    } else {
      await ctx.reply('❌ Opção inválida. Digite 1, 2, 3 ou 4.');
      return;
    }

    await sessionService.clearUserState(telegramId);
  } catch (error: any) {
    loggers.error('Erro no fluxo de gráficos', error, { userId: telegramId });
    await sessionService.clearUserState(telegramId);
    await ctx.reply('❌ Erro ao gerar gráfico. Tente novamente com /graficos');
  }
}

async function sendSpendingByCategory(ctx: Context, token: string) {
  try {
    await ctx.reply('📊 Gerando gráfico de gastos por categoria...');

    const chartData = await apiService.getChart(token, 'spending-by-category');

    if (!chartData || !chartData.chartUrl) {
      await ctx.reply('❌ Não há dados suficientes para gerar o gráfico.');
      return;
    }

    // Download da imagem
    const response = await axios.get(chartData.chartUrl, {
      responseType: 'arraybuffer',
    });

    const imageBuffer = Buffer.from(response.data);

    // Enviar imagem
    await ctx.replyWithPhoto(
      { source: imageBuffer },
      {
        caption: '📊 *Gastos por Categoria*\n\nDistribuição percentual dos seus gastos no mês atual.',
        parse_mode: 'Markdown',
      }
    );

    loggers.info('Chart sent successfully', {
      userId: ctx.from!.id,
      type: 'spending-by-category'
    });
  } catch (error: any) {
    loggers.error('Erro ao enviar gráfico de gastos', error, {
      userId: ctx.from!.id
    });
    await ctx.reply('❌ Erro ao gerar gráfico de gastos por categoria.');
  }
}

async function sendMonthlyComparison(ctx: Context, token: string) {
  try {
    await ctx.reply('📊 Gerando gráfico de comparação mensal...');

    const chartData = await apiService.getChart(token, 'monthly-comparison');

    if (!chartData || !chartData.chartUrl) {
      await ctx.reply('❌ Não há dados suficientes para gerar o gráfico.');
      return;
    }

    const response = await axios.get(chartData.chartUrl, {
      responseType: 'arraybuffer',
    });

    const imageBuffer = Buffer.from(response.data);

    await ctx.replyWithPhoto(
      { source: imageBuffer },
      {
        caption: '📊 *Receitas vs Despesas*\n\nEvolução dos seus gastos e receitas nos últimos 6 meses.',
        parse_mode: 'Markdown',
      }
    );

    loggers.info('Chart sent successfully', {
      userId: ctx.from!.id,
      type: 'monthly-comparison'
    });
  } catch (error: any) {
    loggers.error('Erro ao enviar gráfico de comparação', error, {
      userId: ctx.from!.id
    });
    await ctx.reply('❌ Erro ao gerar gráfico de comparação mensal.');
  }
}

async function sendBalanceEvolution(ctx: Context, token: string) {
  try {
    await ctx.reply('📊 Gerando gráfico de evolução do saldo...');

    const chartData = await apiService.getChart(token, 'balance-evolution');

    if (!chartData || !chartData.chartUrl) {
      await ctx.reply('❌ Não há dados suficientes para gerar o gráfico.');
      return;
    }

    const response = await axios.get(chartData.chartUrl, {
      responseType: 'arraybuffer',
    });

    const imageBuffer = Buffer.from(response.data);

    await ctx.replyWithPhoto(
      { source: imageBuffer },
      {
        caption: '📊 *Evolução do Saldo*\n\nComo seu saldo evoluiu nos últimos 30 dias.',
        parse_mode: 'Markdown',
      }
    );

    loggers.info('Chart sent successfully', {
      userId: ctx.from!.id,
      type: 'balance-evolution'
    });
  } catch (error: any) {
    loggers.error('Erro ao enviar gráfico de evolução', error, {
      userId: ctx.from!.id
    });
    await ctx.reply('❌ Erro ao gerar gráfico de evolução do saldo.');
  }
}
