import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração do Playwright para testes E2E do Web App
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  /* Executar testes em paralelo */
  fullyParallel: true,

  /* Falhar se houver only no CI */
  forbidOnly: !!process.env.CI,

  /* Retry em caso de falha no CI */
  retries: process.env.CI ? 2 : 0,

  /* Workers no CI vs local */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter */
  reporter: [
    ['html'],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['junit', { outputFile: 'playwright-report/junit.xml' }],
  ],

  /* Configurações compartilhadas */
  use: {
    /* URL base para usar em navegação */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    /* Coleta de evidências em falhas */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    /* Timeout de navegação */
    navigationTimeout: 30000,
    actionTimeout: 10000,
  },

  /* Configurar projetos para múltiplos browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Testes Mobile */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Branded browsers */
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],

  /* Servidor de desenvolvimento - inicia automaticamente se não estiver rodando */
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'ignore',
    stderr: 'pipe',
  },

  /* Timeout global dos testes */
  timeout: 60000,

  /* Expect timeout */
  expect: {
    timeout: 10000,
  },
});
