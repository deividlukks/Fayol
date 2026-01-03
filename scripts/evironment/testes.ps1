<#
.SYNOPSIS
    Script para gerar estrutura de testes no projeto Fayol
.DESCRIPTION
    Cria estrutura de diretórios, arquivos de configuração e templates de teste
    para pacotes e aplicações do monorepo.
.PARAMETER Package
    Nome do pacote para criar testes (default: ui-components)
.PARAMETER Type
    Tipo de teste a configurar: unit, integration, e2e, all (default: all)
#>

param(
    [string]$Package = "ui-components",
    [ValidateSet("unit", "integration", "e2e", "all")]
    [string]$Type = "all"
)

$ErrorActionPreference = "Stop"

# --- CONFIGURAÇÃO ---
$ScriptLocation = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectRoot = Split-Path -Parent $ScriptLocation
Set-Location $ProjectRoot

Write-Host "`n📋 Gerador de Estrutura de Testes - Fayol" -ForegroundColor Cyan
Write-Host "═" -Repeat 60 -ForegroundColor Cyan
Write-Host "Pacote: $Package" -ForegroundColor White
Write-Host "Tipo: $Type" -ForegroundColor White
Write-Host "═" -Repeat 60 -ForegroundColor Cyan
Write-Host ""

# --- PATHS ---
$BASE_UI = Join-Path $ProjectRoot "packages\$Package\tests"
$BASE_WEB = Join-Path $ProjectRoot "apps\web-app\tests"
$PKG_ROOT = Join-Path $ProjectRoot "packages\$Package"

# Verificar se pacote existe
if (-not (Test-Path $PKG_ROOT)) {
    Write-Host "❌ Pacote '$Package' não encontrado em packages\" -ForegroundColor Red
    Write-Host "   Caminho: $PKG_ROOT" -ForegroundColor Gray
    exit 1
}

# --- FUNÇÕES ---
function Create-Directory {
    param([string]$Path)
    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
        Write-Host "✓ Criado: $($Path.Replace($ProjectRoot, '.'))" -ForegroundColor Green
    } else {
        Write-Host "  Existe: $($Path.Replace($ProjectRoot, '.'))" -ForegroundColor Gray
    }
}

function Create-File {
    param(
        [string]$Path,
        [string]$Content
    )
    if (-not (Test-Path $Path)) {
        Set-Content -Path $Path -Value $Content -Encoding UTF8
        Write-Host "✓ Criado: $($Path.Replace($ProjectRoot, '.'))" -ForegroundColor Green
    } else {
        Write-Host "  Existe: $($Path.Replace($ProjectRoot, '.'))" -ForegroundColor Gray
    }
}

# --- CRIAR ESTRUTURA DE DIRETÓRIOS ---
Write-Host "`n📁 Criando estrutura de diretórios..." -ForegroundColor Cyan

$testDirs = @()

if ($Type -eq "all" -or $Type -eq "unit") {
    $testDirs += @(
        "$BASE_UI\hooks",
        "$BASE_UI\components\ui",
        "$BASE_UI\components\forms",
        "$BASE_UI\components\layout",
        "$BASE_UI\components\charts"
    )
}

if ($Type -eq "all" -or $Type -eq "integration") {
    $testDirs += "$BASE_WEB\integration"
}

if ($Type -eq "all" -or $Type -eq "e2e") {
    $testDirs += "$BASE_WEB\e2e"
}

$testDirs | ForEach-Object { Create-Directory $_ }

# --- CRIAR ARQUIVOS DE CONFIGURAÇÃO ---
Write-Host "`n⚙️  Criando arquivos de configuração..." -ForegroundColor Cyan

# vitest.config.ts
$vitestConfig = @"
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/*.spec.tsx',
        '**/*.test.tsx',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
"@

Create-File -Path "$PKG_ROOT\vitest.config.ts" -Content $vitestConfig

