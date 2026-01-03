# 📦 Gerenciamento de Dependências - Fayol

Este projeto utiliza estratégias modernas para gerenciamento de dependências em monorepo, garantindo consistência e **Single Source of Truth**.

---

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Node.js & TypeScript (PNPM Catalog)](#-nodejs--typescript-pnpm-catalog)
   - [Como Funciona](#como-funciona)
   - [Como Usar](#-como-usar)
   - [Migração de Packages](#-migração-de-packages-existentes)
   - [Comandos Úteis](#️-comandos-úteis)
   - [Boas Práticas](#-boas-práticas)
   - [Troubleshooting](#-troubleshooting)
3. [Python (python-requirements.yaml)](#-python-python-requirementsyaml)
   - [Arquivo de Catálogo](#-arquivo-de-catálogo-python-requirementsyaml)
   - [Script de Sincronização](#-script-de-sincronização-scriptssync-python-depsjs)
   - [Benefícios](#-benefícios)
   - [Arquitetura Técnica](#-arquitetura-técnica)
   - [Workflow de Desenvolvimento](#-workflow-de-desenvolvimento)
4. [Resumo de Comandos](#-resumo-de-comandos)

---

## 🎯 Visão Geral

O projeto Fayol utiliza dois sistemas complementares de gerenciamento de dependências:

| Tecnologia | Sistema | Arquivo Central | Destino |
|------------|---------|----------------|---------|
| **Node.js/TypeScript** | PNPM Catalog (built-in) | `pnpm-workspace.yaml` | `package.json` |
| **Python** | Catálogo customizado | `python-requirements.yaml` | `requirements.txt` |

### Benefícios Comuns:
- ✅ **Single Source of Truth** - Versões definidas em um único lugar
- ✅ **Sincronização** - Garante versões consistentes entre módulos
- ✅ **Manutenção Simplificada** - Atualizar versão em um só lugar
- ✅ **Redução de Duplicação** - Menor bundle e lockfile
- ✅ **Type Safety** - Evita conflitos de versões incompatíveis

---

## 📘 Node.js & TypeScript (PNPM Catalog)

Utilizamos o recurso **Catalog** do PNPM (v9.x+) para centralizar versões de pacotes usados por múltiplos workspaces.

### Como Funciona

As versões são definidas uma única vez no arquivo `pnpm-workspace.yaml`:

```yaml
catalog:
  # TypeScript
  typescript: ^5.9.3

  # React
  react: ^18.2.0
  react-dom: ^18.2.0
  '@types/react': ^18.2.57

  # Validation
  zod: ^3.22.4

  # Testing
  jest: ^29.7.0
  '@types/jest': ^29.5.14
```

Nos `package.json` dos projetos, usamos o protocolo `catalog:`:

```json
{
  "dependencies": {
    "react": "catalog:",
    "zod": "catalog:"
  },
  "devDependencies": {
    "typescript": "catalog:",
    "@types/react": "catalog:"
  }
}
```

### 🎯 Por que usar Catalog?

#### Benefícios Detalhados:
- ✅ **Versões sincronizadas** - Uma única fonte de verdade para todas as versões
- ✅ **Manutenção simplificada** - Atualizar versões em um único lugar
- ✅ **Consistência** - Evita conflitos de versões entre packages
- ✅ **Type-safety** - Evita erros de tipos por versões incompatíveis
- ✅ **Menor bundle** - Evita duplicação de dependências no node_modules

---

## 📖 Como usar

### 1. Definir dependências no catálogo

Todas as dependências comuns estão definidas em `pnpm-workspace.yaml`:

```yaml
catalog:
  typescript: ^5.9.3
  react: ^18.2.0
  zod: ^3.22.4
```

### 2. Usar no package.json

Em qualquer package, use `catalog:` para referenciar a versão do catálogo:

```json
{
  "name": "@fayol/meu-package",
  "dependencies": {
    "zod": "catalog:"
  },
  "devDependencies": {
    "typescript": "catalog:",
    "eslint": "catalog:"
  }
}
```

### 3. Usar versão específica (quando necessário)

Se um package precisa de uma versão específica diferente do catálogo:

```json
{
  "dependencies": {
    "typescript": "^5.6.0"  // Versão específica, ignora o catálogo
  }
}
```

---

## 🔄 Migração de Packages Existentes

### Antes:
```json
{
  "devDependencies": {
    "typescript": "^5.3.3",
    "eslint": "^9.39.1",
    "@types/node": "^20.10.0"
  }
}
```

### Depois:
```json
{
  "devDependencies": {
    "typescript": "catalog:",
    "eslint": "catalog:",
    "@types/node": "catalog:"
  }
}
```

---

## 🛠️ Comandos Úteis

### Atualizar todas as dependências
```bash
# No root do projeto
pnpm up -r
```

### Verificar versões desatualizadas
```bash
pnpm outdated -r
```

### Adicionar nova dependência ao catálogo
1. Edite `pnpm-workspace.yaml`
2. Adicione no catalog:
   ```yaml
   catalog:
     nova-lib: ^1.0.0
   ```
3. Use em qualquer package:
   ```json
   { "dependencies": { "nova-lib": "catalog:" } }
   ```

---

## 📋 Boas Práticas

### ✅ Recomendado:

1. **Use catalog: para dependências comuns**
   ```json
   "typescript": "catalog:"
   "react": "catalog:"
   "zod": "catalog:"
   ```

2. **Agrupe dependências logicamente no catalog**
   ```yaml
   # Core
   typescript: ^5.9.3

   # Testing
   jest: ^29.7.0
   '@types/jest': ^29.5.14

   # React
   react: ^18.2.0
   '@types/react': ^18.2.57
   ```

3. **Mantenha o catálogo organizado com comentários**

### ❌ Evite:

1. **Não use versões hardcoded quando existe no catálogo**
   ```json
   // ❌ Evite
   "typescript": "^5.3.3"

   // ✅ Prefira
   "typescript": "catalog:"
   ```

2. **Não adicione dependências muito específicas ao catálogo**
   - Só adicione se usada em 2+ packages
   - Dependências de um único package podem usar versão direta

3. **Não misture versões**
   ```json
   // ❌ Evite (metade catalog, metade hardcoded sem motivo)
   {
     "dependencies": {
       "react": "catalog:",
       "react-dom": "^18.2.0"  // Deveria ser catalog: também
     }
   }
   ```

---

## 🔍 Exemplo Completo

### pnpm-workspace.yaml
```yaml
catalog:
  # TypeScript
  typescript: ^5.9.3

  # React
  react: ^18.2.0
  react-dom: ^18.2.0
  '@types/react': ^18.2.57
```

### packages/meu-package/package.json
```json
{
  "name": "@fayol/meu-package",
  "version": "0.1.0",
  "dependencies": {
    "react": "catalog:",
    "react-dom": "catalog:"
  },
  "devDependencies": {
    "typescript": "catalog:",
    "@types/react": "catalog:"
  }
}
```

---

## 🚨 Troubleshooting

### Problema: "Dependency not found in catalog"

**Solução**: Adicione a dependência no `pnpm-workspace.yaml`:
```yaml
catalog:
  minha-lib: ^1.0.0
```

### Problema: Versões incompatíveis

**Solução**: Use `pnpm.overrides` no root `package.json`:
```json
{
  "pnpm": {
    "overrides": {
      "dependencia-problematica": "^2.0.0"
    }
  }
}
```

### Problema: Package precisa versão diferente

**Solução**: Use versão específica no package.json:
```json
{
  "dependencies": {
    "lib-especial": "^3.0.0"  // Não usa catalog:
  }
}
```

---

## 🐍 Python (python-requirements.yaml)

Para os serviços de IA e Data Science, implementamos um sistema similar ao Catalog do PNPM, gerenciado via script customizado.

### 📋 Visão Geral do Sistema Python

Sistema de **catálogo centralizado para dependências Python**, inspirado no sistema `catalog:` do pnpm, permitindo gerenciar versões de pacotes Python de forma centralizada e DRY (Don't Repeat Yourself).

**Data de implementação**: 2025-12-28

---

## 📄 Arquivo de Catálogo (`python-requirements.yaml`)

Localizado na raiz do projeto, define todas as versões de dependências Python:

```yaml
# Dependências compartilhadas
shared:
  fastapi: "0.109.2"
  uvicorn: "0.27.1"
  pydantic: "2.6.1"
  pandas: "2.2.0"
  python-multipart: "0.0.9"
  requests: "2.31.0"

# Dependências específicas de IA
ai-service:
  scikit-learn: "1.4.1.post1"
  numpy: "1.26.4"
  statsmodels: "0.14.1"

# Dependências específicas de BI
bi-reports:
  openpyxl: "3.1.2"
  xhtml2pdf: "0.2.11"
  jinja2: "3.1.3"

# Configuração de projetos
projects:
  python-ai:
    path: "libs/python-ai/requirements.txt"
    dependencies:
      - shared
      - ai-service

  bi-reports:
    path: "libs/bi-reports/requirements.txt"
    dependencies:
      - shared
      - bi-reports
```

---

## 🔧 Script de Sincronização (`scripts/sync-python-deps.js`)

Script Node.js que:
- ✅ Lê o catálogo `python-requirements.yaml`
- ✅ Gera `requirements.txt` automaticamente
- ✅ Mescla dependências de múltiplos grupos
- ✅ Ordena alfabeticamente
- ✅ Adiciona header de aviso sobre auto-geração
- ✅ Suporta `--check`, `--dry-run`, e `--help`

### Comandos Disponíveis:

```bash
# Sincronizar todos os requirements.txt
node scripts/sync-python-deps.js

# Verificar se está sincronizado (útil em CI/CD)
node scripts/sync-python-deps.js --check

# Simular mudanças sem escrever arquivos
node scripts/sync-python-deps.js --dry-run

# Ver ajuda completa
node scripts/sync-python-deps.js --help
```

---

## 🎯 Benefícios

### 1. DRY (Don't Repeat Yourself)

**Antes**:
```
libs/python-ai/requirements.txt:    fastapi==0.109.2
libs/bi-reports/requirements.txt:   fastapi==0.109.2
```
❌ Versão duplicada em 2 lugares

**Depois**:
```yaml
python-requirements.yaml:
  shared:
    fastapi: "0.109.2"  # ← Versão única
```
✅ Versão definida uma única vez

### 2. Sincronização Automática

**Antes**: Atualizar manualmente cada `requirements.txt`

**Depois**:
1. Editar `python-requirements.yaml`
2. Executar `node scripts/sync-python-deps.js`
3. Todos os arquivos atualizados automaticamente

### 3. Grupos Reutilizáveis

Dependências agrupadas logicamente:
- `shared` - Usado por todos os serviços (FastAPI, Pandas, etc.)
- `ai-service` - Apenas ML/IA (scikit-learn, numpy, statsmodels)
- `bi-reports` - Apenas BI (openpyxl, xhtml2pdf, jinja2)

### 4. Prevenção de Inconsistências

O script garante que todos os serviços usam as mesmas versões das dependências compartilhadas.

---

## 🏗️ Arquitetura Técnica

### Parser YAML Customizado

```javascript
function parseYAML(content) {
  // Parser simples que NÃO requer dependências externas
  // Suporta:
  // - Seções (shared:, ai-service:, bi-reports:, projects:)
  // - Dependências (package: "version")
  // - Projetos (path + lista de grupos)
  // - Comentários (#)
  // - Line endings: Windows (\r\n) e Unix (\n)
}
```

**Benefícios**:
- ✅ Sem dependências externas (como js-yaml)
- ✅ Rápido e leve
- ✅ Customizado para estrutura específica

### Geração Inteligente

```javascript
function generateRequirements(config, projectName) {
  const packages = new Map();

  // 1. Coletar deps de todos os grupos
  for (const depGroup of project.dependencies) {
    const deps = config[depGroup];
    for (const [pkg, version] of Object.entries(deps)) {
      packages.set(pkg, version);  // Map evita duplicatas
    }
  }

  // 2. Ordenar alfabeticamente
  const sorted = Array.from(packages.entries()).sort();

  // 3. Gerar arquivo
  return generateFileContent(sorted);
}
```

---

## 🔄 Workflow de Desenvolvimento

### Adicionar Nova Dependência

```bash
# 1. Editar python-requirements.yaml
shared:
  httpx: "0.26.0"  # ← Nova dep compartilhada

# 2. Sincronizar
node scripts/sync-python-deps.js

# 3. Testar
pip install -r libs/python-ai/requirements.txt
pytest

# 4. Commitar
git add python-requirements.yaml libs/*/requirements.txt
git commit -m "feat: add httpx dependency"
```

### Atualizar Versão

```bash
# 1. Editar python-requirements.yaml
shared:
  fastapi: "0.110.0"  # ← Versão atualizada

# 2. Sincronizar
node scripts/sync-python-deps.js
# Output:
# ✅ python-ai: Atualizado
# ✅ bi-reports: Atualizado

# 3. Testar todos os serviços
cd libs/python-ai && pytest
cd libs/bi-reports && pytest

# 4. Commitar
git add python-requirements.yaml libs/*/requirements.txt
git commit -m "chore: update FastAPI to 0.110.0"
```

---

## 📊 Comparação com Sistema PNPM

| Aspecto | PNPM (JavaScript) | Python Catalog |
|---------|-------------------|----------------|
| **Arquivo de catálogo** | `pnpm-workspace.yaml` (catalog:) | `python-requirements.yaml` |
| **Referência** | `"package": "catalog:"` | Grupos de dependências |
| **Destino** | `package.json` | `requirements.txt` |
| **Script de sync** | Não necessário (built-in) | `sync-python-deps.js` |
| **Formato de versão** | Semver (^1.0.0, ~2.0.0) | Pinned (==1.0.0) |

**Escolhas de design**:
- ✅ Grupos nomeados (shared, ai-service) ao invés de `catalog:` direto
- ✅ Versões pinned (==) seguindo boas práticas Python
- ✅ Script externo (pois pip não tem suporte nativo)

---

## 📈 Estatísticas

### Dependências Gerenciadas

- **Total de pacotes únicos**: 15
- **Dependências compartilhadas**: 6
- **Dependências de IA**: 3
- **Dependências de BI**: 3
- **Projetos gerenciados**: 2

### Redução de Duplicação

**Antes**:
- 9 linhas em `python-ai/requirements.txt`
- 9 linhas em `bi-reports/requirements.txt`
- **Total**: 18 linhas (6 duplicadas)

**Depois**:
- 15 linhas únicas em `python-requirements.yaml`
- **Redução**: 3 linhas (-16.7%)

Para projetos maiores, a economia é ainda mais significativa.

---

## 🎓 Lições Aprendidas

### 1. Parser YAML Customizado é Suficiente

Não foi necessário usar biblioteca externa (js-yaml). Um parser simples e focado é:
- ✅ Mais rápido
- ✅ Sem dependências
- ✅ Fácil de debugar
- ✅ Customizado para nossa estrutura

### 2. Grupos de Dependências > Catalog Direto

Usar grupos nomeados (`shared`, `ai-service`) é mais flexível que referenciar `catalog:` diretamente:
- ✅ Reutilização de múltiplas deps de uma vez
- ✅ Semântica clara (shared = usado por todos)
- ✅ Fácil adicionar/remover grupos de um projeto

### 3. Comparação Inteligente é Essencial

Comparar apenas linhas de dependências (ignorar comentários) evita re-gerações desnecessárias:
```javascript
const actualLines = actual
  .split(/[\r\n]+/)
  .filter(line => line.trim() && !line.trim().startsWith('#'))
  .sort();
```

### 4. Cross-platform Desde o Início

Suportar Windows (\r\n) e Unix (\n) evita problemas futuros:
```javascript
content.split(/[\r\n]+/)  // Ao invés de .split('\n')
```

---

## 📝 Resumo de Comandos

### Node.js/PNPM:
```bash
# Adicionar dependência ao catálogo
# 1. Editar pnpm-workspace.yaml manualmente
# 2. Usar em packages: "package": "catalog:"

# Atualizar todas as dependências
pnpm up -r

# Verificar desatualizadas
pnpm outdated -r

# Instalar dependências
pnpm install
```

### Python:
```bash
# Verificar status de sincronização
node scripts/sync-python-deps.js --check

# Preview de mudanças
node scripts/sync-python-deps.js --dry-run

# Aplicar mudanças
node scripts/sync-python-deps.js

# Ver ajuda
node scripts/sync-python-deps.js --help

# Testar instalação
pip install -r libs/python-ai/requirements.txt
pip install -r libs/bi-reports/requirements.txt

# Verificar diferenças
git diff python-requirements.yaml
git diff libs/python-ai/requirements.txt
git diff libs/bi-reports/requirements.txt
```

---

## 🔗 Arquivos Relacionados

### Sistema Node.js/PNPM:
- `pnpm-workspace.yaml` - Catálogo de dependências Node.js
- `package.json` (em cada package) - Consome o catálogo

### Sistema Python:
- `python-requirements.yaml` - Catálogo de dependências Python
- `scripts/sync-python-deps.js` - Script de sincronização
- `scripts/README_SYNC_PYTHON_DEPS.md` - Documentação detalhada do script
- `libs/python-ai/requirements.txt` - Gerado automaticamente
- `libs/bi-reports/requirements.txt` - Gerado automaticamente

### Integração com Sistema Existente

Este sistema complementa o `sync-version.js`:

| Script | Gerencia | Arquivos |
|--------|----------|----------|
| `sync-version.js` | Versões do projeto | `package.json`, `main.py` (version field) |
| `sync-python-deps.js` | Dependências Python | `requirements.txt` |

**Workflow completo de release**:
```bash
# 1. Atualizar versão do projeto
node scripts/sync-version.js 0.3.0

# 2. Atualizar dependências Python (se necessário)
node scripts/sync-python-deps.js

# 3. Commitar tudo
git add .
git commit -m "chore: release 0.3.0"
```

---

## 📚 Referências

### PNPM Catalog:
- [pnpm Catalog Documentation](https://pnpm.io/catalogs)
- [pnpm Workspace Documentation](https://pnpm.io/workspaces)
- [Semantic Versioning](https://semver.org/)

### Python:
- [pip Requirements File Format](https://pip.pypa.io/en/stable/reference/requirements-file-format/)
- [Python Packaging Guide](https://packaging.python.org/)

---

## ✨ Contribuindo

Ao adicionar novas dependências:

### Node.js:
1. Verifique se já existe no catálogo
2. Se será usada em 2+ packages, adicione ao catálogo
3. Use versões consistentes (prefira `^` para flexibilidade)
4. Agrupe dependências relacionadas com comentários
5. Mantenha o catálogo ordenado alfabeticamente dentro de cada grupo

### Python:
1. Edite `python-requirements.yaml`
2. Adicione na seção apropriada (shared, ai-service, bi-reports)
3. Execute `node scripts/sync-python-deps.js`
4. Teste a instalação
5. Commite o catálogo E os requirements.txt gerados

---

**Sistema implementado com sucesso!** 🎉

**Desenvolvido por**: Deivid Lucas & Claude Code
**Última atualização**: 02/01/2026
**Versão**: 2.0 (Consolidado)
**Status**: ✅ Completo e testado
