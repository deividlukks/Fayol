import { Context } from 'telegraf';
import { Markup } from 'telegraf';
import { sessionService } from '../services/session.service';

export async function menuCommand(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  if (!await sessionService.isAuthenticated(telegramId)) {
    await ctx.reply(
      '❌ Você precisa fazer login primeiro.',
      {
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔐 Fazer Login', 'login')],
        ])
      }
    );
    return;
  }

  const session = await sessionService.getSession(telegramId);

  await ctx.reply(
    `📊 *Menu Principal*\n\n` +
      `Olá, *${session?.name}*! 👋\n\n` +
      'O que você gostaria de fazer hoje?',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('➕ Nova Transação', 'add_transaction'),
          Markup.button.callback('💰 Ver Saldo', 'view_balance'),
        ],
        [
          Markup.button.callback('📝 Extrato', 'view_statement'),
          Markup.button.callback('📊 Relatórios', 'view_reports'),
        ],
        [
          Markup.button.callback('💼 Minhas Contas', 'accounts'),
          Markup.button.callback('📁 Categorias', 'categories'),
        ],
        [
          Markup.button.callback('❓ Ajuda', 'help'),
          Markup.button.callback('👋 Sair', 'logout_confirm'),
        ],
      ])
    }
  );
}

export async function handleMenuCallback(ctx: Context) {
  await ctx.answerCbQuery();
  await menuCommand(ctx);
}

export async function handleAddTransactionCallback(ctx: Context) {
  await ctx.answerCbQuery();

  await ctx.reply(
    '➕ *Adicionar Transação*\n\n' +
      'Escolha o tipo de transação:',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('💰 Receita', 'add_income')],
        [Markup.button.callback('💳 Despesa', 'add_expense')],
        [Markup.button.callback('🔙 Voltar ao Menu', 'menu')],
      ])
    }
  );
}

export async function handleAddIncomeCallback(ctx: Context) {
  await ctx.answerCbQuery();

  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  await sessionService.saveUserState(telegramId, {
    step: 'awaiting_income_data',
    type: 'income',
  });

  await ctx.reply(
    '💰 *Adicionar Receita*\n\n' +
      'Envie o valor e descrição da receita:\n\n' +
      '*Exemplos:*\n' +
      '• `3000 Salário de janeiro`\n' +
      '• `R$ 500 Freelance projeto XYZ`\n' +
      '• `Venda de produto 250`',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('❌ Cancelar', 'cancel_operation')],
      ])
    }
  );
}

export async function handleAddExpenseCallback(ctx: Context) {
  await ctx.answerCbQuery();

  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  await sessionService.saveUserState(telegramId, {
    step: 'awaiting_expense_data',
    type: 'expense',
  });

  await ctx.reply(
    '💳 *Adicionar Despesa*\n\n' +
      'Envie o valor e descrição da despesa:\n\n' +
      '*Exemplos:*\n' +
      '• `50 Uber para o trabalho`\n' +
      '• `R$ 120 Supermercado`\n' +
      '• `Almoço no restaurante 45`',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('❌ Cancelar', 'cancel_operation')],
      ])
    }
  );
}

export async function handleCancelCallback(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  await ctx.answerCbQuery('Operação cancelada');

  await sessionService.clearUserState(telegramId);

  await ctx.reply(
    '✅ *Operação cancelada*',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Voltar ao Menu', 'menu')],
      ])
    }
  );
}

export async function handleLogoutConfirmCallback(ctx: Context) {
  await ctx.answerCbQuery();

  await ctx.reply(
    '👋 *Confirmar Logout*\n\n' +
      'Tem certeza que deseja sair?',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('✅ Sim, Sair', 'logout_yes')],
        [Markup.button.callback('❌ Não, Ficar', 'menu')],
      ])
    }
  );
}

export async function handleLogoutYesCallback(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  await ctx.answerCbQuery();

  const session = await sessionService.getSession(telegramId);
  await sessionService.deleteSession(telegramId);

  await ctx.reply(
    `👋 *Logout realizado com sucesso!*\n\n` +
      `Até logo, *${session?.name}*!\n\n` +
      'Quando quiser voltar, é só fazer login novamente.',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔐 Fazer Login', 'login')],
      ])
    }
  );
}
