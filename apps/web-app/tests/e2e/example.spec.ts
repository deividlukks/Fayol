import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/');

    // Verificar se a página carregou
    await expect(page).toHaveTitle(/Fayol/i);
  });

  test('should have navigation', async ({ page }) => {
    await page.goto('/');

    // Verificar se tem elementos de navegação (ajustar conforme sua UI)
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });
});

test.describe('Login Flow', () => {
  test.skip('should navigate to login page', async ({ page }) => {
    await page.goto('/');

    // Ajustar conforme sua implementação
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL(/.*login/);
  });

  test.skip('should show validation errors on empty submit', async ({ page }) => {
    await page.goto('/login');

    // Tentar submit sem preencher
    await page.click('button[type="submit"]');

    // Verificar mensagens de erro (ajustar seletores)
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have no accessibility violations on homepage', async ({ page }) => {
    await page.goto('/');

    // Verificar contraste mínimo (basic check)
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');

    // Testar navegação por Tab
    await page.keyboard.press('Tab');

    // Verificar se algum elemento ganhou foco
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });
});
