# Testes E2E - Fayol Web App

Testes End-to-End usando Playwright para validar fluxos críticos da aplicação.

## 📋 Suites de Teste

### `auth.spec.ts` - Autenticação
- ✅ Login com credenciais válidas e inválidas
- ✅ Validação de campos e formato de email
- ✅ Navegação entre login, registro e recuperação de senha
- ✅ Logout e proteção de rotas
- ✅ Indicadores de loading

**Total: 14 testes**

### `transactions.spec.ts` - Transações
- ✅ Listagem de transações
- ✅ Criação, edição e deleção de transações
- ✅ Validação de campos obrigatórios
- ✅ Filtros por período e busca por descrição
- ✅ Categorização automática com IA
- ✅ Resumo financeiro

**Total: 10 testes**

### `dashboard.spec.ts` - Dashboard e Navegação
- ✅ Navegação entre todas as seções
- ✅ Exibição de gráficos e insights
- ✅ Responsividade mobile
- ✅ Relatórios e exportação
- ✅ Perfil do usuário

**Total: 14 testes**

## 🚀 Executando os Testes

### Instalação
```bash
# Já instalado via pnpm no workspace raiz
pnpm install

# Instalar browsers do Playwright (primeira vez)
npx playwright install
```

### Rodar todos os testes
```bash
pnpm test:e2e
```

### Rodar suite específica
```bash
npx playwright test auth
npx playwright test transactions
npx playwright test dashboard
```

### Modo interativo (UI Mode)
```bash
npx playwright test --ui
```

### Modo Debug
```bash
npx playwright test --debug
```

### Rodar em browser específico
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## 📊 Relatórios

Após execução, o relatório HTML é gerado automaticamente:
```bash
npx playwright show-report
```

## ⚙️ Configuração

### Variáveis de Ambiente
Crie um arquivo `.env.local` baseado em `.env.example`:

```env
E2E_TEST_EMAIL=test@fayol.app
E2E_TEST_PASSWORD=Test@123456
BASE_URL=http://localhost:3000
```

### Browsers Suportados
- ✅ Chromium (Chrome, Edge)
- ✅ Firefox
- ✅ WebKit (Safari)
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 12)

## 📝 Escrevendo Novos Testes

### Template Básico
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup - ex: fazer login
  });

  test('deve fazer algo específico', async ({ page }) => {
    await page.goto('/rota');

    // Interações
    await page.click('button');

    // Asserções
    await expect(page.locator('.result')).toBeVisible();
  });
});
```

### Boas Práticas
- ✅ Use data-testid para elementos dinâmicos
- ✅ Evite timeouts fixos, use `waitFor*`
- ✅ Limpe estado entre testes (cookies, localStorage)
- ✅ Faça um teste por comportamento
- ✅ Use Page Object Model para fluxos complexos
- ✅ Capture evidências (screenshots, vídeos) em falhas

## 🐛 Debugging

### Ver traces de falhas
```bash
npx playwright show-trace trace.zip
```

### Rodar com screenshots
```bash
npx playwright test --screenshot=on
```

### Rodar com vídeo
```bash
npx playwright test --video=on
```

## 📦 CI/CD

Os testes E2E rodam automaticamente no CI quando:
- Pull Request é criado
- Push para branches `main` ou `develop`
- Deployment para staging/production

### Configuração GitHub Actions
```yaml
- name: Run E2E Tests
  run: pnpm test:e2e
  env:
    E2E_TEST_EMAIL: ${{ secrets.E2E_TEST_EMAIL }}
    E2E_TEST_PASSWORD: ${{ secrets.E2E_TEST_PASSWORD }}
```

## 🎯 Coverage

Meta de coverage E2E: **98% dos fluxos críticos**

Fluxos críticos obrigatórios:
- [ ] Autenticação completa
- [ ] CRUD de transações
- [ ] Navegação principal
- [ ] Exibição de insights
- [ ] Filtros e buscas
- [ ] Responsividade mobile

## 📚 Recursos

- [Playwright Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