# tests/setup.ts
$setupContent = @"
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Limpar após cada teste
afterEach(() => {
  cleanup();
});

// Mock de funções globais se necessário
global.matchMedia = global.matchMedia || function () {
  return {
    matches: false,
    addListener: function () {},
    removeListener: function () {},
  };
};
"@

Create-File -Path "$BASE_UI\setup.ts" -Content $setupContent

# --- CRIAR TEMPLATES DE TESTE ---
Write-Host "`n📄 Criando templates de exemplo..." -ForegroundColor Cyan

# Template: Teste de Componente
$componentTestTemplate = @"
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    const { user } = render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
"@

Create-File -Path "$BASE_UI\components\ui\example-button.test.tsx" -Content $componentTestTemplate

# Template: Teste de Hook
$hookTestTemplate = @"
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useCounter } from '@/hooks/useCounter';

describe('useCounter Hook', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('should initialize with custom value', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it('should increment counter', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('should decrement counter', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });
});
"@

Create-File -Path "$BASE_UI\hooks\example-use-counter.test.ts" -Content $hookTestTemplate

# Template: Teste E2E (Playwright)
if ($Type -eq "all" -or $Type -eq "e2e") {
    $e2eTestTemplate = @"
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name=email]', 'admin@fayol.app');
    await page.fill('input[name=password]', 'Admin123!@#');
    await page.click('button[type=submit]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Bem-vindo')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name=email]', 'invalid@example.com');
    await page.fill('input[name=password]', 'wrong-password');
    await page.click('button[type=submit]');

    await expect(page.getByText('Credenciais inválidas')).toBeVisible();
  });
});
"@

    Create-File -Path "$BASE_WEB\e2e\example-login.spec.ts" -Content $e2eTestTemplate
}

# playwright.config.ts (se não existir)
if ($Type -eq "all" -or $Type -eq "e2e") {
    $playwrightConfig = @"
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
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
  ],
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
"@

    $webAppRoot = Join-Path $ProjectRoot "apps\web-app"
    Create-File -Path "$webAppRoot\playwright.config.ts" -Content $playwrightConfig
}

# --- ATUALIZAR package.json (se necessário) ---
Write-Host "`n📦 Verificando scripts de teste no package.json..." -ForegroundColor Cyan

$packageJsonPath = Join-Path $PKG_ROOT "package.json"
if (Test-Path $packageJsonPath) {
    $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json

    $scriptsToAdd = @{
        "test" = "vitest"
        "test:ui" = "vitest --ui"
        "test:watch" = "vitest --watch"
        "test:coverage" = "vitest --coverage"
    }

    $updated = $false
    foreach ($script in $scriptsToAdd.GetEnumerator()) {
        if (-not $packageJson.scripts.PSObject.Properties[$script.Key]) {
            $packageJson.scripts | Add-Member -NotePropertyName $script.Key -NotePropertyValue $script.Value
            $updated = $true
            Write-Host "✓ Adicionado script: $($script.Key)" -ForegroundColor Green
        }
    }

    if ($updated) {
        $packageJson | ConvertTo-Json -Depth 100 | Set-Content $packageJsonPath
        Write-Host "✓ package.json atualizado" -ForegroundColor Green
    } else {
        Write-Host "  Scripts já existem" -ForegroundColor Gray
    }
}

# --- RESUMO ---
Write-Host "`n✅ Estrutura de testes criada com sucesso!`n" -ForegroundColor Green
Write-Host "═" -Repeat 60 -ForegroundColor Cyan
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "  1. cd packages\$Package" -ForegroundColor White
Write-Host "  2. pnpm install (se necessário)" -ForegroundColor White
Write-Host "  3. pnpm test (executar testes)" -ForegroundColor White
Write-Host "  4. pnpm test:ui (interface visual)" -ForegroundColor White
Write-Host "  5. pnpm test:coverage (cobertura)" -ForegroundColor White
Write-Host "═" -Repeat 60 -ForegroundColor Cyan
Write-Host ""
