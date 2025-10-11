import { Context } from 'telegraf';
import { Markup } from 'telegraf';
import { apiService } from '../services/api.service';
import { sessionService } from '../services/session.service';
import { parseTransactionText, formatCurrency } from '../utils/parser';
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

export async function addReceitaCommand(ctx: Context) {
  if (!await requireAuth(ctx)) return;

  const telegramId = ctx.from!.id;
  loggers.command('/addreceita', ctx.from);

  await sessionService.saveUserState(telegramId, {
    step: 'awaiting_income_data',
    type: 'income',
  });

  await ctx.reply(
    '💰 *Adicionar Receita*\n\n' +
      'Envie o valor e descrição da receita.\n\n' +
      '*Exemplos:*\n' +
      '• `3000 Salário de janeiro`\n' +
      '• `R$ 500,00 Freelance projeto XYZ`\n' +
      '• `Venda de produto 250`\n\n' +
      'Ou use /cancelar para cancelar.',
    { parse_mode: 'Markdown' }
  );
}

export async function addDespesaCommand(ctx: Context) {
  if (!await requireAuth(ctx)) return;

  const telegramId = ctx.from!.id;
  loggers.command('/adddespesa', ctx.from);

  await sessionService.saveUserState(telegramId, {
    step: 'awaiting_expense_data',
    type: 'expense',
  });

  await ctx.reply(
    '💳 *Adicionar Despesa*\n\n' +
      'Envie o valor e descrição da despesa.\n\n' +
      '*Exemplos:*\n' +
      '• `50 Uber para o trabalho`\n' +
      '• `R$ 120,00 Supermercado`\n' +
      '• `Almoço no restaurante 45`\n\n' +
      'Ou use /cancelar para cancelar.',
    { parse_mode: 'Markdown' }
  );
}

export async function cancelCommand(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  loggers.command('/cancelar', ctx.from);

  const state = await sessionService.getUserState(telegramId);
  if (!state) {
    await ctx.reply('❌ Não há nenhuma operação em andamento.');
    return;
  }

  await sessionService.clearUserState(telegramId);
  await ctx.reply('✅ Operação cancelada.');
}

