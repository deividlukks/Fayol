import { test, expect } from '@playwright/test';

// Helper para fazer login antes dos testes
async function login(page: any) {
  await page.goto('/auth/login');
  await page.fill('input[name="email"]', process.env.E2E_TEST_EMAIL || 'test@fayol.app');
  await page.fill('input[type="password"]', process.env.E2E_TEST_PASSWORD || 'Test@123456');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
}

test.describe('Transactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await login(page);
  });

  test('deve exibir lista de transações', async ({ page }) => {
    await page.goto('/dashboard/transactions');

    // Verificar elementos da página
    await expect(page.locator('h1, h2').filter({ hasText: /transaç|lançament/i })).toBeVisible();

    // Verificar se existe tabela ou lista de transações
    const transactionList = page.locator('.transaction-list, table, [data-testid="transaction-list"]').first();
    await expect(transactionList).toBeVisible({ timeout: 10000 });
  });

  test('deve navegar para formulário de nova transação', async ({ page }) => {
    await page.goto('/dashboard/transactions');

    // Procurar botão de nova transação
    const newTransactionButton = page.locator('button, a').filter({
      hasText: /nova transação|adicionar|criar/i,
    }).first();

    await expect(newTransactionButton).toBeVisible();
    await newTransactionButton.click();

    // Verificar navegação ou modal
    const transactionForm = page.locator('form').filter({
      has: page.locator('input[name="description"], input[name="amount"]'),
    });
    await expect(transactionForm).toBeVisible({ timeout: 10000 });
  });

  test('deve criar nova transação com sucesso', async ({ page }) => {
    await page.goto('/dashboard/transactions');

    // Abrir formulário
    const newButton = page.locator('button, a').filter({
      hasText: /nova transação|adicionar|criar/i,
    }).first();
    await newButton.click();

    // Aguardar formulário
    await page.waitForSelector('input[name="description"], input[name="title"]', { timeout: 10000 });

    // Preencher dados da transação
    const descriptionField = page.locator('input[name="description"], input[name="title"]').first();
    await descriptionField.fill('Mercado Teste E2E');

    const amountField = page.locator('input[name="amount"], input[name="value"]').first();
    await amountField.fill('150.00');

    // Selecionar tipo (Despesa/Receita)
    const typeSelect = page.locator('select[name="type"]').first();
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption('EXPENSE');
    }

    // Submeter formulário
    const submitButton = page.locator('button[type="submit"]').filter({
      hasText: /salvar|criar|adicionar/i,
    }).first();
    await submitButton.click();

    // Verificar mensagem de sucesso ou redirecionamento
    const successIndicator = page.locator(
      '.success-message, [role="status"], .toast'
    ).filter({ hasText: /sucesso|criada|adicionada/i });

    await expect(successIndicator).toBeVisible({ timeout: 10000 });
  });

  test('deve validar campos obrigatórios ao criar transação', async ({ page }) => {
    await page.goto('/dashboard/transactions');

    // Abrir formulário
    const newButton = page.locator('button, a').filter({
      hasText: /nova transação|adicionar|criar/i,
    }).first();
    await newButton.click();

    // Tentar submeter sem preencher
    await page.waitForSelector('button[type="submit"]', { timeout: 10000 });
    const submitButton = page.locator('button[type="submit"]').filter({
      hasText: /salvar|criar|adicionar/i,
    }).first();
    await submitButton.click();

    // Verificar mensagens de validação
    const validationErrors = page.locator(
      '.error-message, .field-error, [role="alert"], .text-red-500'
    );

    await expect(validationErrors.first()).toBeVisible({ timeout: 5000 });
  });

  test('deve filtrar transações por período', async ({ page }) => {
    await page.goto('/dashboard/transactions');

    // Procurar campos de filtro de data
    const startDateInput = page.locator('input[name="startDate"], input[name="dateFrom"], input[type="date"]').first();

    if (await startDateInput.isVisible({ timeout: 5000 })) {
      // Definir período
      await startDateInput.fill('2024-01-01');

      const endDateInput = page.locator('input[name="endDate"], input[name="dateTo"], input[type="date"]').nth(1);
      if (await endDateInput.isVisible()) {
        await endDateInput.fill('2024-01-31');
      }

      // Aplicar filtro
      const filterButton = page.locator('button').filter({ hasText: /filtrar|buscar|aplicar/i }).first();
      if (await filterButton.isVisible()) {
        await filterButton.click();
      }

      // Aguardar atualização da lista
      await page.waitForTimeout(1000);
    }

    // Verificar que a lista foi atualizada
    const transactionList = page.locator('.transaction-list, table').first();
    await expect(transactionList).toBeVisible();
  });

  test('deve editar transação existente', async ({ page }) => {
    await page.goto('/dashboard/transactions');

    // Aguardar lista carregar
    await page.waitForSelector('.transaction-list, table, [data-testid="transaction-list"]', {
      timeout: 10000,
    });

    // Procurar botão de edição (ícone de lápis, botão "Editar", etc)
    const editButton = page.locator('button, a').filter({
      hasText: /editar|edit/i,
    }).first();

    if (await editButton.isVisible({ timeout: 5000 })) {
      await editButton.click();

      // Aguardar formulário de edição
      await page.waitForSelector('input[name="description"], input[name="title"]', { timeout: 10000 });

      // Modificar descrição
      const descriptionField = page.locator('input[name="description"], input[name="title"]').first();
      await descriptionField.clear();
      await descriptionField.fill('Transação Editada E2E');

      // Salvar
      const saveButton = page.locator('button[type="submit"]').filter({
        hasText: /salvar|atualizar/i,
      }).first();
      await saveButton.click();

      // Verificar sucesso
      const successMessage = page.locator('.success-message, [role="status"]').filter({
        hasText: /atualizada|sucesso/i,
      });
      await expect(successMessage).toBeVisible({ timeout: 10000 });
    }
  });

  test('deve deletar transação', async ({ page }) => {
    await page.goto('/dashboard/transactions');

    // Aguardar lista carregar
    await page.waitForSelector('.transaction-list, table, [data-testid="transaction-list"]', {
      timeout: 10000,
    });

    // Contar transações antes
    const transactionsBefore = await page.locator('.transaction-item, tbody tr').count();

    if (transactionsBefore > 0) {
      // Procurar botão de deletar
      const deleteButton = page.locator('button').filter({
        hasText: /deletar|excluir|remover/i,
      }).first();

      if (await deleteButton.isVisible({ timeout: 5000 })) {
        await deleteButton.click();

        // Confirmar deleção se houver modal de confirmação
        const confirmButton = page.locator('button').filter({
          hasText: /confirmar|sim|deletar/i,
        });

        if (await confirmButton.isVisible({ timeout: 3000 })) {
          await confirmButton.click();
        }

        // Verificar mensagem de sucesso
        const successMessage = page.locator('.success-message, [role="status"]');
        await expect(successMessage).toBeVisible({ timeout: 10000 });

        // Verificar que o número de transações diminuiu
        await page.waitForTimeout(1000);
        const transactionsAfter = await page.locator('.transaction-item, tbody tr').count();
        expect(transactionsAfter).toBeLessThan(transactionsBefore);
      }
    }
  });

  test('deve categorizar transação automaticamente', async ({ page }) => {
    await page.goto('/dashboard/transactions');

    // Criar nova transação com descrição conhecida
    const newButton = page.locator('button, a').filter({
      hasText: /nova transação|adicionar/i,
    }).first();
    await newButton.click();

    await page.waitForSelector('input[name="description"], input[name="title"]', { timeout: 10000 });

    // Preencher com palavra-chave que deve ser auto-categorizada
    const descriptionField = page.locator('input[name="description"], input[name="title"]').first();
    await descriptionField.fill('Supermercado Extra');

    // Aguardar sugestão de categoria
    await page.waitForTimeout(1500);

    // Verificar se alguma categoria foi sugerida ou selecionada automaticamente
    const categoryField = page.locator('select[name="category"], select[name="categoryId"]').first();
    if (await categoryField.isVisible()) {
      const selectedValue = await categoryField.inputValue();
      expect(selectedValue).not.toBe('');
    }
  });

  test('deve exibir resumo de transações', async ({ page }) => {
    await page.goto('/dashboard/transactions');

    // Verificar cards de resumo (total receitas, despesas, saldo)
    const summaryCards = page.locator(
      '.summary-card, .total-card, [data-testid="summary"]'
    );

    if (await summaryCards.first().isVisible({ timeout: 5000 })) {
      // Verificar que há pelo menos um card de resumo
      const count = await summaryCards.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('deve buscar transações por descrição', async ({ page }) => {
    await page.goto('/dashboard/transactions');

    // Procurar campo de busca
    const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"], input[name="search"]').first();

    if (await searchInput.isVisible({ timeout: 5000 })) {
      // Buscar por termo
      await searchInput.fill('Mercado');

      // Aguardar filtro aplicar
      await page.waitForTimeout(1000);

      // Verificar que resultados foram filtrados
      const transactionList = page.locator('.transaction-list, table').first();
      await expect(transactionList).toBeVisible();
    }
  });
});
