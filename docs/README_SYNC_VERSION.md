# 🔄 Script sync-version.js - Documentação

## 📋 Descrição

Script para sincronizar versões em **todos os arquivos** do monorepo Fayol, incluindo:
- ✅ Todos os `package.json` (raiz + workspaces)
- ✅ Arquivos Python do FastAPI (`libs/python-ai/src/main.py` e `libs/bi-reports/src/main.py`)

---

## 🚀 Uso

### Versão Específica

```bash
node scripts/sync-version.js 0.2.0
```

### Bump Automático

```bash
# Incrementa patch: 0.1.0 -> 0.1.1
node scripts/sync-version.js --patch

# Incrementa minor: 0.1.0 -> 0.2.0
node scripts/sync-version.js --minor

# Incrementa major: 0.1.0 -> 1.0.0
node scripts/sync-version.js --major
```

### Com Git Tag

```bash
# Cria tag v0.2.0 automaticamente
node scripts/sync-version.js 0.2.0 --tag

# Bump patch + tag
node scripts/sync-version.js --patch --tag
```

### Dry Run (Simulação)

```bash
# Mostra o que seria feito sem modificar arquivos
node scripts/sync-version.js 0.2.0 --dry-run
```

---

## 📦 O Que o Script Atualiza

### 1. Arquivos `package.json`

Atualiza a propriedade `"version"` em todos os workspaces do monorepo:

```json
{
  "name": "fayol",
  "version": "0.2.0"  // ← Atualizado automaticamente
}
```

**Workspaces incluídos**:
- Raiz (`./package.json`)
- `apps/backend`
- `apps/web-app`
- `apps/mobile`
- `apps/telegram-bot`
- Todos os packages em `packages/*`
- Todos os libs em `libs/*` (se tiverem package.json)

### 2. Arquivos Python (FastAPI)

Atualiza o campo `version` na configuração do FastAPI:

#### `libs/python-ai/src/main.py` (linha 13)

```python
app = FastAPI(
    title="Fayol AI Service",
    description="Microserviço de Inteligência Artificial Avançada",
    version="0.2.0"  # ← Atualizado automaticamente
)
```

#### `libs/bi-reports/src/main.py` (linha 11)

```python
app = FastAPI(
    title="Fayol BI Reports",
    description="Microserviço de Geração de Relatórios (PDF/Excel)",
    version="0.2.0"  # ← Atualizado automaticamente
)
```

---

## 📊 Output do Script

### Exemplo de Execução

```bash
$ node scripts/sync-version.js 0.2.0
```

**Saída**:
```
🔄 Atualizando projeto para a versão: 0.2.0...

✅ .: 0.1.0 -> 0.2.0
✅ apps/backend: 0.1.0 -> 0.2.0
✅ apps/web-app: 0.1.0 -> 0.2.0
...

📝 Atualizando arquivos Python (FastAPI)...

✅ Python AI Service (linha 13): 0.1.1a -> 0.2.0
✅ BI Reports Service (linha 11): 0.1.0 -> 0.2.0

============================================================
📦 package.json:
   ✅ Atualizados: 15
   ℹ️  Pulados: 2

🐍 Arquivos Python:
   ✅ Atualizados: 2

📊 Total: 17 arquivos atualizados
============================================================

🎉 Sincronização concluída!

Próximos passos:
  1. git add .
  2. git commit -m "chore: bump version to 0.2.0"
  3. git push origin main
```

---

## ⚙️ Opções Disponíveis

| Opção | Descrição |
|-------|-----------|
| `--patch` | Incrementa patch version (0.1.0 → 0.1.1) |
| `--minor` | Incrementa minor version (0.1.0 → 0.2.0) |
| `--major` | Incrementa major version (0.1.0 → 1.0.0) |
| `--tag` | Cria git tag após atualizar versões |
| `--dry-run` | Simula execução sem modificar arquivos |
| `--help` | Mostra ajuda |

---

## 🔍 Detalhamento Técnico

### Detecção de Workspaces

O script lê automaticamente `pnpm-workspace.yaml` e expande os patterns:

```yaml
packages:
  - 'apps/*'      # Expande para apps/backend, apps/web-app, etc.
  - 'packages/*'  # Expande para packages/shared-types, etc.
  - 'libs/python-ai'
```

### Validação Semver

Valida formato de versão semantic versioning:

```
✅ Válidos:    0.1.0, 1.2.3, 2.0.0-beta.1, 3.1.0+build.123
❌ Inválidos:  0.1, v1.0.0, 1.0.0.0, abc
```

### Padrão de Regex Python

Para encontrar e substituir a versão nos arquivos Python:

```javascript
pattern: /(version\s*=\s*")[^"]+(")/
```

**Exemplos que funcionam**:
```python
version="0.1.0"
version = "1.2.3"
version  =  "2.0.0-beta"
```

---

## 🛡️ Segurança

### Dry Run Recomendado

