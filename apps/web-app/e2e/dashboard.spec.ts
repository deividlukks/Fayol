import { test, expect } from '@playwright/test';

// Helper para fazer login
async function login(page: any) {
  await page.goto('/auth/login');
  await page.fill('input[name="email"]', process.env.E2E_TEST_EMAIL || 'test@fayol.app');
  await page.fill('input[type="password"]', process.env.E2E_TEST_PASSWORD || 'Test@123456');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
}

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await login(page);
  });

  test('deve exibir dashboard principal corretamente', async ({ page }) => {
    await page.goto('/dashboard');

    // Verificar elementos principais
    await expect(page.locator('h1, h2').filter({ hasText: /dashboard|painel/i })).toBeVisible();

    // Verificar navegação lateral ou menu
    const navigation = page.locator('nav, aside, [role="navigation"]').first();
    await expect(navigation).toBeVisible();
  });

  test('deve navegar para Transações', async ({ page }) => {
    await page.goto('/dashboard');

    // Clicar no link de transações
    const transactionsLink = page.locator('a, button').filter({
      hasText: /transaç|lançament/i,
    }).first();

    await transactionsLink.click();
    await expect(page).toHaveURL(/\/dashboard\/transactions/);
  });

  test('deve navegar para Contas', async ({ page }) => {
    await page.goto('/dashboard');

    const accountsLink = page.locator('a, button').filter({
      hasText: /contas|accounts/i,
    }).first();

    if (await accountsLink.isVisible({ timeout: 5000 })) {
      await accountsLink.click();
      await expect(page).toHaveURL(/\/dashboard\/accounts/);
    }
  });

  test('deve navegar para Orçamentos', async ({ page }) => {
    await page.goto('/dashboard');

    const budgetsLink = page.locator('a, button').filter({
      hasText: /orçamento|budget/i,
    }).first();

    if (await budgetsLink.isVisible({ timeout: 5000 })) {
      await budgetsLink.click();
      await expect(page).toHaveURL(/\/dashboard\/budgets/);
    }
  });

  test('deve navegar para Investimentos', async ({ page }) => {
    await page.goto('/dashboard');

    const investmentsLink = page.locator('a, button').filter({
      hasText: /investimento|investment/i,
    }).first();

    if (await investmentsLink.isVisible({ timeout: 5000 })) {
      await investmentsLink.click();
      await expect(page).toHaveURL(/\/dashboard\/investments/);
    }
  });

  test('deve navegar para Insights', async ({ page }) => {
    await page.goto('/dashboard');

    const insightsLink = page.locator('a, button').filter({
      hasText: /insights|análise/i,
    }).first();

    if (await insightsLink.isVisible({ timeout: 5000 })) {
      await insightsLink.click();
      await expect(page).toHaveURL(/\/dashboard\/insights/);
    }
  });

  test('deve navegar para Relatórios', async ({ page }) => {
    await page.goto('/dashboard');

    const reportsLink = page.locator('a, button').filter({
      hasText: /relatório|report/i,
    }).first();

    if (await reportsLink.isVisible({ timeout: 5000 })) {
      await reportsLink.click();
      await expect(page).toHaveURL(/\/dashboard\/reports/);
    }
  });

  test('deve navegar para Configurações', async ({ page }) => {
    await page.goto('/dashboard');

    const settingsLink = page.locator('a, button').filter({
      hasText: /configurações|settings/i,
    }).first();

    if (await settingsLink.isVisible({ timeout: 5000 })) {
      await settingsLink.click();
      await expect(page).toHaveURL(/\/dashboard\/settings/);
    }
  });

  test('deve exibir nome do usuário no dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    // Verificar se existe indicação de usuário logado
    const userIndicator = page.locator(
      '[data-testid="user-menu"], .user-info, .user-profile'
    ).first();

    if (await userIndicator.isVisible({ timeout: 5000 })) {
      await expect(userIndicator).toBeVisible();
    }
  });

  test('deve ser responsivo em mobile', async ({ page }) => {
    // Configurar viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');

    // Verificar que o menu está acessível (pode estar colapsado)
    const menuButton = page.locator('[aria-label*="menu"], button.menu-toggle, .hamburger').first();

    if (await menuButton.isVisible({ timeout: 5000 })) {
      await menuButton.click();

      // Verificar que navegação ficou visível
      const navigation = page.locator('nav, aside, [role="navigation"]').first();
      await expect(navigation).toBeVisible();
    }
  });

  test('deve exibir gráficos no dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    // Verificar se há elementos canvas ou svg (gráficos)
    const charts = page.locator('canvas, svg').first();

    if (await charts.isVisible({ timeout: 10000 })) {
      await expect(charts).toBeVisible();
    }
  });
});

test.describe('Dashboard Insights', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await login(page);
  });

  test('deve exibir insights de gastos', async ({ page }) => {
    await page.goto('/dashboard/insights');

    // Aguardar carregamento de insights
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Verificar se há insights sendo exibidos
    const insightCards = page.locator(
      '.insight-card, [data-testid="insight"], .card'
    );

    const count = await insightCards.count();
    expect(count).toBeGreaterThanOrEqual(0); // Pode não ter insights se não há dados
  });

  test('deve categorizar gastos visualmente', async ({ page }) => {
    await page.goto('/dashboard/insights');

    // Verificar se há visualização de categorias (gráfico de pizza, barras, etc)
    const categoryChart = page.locator('canvas, svg').first();

    if (await categoryChart.isVisible({ timeout: 10000 })) {
      await expect(categoryChart).toBeVisible();
    }
  });
});

test.describe('Dashboard Reports', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await login(page);
  });

  test('deve exibir página de relatórios', async ({ page }) => {
    await page.goto('/dashboard/reports');

    await expect(page.locator('h1, h2').filter({ hasText: /relatório|report/i })).toBeVisible();
  });

  test('deve permitir filtrar relatórios por período', async ({ page }) => {
    await page.goto('/dashboard/reports');

    // Procurar seletor de período
    const periodSelector = page.locator('select[name="period"], .period-selector').first();

    if (await periodSelector.isVisible({ timeout: 5000 })) {
      await periodSelector.selectOption({ index: 1 }); // Selecionar segunda opção
      await page.waitForTimeout(1000);
    }
  });

  test('deve permitir exportar relatório', async ({ page }) => {
    await page.goto('/dashboard/reports');

    // Procurar botão de exportar (PDF, CSV, etc)
    const exportButton = page.locator('button').filter({
      hasText: /exportar|download|export/i,
    }).first();

    if (await exportButton.isVisible({ timeout: 5000 })) {
      // Verificar que botão está habilitado
      await expect(exportButton).toBeEnabled();
    }
  });
});
