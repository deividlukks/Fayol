import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Limpar cookies e storage antes de cada teste
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test('deve exibir página de login corretamente', async ({ page }) => {
    await page.goto('/auth/login');

    // Verificar elementos principais
    await expect(page.locator('h1, h2').filter({ hasText: /login|entrar/i })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/auth/login');

    // Preencher com credenciais inválidas
    await page.fill('input[name="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Verificar mensagem de erro
    await expect(page.locator('.error-message, [role="alert"]').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('deve fazer login com sucesso e redirecionar para dashboard', async ({ page }) => {
    await page.goto('/auth/login');

    // Preencher credenciais válidas
    await page.fill('input[name="email"]', process.env.E2E_TEST_EMAIL || 'test@fayol.app');
    await page.fill('input[type="password"]', process.env.E2E_TEST_PASSWORD || 'Test@123456');
    await page.click('button[type="submit"]');

    // Aguardar redirecionamento para dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    // Verificar que está no dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('h1, h2').filter({ hasText: /dashboard|painel/i })).toBeVisible();
  });

  test('deve validar campos obrigatórios', async ({ page }) => {
    await page.goto('/auth/login');

    // Tentar submeter sem preencher
    await page.click('button[type="submit"]');

    // Verificar validações HTML5 ou mensagens customizadas
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[type="password"]');

    // Pelo menos um dos inputs deve estar inválido
    const emailInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    const passwordInvalid = await passwordInput.evaluate((el: HTMLInputElement) => !el.validity.valid);

    expect(emailInvalid || passwordInvalid).toBeTruthy();
  });

  test('deve validar formato de email', async ({ page }) => {
    await page.goto('/auth/login');

    // Preencher email inválido
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Verificar validação de email
    const emailInput = page.locator('input[name="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);

    expect(isInvalid).toBeTruthy();
  });

  test('deve navegar para página de registro', async ({ page }) => {
    await page.goto('/auth/login');

    // Procurar link para registro
    const registerLink = page.locator('a').filter({ hasText: /criar conta|registrar|cadastr/i });
    await expect(registerLink).toBeVisible();

    // Clicar e verificar navegação
    await registerLink.click();
    await expect(page).toHaveURL(/\/auth\/register/);
  });

  test('deve navegar para página de esqueci senha', async ({ page }) => {
    await page.goto('/auth/login');

    // Procurar link para recuperação de senha
    const forgotPasswordLink = page.locator('a').filter({ hasText: /esqueci|recuperar/i });
    await expect(forgotPasswordLink).toBeVisible();

    // Clicar e verificar navegação
    await forgotPasswordLink.click();
    await expect(page).toHaveURL(/\/auth\/forgot-password/);
  });

  test('deve fazer logout com sucesso', async ({ page }) => {
    // Primeiro fazer login
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', process.env.E2E_TEST_EMAIL || 'test@fayol.app');
    await page.fill('input[type="password"]', process.env.E2E_TEST_PASSWORD || 'Test@123456');
    await page.click('button[type="submit"]');

    // Aguardar estar logado
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    // Procurar e clicar no botão de logout
    const logoutButton = page.locator('button, a').filter({ hasText: /sair|logout/i }).first();
    await logoutButton.click();

    // Verificar redirecionamento para login ou home
    await page.waitForURL(/\/(auth\/login|$)/, { timeout: 10000 });
    await expect(page).not.toHaveURL(/\/dashboard/);
  });

  test('deve redirecionar para login ao acessar rota protegida sem autenticação', async ({ page }) => {
    // Tentar acessar rota protegida sem estar logado
    await page.goto('/dashboard');

    // Deve redirecionar para login
    await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('deve exibir indicador de loading durante login', async ({ page }) => {
    await page.goto('/auth/login');

    // Preencher credenciais
    await page.fill('input[name="email"]', process.env.E2E_TEST_EMAIL || 'test@fayol.app');
    await page.fill('input[type="password"]', process.env.E2E_TEST_PASSWORD || 'Test@123456');

    // Interceptar request para tornar mais lenta e ver loading
    await page.route('**/api/auth/login', async (route) => {
      await page.waitForTimeout(1000); // Simular delay
      await route.continue();
    });

    // Clicar em submit
    await page.click('button[type="submit"]');

    // Verificar loading (spinner, disabled button, etc)
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();
  });
});

test.describe('Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('deve exibir página de registro corretamente', async ({ page }) => {
    await page.goto('/auth/register');

    // Verificar elementos principais
    await expect(page.locator('h1, h2').filter({ hasText: /registr|cadastr|criar conta/i })).toBeVisible();
    await expect(page.locator('input[name="name"], input[name="fullName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('deve navegar de volta para login', async ({ page }) => {
    await page.goto('/auth/register');

    const loginLink = page.locator('a').filter({ hasText: /login|entrar|já tenho conta/i });
    await expect(loginLink).toBeVisible();

    await loginLink.click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

test.describe('Password Reset Flow', () => {
  test('deve exibir página de recuperação de senha', async ({ page }) => {
    await page.goto('/auth/forgot-password');

    await expect(page.locator('h1, h2').filter({ hasText: /esqueci|recuperar/i })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('deve enviar email de recuperação com sucesso', async ({ page }) => {
    await page.goto('/auth/forgot-password');

    await page.fill('input[name="email"]', 'test@fayol.app');
    await page.click('button[type="submit"]');

    // Verificar mensagem de sucesso
    await expect(page.locator('.success-message, [role="status"]').first()).toBeVisible({
      timeout: 10000,
    });
  });
});