Sempre execute com `--dry-run` primeiro para verificar:

```bash
node scripts/sync-version.js 0.2.0 --dry-run
```

### Backup Automático (Git)

O script **não cria backup** dos arquivos. Certifique-se de:
- ✅ Ter commits recentes
- ✅ Estar em uma branch adequada
- ✅ Verificar status com `git status` antes

---

## 📝 Workflow Recomendado

### 1. Verificar Status

```bash
git status
# Certifique-se de não ter mudanças pendentes
```

### 2. Simular Atualização

```bash
node scripts/sync-version.js 0.2.0 --dry-run
```

### 3. Executar Atualização

```bash
node scripts/sync-version.js 0.2.0
```

### 4. Revisar Mudanças

```bash
git diff
```

### 5. Commitar

```bash
git add .
git commit -m "chore: bump version to 0.2.0"
```

### 6. (Opcional) Criar Tag Manualmente

```bash
git tag -a v0.2.0 -m "Release v0.2.0"
git push origin main --tags
```

**Ou usar `--tag` direto**:
```bash
node scripts/sync-version.js 0.2.0 --tag
git push origin main --tags
```

---

## 🐛 Troubleshooting

### Erro: "Versão inválida"

**Problema**: `❌ Versão inválida: 1.0`

**Solução**: Use formato semver completo: `1.0.0`

### Erro: "package.json não encontrado"

**Problema**: `⚠️ apps/xyz: package.json não encontrado`

**Solução**: Normal para workspaces sem package.json (são pulados automaticamente)

### Erro: "padrão de versão não encontrado"

**Problema**: `⚠️ Python AI Service: padrão de versão não encontrado`

**Solução**: Verifique se o arquivo contém `version="..."` no formato esperado

### Git Tag já existe

**Problema**: `⚠️ Tag v0.2.0 já existe`

**Solução**:
- Delete a tag: `git tag -d v0.2.0`
- Ou use outra versão

---

## 🔧 Manutenção

### Adicionar Novos Arquivos Python

Edite a função `updatePythonFiles()` em `scripts/sync-version.js`:

```javascript
const pythonFiles = [
  {
    path: 'libs/python-ai/src/main.py',
    name: 'Python AI Service',
    pattern: /(version\s*=\s*")[^"]+(")/,
    lineHint: 'linha 13'
  },
  // Adicione aqui novos arquivos:
  {
    path: 'libs/novo-servico/src/main.py',
    name: 'Novo Serviço',
    pattern: /(version\s*=\s*")[^"]+(")/,
    lineHint: 'linha X'
  }
];
```

### Adicionar Outros Tipos de Arquivo

Para adicionar suporte a outros tipos (ex: Rust `Cargo.toml`), crie uma nova função similar a `updatePythonFiles()`.

---

## 📚 Exemplos Práticos

### Exemplo 1: Release Patch

```bash
# Situação: versão atual é 0.1.0
# Corrigiu um bug e quer fazer release patch

node scripts/sync-version.js --patch --tag
# Resultado: 0.1.0 -> 0.1.1 + tag v0.1.1

git push origin main --tags
```

### Exemplo 2: Release Minor (Nova Feature)

```bash
# Situação: versão atual é 0.1.5
# Adicionou nova feature

node scripts/sync-version.js --minor --tag
# Resultado: 0.1.5 -> 0.2.0 + tag v0.2.0

git push origin main --tags
```

### Exemplo 3: Release Major (Breaking Change)

```bash
# Situação: versão atual é 0.9.0
# Mudança que quebra compatibilidade

node scripts/sync-version.js --major --tag
# Resultado: 0.9.0 -> 1.0.0 + tag v1.0.0

git push origin main --tags
```

### Exemplo 4: Beta Release

```bash
# Situação: quer lançar beta antes do 1.0.0

node scripts/sync-version.js 1.0.0-beta.1
# Resultado: X.X.X -> 1.0.0-beta.1

git add .
git commit -m "chore: release 1.0.0-beta.1"
git tag -a v1.0.0-beta.1 -m "Beta release"
git push origin main --tags
```

---

## ✅ Checklist de Uso

Antes de executar o script:

- [ ] Código está commitado (sem mudanças pendentes)
- [ ] Testes estão passando (`pnpm test`)
- [ ] Build está funcionando (`pnpm build`)
- [ ] Documentação está atualizada
- [ ] CHANGELOG foi atualizado (se aplicável)

Após executar o script:

- [ ] Revisar mudanças com `git diff`
- [ ] Verificar que todos os arquivos foram atualizados
- [ ] Criar commit: `git commit -m "chore: bump version to X.X.X"`
- [ ] Fazer push: `git push origin main`
- [ ] (Opcional) Push de tags: `git push origin --tags`

---

**Script criado por**: Claude Code
**Última atualização**: 2025-12-28
**Versão do script**: 2.0 (com suporte a Python)