export async function handleTransactionFlow(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId || !ctx.message || !('text' in ctx.message)) return;

  const state = await sessionService.getUserState(telegramId);
  if (!state) return;

  const text = ctx.message.text;

  try {
    // Handle income/expense data input
    if (state.step === 'awaiting_income_data' || state.step === 'awaiting_expense_data') {
      loggers.debug('Processing transaction input', { userId: telegramId, step: state.step, input: text });

      const parsed = parseTransactionText(text);

      if (!parsed) {
        loggers.warn('Invalid transaction format', { userId: telegramId, input: text });
        await ctx.reply(
          '❌ *Formato inválido*\n\n' +
            'Por favor, envie no formato: `valor descrição`\n\n' +
            'Exemplos:\n' +
            '• `50 Uber para o trabalho`\n' +
            '• `R$ 120,00 Supermercado`',
          { parse_mode: 'Markdown' }
        );
        return;
      }

      loggers.info('Transaction parsed successfully', {
        userId: telegramId,
        amount: parsed.amount,
        description: parsed.description,
      });

      // Check if user has session
      const session = await sessionService.getSession(telegramId);
      if (!session) {
        loggers.sessionError('Session not found during transaction flow', telegramId);
        await sessionService.clearUserState(telegramId);
        await ctx.reply(
          '❌ *Sessão expirada*\n\n' +
            'Por favor, faça login novamente com /login',
          { parse_mode: 'Markdown' }
        );
        return;
      }

      // Get user accounts
      try {
        loggers.apiRequest('GET', '/accounts', { userId: telegramId });
        const accounts = await apiService.getAccounts(session.accessToken);

        if (!accounts || accounts.length === 0) {
          loggers.warn('No accounts found for user', { userId: telegramId });
          await sessionService.clearUserState(telegramId);
          await ctx.reply(
            '❌ *Você não tem contas cadastradas*\n\n' +
              'Crie uma conta primeiro usando /contas',
            {
              parse_mode: 'Markdown',
              ...Markup.inlineKeyboard([
                [Markup.button.callback('💼 Gerenciar Contas', 'accounts')],
              ])
            }
          );
          return;
        }

        loggers.info('Accounts retrieved', { userId: telegramId, count: accounts.length });

        let message = `✅ Transação: *${formatCurrency(parsed.amount)}* - ${parsed.description}\n\n`;
        message += '*Selecione a conta:*\n\n';

        accounts.forEach((account: any, index: number) => {
          message += `${index + 1}. ${account.name} (${account.type})\n`;
        });

        message += '\nEnvie o número da conta:';

        // Save accounts in state
        await sessionService.saveUserState(telegramId, {
          ...state,
          step: 'awaiting_account_selection',
          amount: parsed.amount,
          description: parsed.description,
          accounts,
        });

        await ctx.reply(message, { parse_mode: 'Markdown' });
      } catch (error: any) {
        loggers.apiError('GET', '/accounts', error, { userId: telegramId });
        await sessionService.clearUserState(telegramId);
        await ctx.reply(
          '❌ *Erro ao buscar contas*\n\n' +
            'Tente novamente mais tarde.',
          { parse_mode: 'Markdown' }
        );
      }
    }
    // Handle account selection
    else if (state.step === 'awaiting_account_selection') {
      const accountIndex = parseInt(text) - 1;

      if (isNaN(accountIndex) || accountIndex < 0 || accountIndex >= state.accounts.length) {
        loggers.warn('Invalid account selection', { userId: telegramId, input: text });
        await ctx.reply('❌ Número de conta inválido. Tente novamente.');
        return;
      }

      const selectedAccount = state.accounts[accountIndex];
      loggers.info('Account selected', {
        userId: telegramId,
        accountId: selectedAccount.id,
        accountName: selectedAccount.name,
      });

      // Check session again
      const session = await sessionService.getSession(telegramId);
      if (!session) {
        loggers.sessionError('Session not found during account selection', telegramId);
        await sessionService.clearUserState(telegramId);
        await ctx.reply(
          '❌ *Sessão expirada*\n\n' +
            'Por favor, faça login novamente com /login',
          { parse_mode: 'Markdown' }
        );
        return;
      }

      try {
        // Use AI to suggest category
        loggers.apiRequest('POST', '/ai/suggest-category', {
          userId: telegramId,
          description: state.description,
        });

        const suggestion = await apiService.suggestCategory(
          session.accessToken,
          state.description
        );

        loggers.info('Category suggested', {
          userId: telegramId,
          category: suggestion.category,
          subcategory: suggestion.subcategory,
          confidence: suggestion.confidence,
        });

        // Get categories
        const categories = await apiService.getCategories(session.accessToken);
        const category = categories.find((c: any) => c.name === suggestion.category);

        if (!category) {
          loggers.error('Category not found', undefined, {
            userId: telegramId,
            suggestedCategory: suggestion.category,
          });
          await sessionService.clearUserState(telegramId);
          await ctx.reply('❌ Erro ao buscar categorias. Tente novamente.');
          return;
        }

        // Create transaction with suggested category
        const transactionData: any = {
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
          const subcategories = await apiService.getSubcategories(
            session.accessToken,
            category.id
          );
          const subcategory = subcategories.find((s: any) => s.name === suggestion.subcategory);
          if (subcategory) {
            transactionData.subcategoryId = subcategory.id;
          }
        }

        loggers.apiRequest('POST', '/transactions', {
          userId: telegramId,
          data: transactionData,
        });

        const transaction = await apiService.createTransaction(
          session.accessToken,
          transactionData
        );

        loggers.info('Transaction created successfully', {
          userId: telegramId,
          transactionId: transaction.id,
          amount: state.amount,
          type: state.type,
        });

        await sessionService.clearUserState(telegramId);

        const icon = state.type === 'income' ? '💰' : '💳';
        const typeLabel = state.type === 'income' ? 'Receita' : 'Despesa';

        await ctx.reply(
          `${icon} *${typeLabel} Registrada!*\n\n` +
            `*Valor:* ${formatCurrency(state.amount)}\n` +
            `*Descrição:* ${state.description}\n` +
            `*Conta:* ${selectedAccount.name}\n` +
            `*Categoria:* ${category.name}${suggestion.subcategory ? ` > ${suggestion.subcategory}` : ''}\n` +
            `*Código:* #${transaction.code}\n\n` +
            '✅ Transação salva com sucesso!',
          { parse_mode: 'Markdown' }
        );
      } catch (error: any) {
        loggers.apiError('POST', '/transactions', error, {
          userId: telegramId,
          transactionData: {
            amount: state.amount,
            description: state.description,
            type: state.type,
          },
        });

        await sessionService.clearUserState(telegramId);

        const errorMessage = error.response?.data?.message || 'Erro ao processar transação';
        const errorDetails = error.response?.data?.error || '';

        await ctx.reply(
          `❌ *Erro ao criar transação*\n\n` +
            `${errorMessage}\n` +
            (errorDetails ? `\n_Detalhes: ${errorDetails}_\n` : '') +
            '\nTente novamente com /addreceita ou /adddespesa',
          { parse_mode: 'Markdown' }
        );
      }
    }
  } catch (error: any) {
    loggers.flowError('transaction', state.step, error, {
      userId: telegramId,
      state,
    });

    await sessionService.clearUserState(telegramId);
    await ctx.reply(
      '❌ Erro inesperado. Use /addreceita ou /adddespesa para tentar novamente.'
    );
  }
}
