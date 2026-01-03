# 🐍 Script sync-python-deps.js - Documentação

## 📋 Descrição

Script para sincronizar dependências Python em **todos os microserviços** do monorepo Fayol, usando um **catálogo centralizado** (`python-requirements.yaml`) similar ao sistema de catalog do pnpm.

**Benefícios**:
- ✅ Versões centralizadas em um único arquivo
- ✅ DRY (Don't Repeat Yourself) - sem duplicação de versões
- ✅ Sincronização automática de `requirements.txt`
- ✅ Grupos de dependências reutilizáveis (shared, ai-service, bi-reports)
- ✅ Fácil manutenção e atualização de versões

---

## 🚀 Uso

### Sincronizar Todos os requirements.txt

```bash
node scripts/sync-python-deps.js
```

### Verificar Status de Sincronização

```bash
node scripts/sync-python-deps.js --check
```

### Simular Sem Modificar (Dry Run)

```bash
node scripts/sync-python-deps.js --dry-run
```

### Ajuda

```bash
node scripts/sync-python-deps.js --help
```

---

## 📦 Arquitetura do Sistema

### 1. Catálogo Centralizado (`python-requirements.yaml`)

```yaml
# ============================================================
# CATÁLOGO CENTRALIZADO DE DEPENDÊNCIAS PYTHON
# ============================================================

# Dependências compartilhadas (usadas por múltiplos serviços)
shared:
  fastapi: "0.109.2"
  uvicorn: "0.27.1"
  pydantic: "2.6.1"
  pandas: "2.2.0"
  python-multipart: "0.0.9"
  requests: "2.31.0"

# Dependências específicas do serviço de IA
ai-service:
  scikit-learn: "1.4.1.post1"
  numpy: "1.26.4"
  statsmodels: "0.14.1"

# Dependências específicas do serviço de BI
bi-reports:
  openpyxl: "3.1.2"
  xhtml2pdf: "0.2.11"
  jinja2: "3.1.3"

# Configuração de projetos (quais dependências cada projeto usa)
projects:
  python-ai:
    path: "libs/python-ai/requirements.txt"
    dependencies:
      - shared        # ← Inclui todas as deps do grupo 'shared'
      - ai-service    # ← Inclui todas as deps do grupo 'ai-service'

  bi-reports:
    path: "libs/bi-reports/requirements.txt"
    dependencies:
      - shared        # ← Inclui todas as deps do grupo 'shared'
      - bi-reports    # ← Inclui todas as deps do grupo 'bi-reports'
```

### 2. Arquivos requirements.txt Gerados Automaticamente

```txt
# ============================================================
# DEPENDÊNCIAS PYTHON - GERENCIADAS AUTOMATICAMENTE
# ============================================================
# Este arquivo é gerado automaticamente a partir de:
# python-requirements.yaml
#
# NÃO EDITE MANUALMENTE!
# Para atualizar, edite python-requirements.yaml e execute:
#   node scripts/sync-python-deps.js
# ============================================================

fastapi==0.109.2
numpy==1.26.4
pandas==2.2.0
pydantic==2.6.1
python-multipart==0.0.9
requests==2.31.0
scikit-learn==1.4.1.post1
statsmodels==0.14.1
uvicorn==0.27.1
```

**Características**:
- ✅ Header automático indicando que é auto-gerado
- ✅ Dependências ordenadas alfabeticamente
- ✅ Formato padrão `package==version`
- ✅ Mescla dependências de múltiplos grupos automaticamente

---

## 📊 Output do Script

### Exemplo 1: Verificar Status

```bash
$ node scripts/sync-python-deps.js --check
```

**Saída**:
```
🐍 Sincronizando Dependências Python...

✅ python-ai: Sincronizado
✅ bi-reports: Sincronizado

============================================================
✅ Sincronizados: 2
============================================================
```

### Exemplo 2: Sincronizar (Quando Há Mudanças)

```bash
$ node scripts/sync-python-deps.js
```

**Saída**:
```
🐍 Sincronizando Dependências Python...

✅ python-ai: Atualizado
ℹ️  bi-reports: Já está sincronizado

============================================================
✅ Atualizados: 1
ℹ️  Pulados: 1
============================================================

🎉 Sincronização concluída!

Próximos passos:
  1. Revisar mudanças: git diff
  2. Testar localmente: pip install -r libs/python-ai/requirements.txt
  3. Commitar: git add . && git commit -m "chore: sync Python dependencies"
```

### Exemplo 3: Dry Run

```bash
$ node scripts/sync-python-deps.js --dry-run
```

**Saída**:
```
🐍 Sincronizando Dependências Python...

[DRY RUN] Nenhum arquivo será modificado

✅ python-ai: Atualizado
ℹ️  bi-reports: Já está sincronizado

============================================================
✅ Atualizados: 1
ℹ️  Pulados: 1
============================================================

[DRY RUN] Execução simulada concluída
```

---

## 🔧 Como Adicionar/Atualizar Dependências

### Cenário 1: Adicionar Nova Dependência Compartilhada

**Objetivo**: Adicionar `httpx` para todos os serviços

1. Edite `python-requirements.yaml`:

```yaml
shared:
  fastapi: "0.109.2"
  uvicorn: "0.27.1"
  # ... outras deps
  httpx: "0.26.0"  # ← Nova dependência
```

2. Execute o script:

```bash
node scripts/sync-python-deps.js
```

3. Resultado: `httpx==0.26.0` será adicionado em **ambos** os requirements.txt (python-ai e bi-reports)

### Cenário 2: Atualizar Versão de Dependência

**Objetivo**: Atualizar FastAPI de 0.109.2 para 0.110.0

1. Edite `python-requirements.yaml`:

```yaml
shared:
  fastapi: "0.110.0"  # ← Versão atualizada
```

2. Execute:

```bash
node scripts/sync-python-deps.js
```

3. Resultado: **Todos** os serviços que usam `shared` terão FastAPI atualizado automaticamente

### Cenário 3: Adicionar Dependência Específica de um Serviço

**Objetivo**: Adicionar `tensorflow` apenas no serviço de IA

1. Edite `python-requirements.yaml`:

```yaml
ai-service:
  scikit-learn: "1.4.1.post1"
  numpy: "1.26.4"
  statsmodels: "0.14.1"
  tensorflow: "2.15.0"  # ← Nova dependência específica
```

2. Execute:

```bash
node scripts/sync-python-deps.js
```

3. Resultado: `tensorflow` será adicionado **apenas** em `libs/python-ai/requirements.txt`

### Cenário 4: Criar Novo Grupo de Dependências

**Objetivo**: Criar grupo `database` para deps de banco de dados

1. Edite `python-requirements.yaml`:

```yaml
# Novo grupo
database:
  sqlalchemy: "2.0.25"
  psycopg2-binary: "2.9.9"

# Atualizar projeto para usar o novo grupo
projects:
  python-ai:
    path: "libs/python-ai/requirements.txt"
    dependencies:
      - shared
      - ai-service
      - database  # ← Novo grupo adicionado
```

2. Execute:

```bash
node scripts/sync-python-deps.js
```

---

## 🆚 Comparação: Antes vs Depois

### ❌ Antes (Sem Catálogo)

**Problema**: Versões duplicadas e desatualizadas

`libs/python-ai/requirements.txt`:
```
fastapi==0.109.2
pandas==2.2.0
numpy==1.26.4
```

`libs/bi-reports/requirements.txt`:
```
fastapi==0.108.0   # ← Versão diferente!
pandas==2.1.0      # ← Versão diferente!
```

**Dificuldades**:
- ❌ Manter versões sincronizadas manualmente
- ❌ Duplicação de informação
- ❌ Risco de inconsistências

### ✅ Depois (Com Catálogo)

**Solução**: Versão única centralizada

`python-requirements.yaml`:
```yaml
shared:
  fastapi: "0.109.2"  # ← Versão única
  pandas: "2.2.0"     # ← Versão única
```

`projects`:
```yaml
python-ai:
  dependencies: [shared, ai-service]

bi-reports:
  dependencies: [shared, bi-reports]
```

**Benefícios**:
- ✅ Versão única e centralizada
- ✅ Sincronização automática
- ✅ DRY (Don't Repeat Yourself)

---

## 🔍 Detalhamento Técnico

### Parser YAML Customizado

O script usa um parser YAML simplificado (não requer dependências externas):

```javascript
function parseYAML(content) {
  // Parse customizado que suporta:
  // - Seções: shared:, ai-service:, bi-reports:, projects:
  // - Dependências: package: "version"
  // - Projetos: path + lista de dependency groups
  // - Comentários #
  // - Line endings: Windows (\r\n) e Unix (\n)
}
```

### Geração de requirements.txt

```javascript
function generateRequirements(config, projectName) {
  // 1. Coleta dependências de todos os grupos do projeto
  // 2. Mescla em um Map (evita duplicatas)
  // 3. Ordena alfabeticamente
  // 4. Gera arquivo com header + deps no formato package==version
}
```

### Verificação de Sincronização

```javascript
function checkRequirements(config, projectName) {
  // 1. Lê arquivo atual
  // 2. Gera arquivo esperado
  // 3. Compara apenas as linhas de dependências (ignora comentários)
  // 4. Retorna: { synced: boolean, reason: string }
}
```

---

## 🛡️ Segurança e Boas Práticas

### Dry Run Recomendado

Sempre use `--dry-run` antes de sincronizar:

```bash
node scripts/sync-python-deps.js --dry-run
```

### Verificar Antes de Commitar

```bash
# 1. Verificar mudanças
git diff

# 2. Testar instalação local
pip install -r libs/python-ai/requirements.txt
pip install -r libs/bi-reports/requirements.txt

# 3. Commitar
git add .
git commit -m "chore: sync Python dependencies"
```

### Header de Aviso

Os arquivos gerados incluem header avisando:

```
# NÃO EDITE MANUALMENTE!
# Para atualizar, edite python-requirements.yaml e execute:
#   node scripts/sync-python-deps.js
```

---

## 📝 Workflow Recomendado

### 1. Atualizar Dependência

```bash
# Editar python-requirements.yaml
vim python-requirements.yaml

# Verificar mudanças (dry run)
node scripts/sync-python-deps.js --dry-run

# Aplicar mudanças
node scripts/sync-python-deps.js

# Revisar
git diff

# Testar
cd libs/python-ai
pip install -r requirements.txt
pytest
```

### 2. Adicionar Nova Dependência

```bash
# 1. Adicionar no grupo apropriado em python-requirements.yaml
# 2. Sincronizar
node scripts/sync-python-deps.js

# 3. Testar
pip install -r libs/python-ai/requirements.txt

# 4. Commitar
git add python-requirements.yaml libs/*/requirements.txt
git commit -m "feat: add httpx dependency"
```

### 3. Criar Novo Serviço Python

```bash
# 1. Criar diretório
mkdir -p libs/novo-servico/src

# 2. Adicionar no python-requirements.yaml
projects:
  novo-servico:
    path: "libs/novo-servico/requirements.txt"
    dependencies:
      - shared
      # - outros grupos conforme necessário

# 3. Gerar requirements.txt
node scripts/sync-python-deps.js
```

---

## 🐛 Troubleshooting

### Erro: "Projeto não encontrado no python-requirements.yaml"

**Problema**: `❌ meu-projeto: Erro - Projeto meu-projeto não encontrado`

**Solução**: Adicione o projeto na seção `projects:` do `python-requirements.yaml`:

```yaml
projects:
  meu-projeto:
    path: "libs/meu-projeto/requirements.txt"
    dependencies:
      - shared
```

### Erro: "Grupo de dependências não encontrado"

**Problema**: `⚠️ Grupo de dependências 'xyz' não encontrado`

**Solução**: Verifique se o grupo existe no YAML:

```yaml
xyz:  # ← Grupo deve existir
  package1: "1.0.0"
```

### Arquivo Desatualizado

**Problema**: `⚠️ python-ai: Desatualizado`

**Solução**: Execute o script para sincronizar:

```bash
node scripts/sync-python-deps.js
```

---

## 🔄 Integração com CI/CD

### GitHub Actions

```yaml
name: Validate Python Dependencies

on: [push, pull_request]

jobs:
  check-python-deps:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Check Python Dependencies Sync
        run: node scripts/sync-python-deps.js --check
```

### Pre-commit Hook

```bash
# .husky/pre-commit
node scripts/sync-python-deps.js --check || {
  echo "❌ Python dependencies desatualizados!"
  echo "Execute: node scripts/sync-python-deps.js"
  exit 1
}
```

---

## 📚 Exemplos Práticos

### Exemplo 1: Atualizar FastAPI em Todos os Serviços

```bash
# 1. Editar python-requirements.yaml
# shared:
#   fastapi: "0.110.0"  # ← Atualizado

# 2. Sincronizar
node scripts/sync-python-deps.js

# Output:
# ✅ python-ai: Atualizado
# ✅ bi-reports: Atualizado
```

### Exemplo 2: Adicionar Biblioteca de Testes

```bash
# 1. Criar novo grupo 'testing'
# testing:
#   pytest: "7.4.4"
#   pytest-asyncio: "0.23.3"
#   httpx: "0.26.0"

# 2. Adicionar aos projetos
# projects:
#   python-ai:
#     dependencies:
#       - shared
#       - ai-service
#       - testing  # ← Novo

# 3. Sincronizar
node scripts/sync-python-deps.js
```

### Exemplo 3: Versão Específica para Desenvolvimento

```bash
# Criar grupo dev
# dev:
#   black: "24.1.1"
#   ruff: "0.1.14"
#   mypy: "1.8.0"

# Adicionar apenas onde necessário
# projects:
#   python-ai:
#     dependencies:
#       - shared
#       - ai-service
#       - dev  # ← Apenas em dev
```

---

## ✅ Checklist de Uso

Antes de sincronizar:

- [ ] Editou `python-requirements.yaml` com as mudanças desejadas
- [ ] Executou `--dry-run` para preview
- [ ] Revisou o que será modificado

Após sincronizar:

- [ ] Executou `git diff` para revisar mudanças
- [ ] Testou instalação: `pip install -r libs/*/requirements.txt`
- [ ] Executou testes: `pytest`
- [ ] Commitou: `git commit -m "chore: sync Python dependencies"`

---

## 🔗 Arquivos Relacionados

- `python-requirements.yaml` - Catálogo centralizado
- `scripts/sync-python-deps.js` - Script de sincronização
- `libs/python-ai/requirements.txt` - Requirements do serviço de IA
- `libs/bi-reports/requirements.txt` - Requirements do serviço de BI

---

## 📖 Conceitos

### DRY (Don't Repeat Yourself)

Versões definidas uma única vez, reutilizadas em múltiplos projetos.

### Grupos de Dependências

Dependências relacionadas agrupadas logicamente (shared, ai-service, bi-reports, etc.).

### Sincronização Automática

Arquivo YAML como fonte única de verdade, requirements.txt gerados automaticamente.

### Comparação Inteligente

Compara apenas dependências (ignora comentários e formatação).

---

**Script criado por**: Claude Code
**Data de criação**: 2025-12-28
**Versão**: 1.0
**Integração**: Funciona em conjunto com `sync-version.js` para versionamento completo (JavaScript + Python)
