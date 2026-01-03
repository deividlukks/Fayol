# Gerenciamento do Catalog do PNPM

Este documento descreve como gerenciar dependências usando o catalog do pnpm no monorepo Fayol.

## O que é o Catalog?

O catalog do pnpm permite centralizar as versões de todas as dependências no arquivo `pnpm-workspace.yaml`. Em vez de especificar versões diretamente em cada `package.json`, usamos `"catalog:"` e a versão real é definida no catalog.

### Vantagens

- **Consistência**: Todas as dependências usam a mesma versão em todo o monorepo
- **Manutenção**: Atualizar uma dependência em um único lugar
- **Visibilidade**: Todas as versões estão centralizadas em um arquivo
- **Segurança**: Reduz conflitos de versão entre pacotes

## Estrutura

### pnpm-workspace.yaml

```yaml
catalog:
  react: ^18.2.0
  axios: ^1.6.7
  typescript: ^5.9.3
```

### package.json

```json
{
  "dependencies": {
    "react": "catalog:",
    "axios": "catalog:"
  },
  "devDependencies": {
    "typescript": "catalog:"
  }
}
```

## Scripts Disponíveis

### 1. `pnpm run sync-catalog`

Verifica todas as dependências hardcoded no monorepo.

```bash
pnpm run sync-catalog
```

**Saída:**
- Lista todas as dependências com versões hardcoded
- Mostra quais já estão no catalog
- Mostra quais não estão no catalog
- Não faz alterações

**Opções:**
- `--verbose` ou `-v`: Mostra detalhes completos de cada dependência

```bash
pnpm run sync-catalog --verbose
```

### 2. `pnpm run sync-catalog:fix`

Converte automaticamente todas as dependências que já estão no catalog para usar `"catalog:"`.

```bash
pnpm run sync-catalog:fix
```

**O que faz:**
1. Procura todas as dependências hardcoded
2. Verifica quais existem no catalog
3. Converte para `"catalog:"` nos package.json
4. **NÃO** adiciona novas dependências ao catalog

**Quando usar:**
- Após adicionar manualmente uma dependência ao catalog
- Após fazer merge de branches que tenham versões hardcoded
- Para limpar package.json que ainda não usam catalog

### 3. `pnpm run sync-catalog:add`

Adiciona dependências ao catalog E converte para usar `"catalog:"`.

```bash
pnpm run sync-catalog:add
```

**O que faz:**
1. Procura todas as dependências hardcoded
2. Adiciona as que não existem ao catalog do `pnpm-workspace.yaml`
3. Converte todas para usar `"catalog:"` nos package.json

**Quando usar:**
- Ao adicionar uma nova dependência pela primeira vez
- Para migrar pacotes antigos que usam versões hardcoded
- Depois de instalar dependências sem adicionar ao catalog

### 4. `pnpm run validate-catalog`

Valida que todas as dependências estão usando `"catalog:"`. Falha se encontrar versões hardcoded.

```bash
pnpm run validate-catalog
```

**O que faz:**
- Verifica todos os package.json
- Falha (exit code 1) se encontrar versões hardcoded
- Usado no CI/CD e no pre-commit hook

**Quando usar:**
- CI/CD pipelines
- Pre-commit hooks (já configurado)
- Validação manual antes de commits

## Workflow Recomendado

### Adicionando uma nova dependência

#### Opção 1: Manual (recomendado para controle)

1. Adicione ao catalog do `pnpm-workspace.yaml`:

```yaml
catalog:
  # ... outras dependências
  nova-lib: ^1.2.3
```

2. Use no package.json:

```json
{
  "dependencies": {
    "nova-lib": "catalog:"
  }
}
```

3. Instale:

```bash
pnpm install
```

#### Opção 2: Automática

1. Instale com versão hardcoded:

```bash
cd apps/backend
pnpm add express@^4.18.2
```

2. Converta automaticamente:

```bash
# Na raiz do monorepo
pnpm run sync-catalog:add
```

### Atualizando uma dependência

1. Atualize a versão no `pnpm-workspace.yaml`:

```yaml
catalog:
  react: ^18.3.0  # era ^18.2.0
```

2. Instale:

```bash
pnpm install
```

Todos os pacotes que usam `"react": "catalog:"` serão atualizados automaticamente.

### Corrigindo erros do pre-commit hook

Se o pre-commit hook falhar com:

```
⚠️  Encontradas dependências hardcoded!
Execute 'pnpm run sync-catalog:fix' para corrigir automaticamente
```

**Solução:**

```bash
# Se as dependências já existem no catalog
pnpm run sync-catalog:fix

# Se são dependências novas
pnpm run sync-catalog:add

# Tente o commit novamente
git add .
git commit -m "sua mensagem"
```

## Integração com Git Hooks

O projeto está configurado com um pre-commit hook que:

1. Valida se todas as dependências usam `"catalog:"`
2. Bloqueia o commit se encontrar versões hardcoded
3. Sugere comandos para corrigir

### Arquivo: `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Valida catalog
pnpm run validate-catalog || {
  echo "Execute 'pnpm run sync-catalog:fix' para corrigir"
  exit 1
}

# Formata código
pnpm exec lint-staged
```

### Desabilitando temporariamente

Se precisar fazer um commit urgente sem validar o catalog:

```bash
git commit -m "mensagem" --no-verify
```

⚠️ **Atenção**: Use apenas em casos excepcionais. Corrija as dependências o mais rápido possível.

## Exceções ao Catalog

Algumas dependências não devem usar catalog:

### 1. Dependências do workspace

```json
{
  "dependencies": {
    "@fayol/shared-types": "workspace:*"
  }
}
```

### 2. Dependências com npm alias

```json
{
  "dependencies": {
    "react-native": "npm:react-native-web@~0.19.13"
  }
}
```

### 3. Dependências locais

```json
{
  "dependencies": {
    "my-lib": "link:../my-lib"
  }
}
```

Essas são automaticamente ignoradas pelos scripts de validação.

## Troubleshooting

### Erro: "Esta dependência existe no catalog!"

**Causa:** Você tem uma versão hardcoded que já existe no catalog.

**Solução:**
```bash
pnpm run sync-catalog:fix
```

### Erro: "Esta dependência não está no catalog"

**Causa:** Você tem uma dependência nova que não foi adicionada ao catalog.

**Solução:**
```bash
pnpm run sync-catalog:add
```

### Versões diferentes entre catalog e package.json

**Sintoma:** O script mostra "⚠ Versão diferente no catalog"

**Causa:** A versão no package.json é diferente da versão no catalog.

**Solução:**
1. Decida qual versão usar
2. Atualize o catalog se necessário
3. Execute `pnpm run sync-catalog:fix`

### Script falha ao ler arquivos

**Causa:** Arquivo YAML mal formatado ou package.json inválido.

**Solução:**
1. Valide o YAML: `pnpm exec js-yaml pnpm-workspace.yaml`
2. Valide o JSON: `node -e "require('./package.json')"`
3. Use `--verbose` para ver o erro completo

## CI/CD Integration

### GitHub Actions

```yaml
name: Validate Dependencies

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm run validate-catalog
```

### Pre-push hook (opcional)

Para validação adicional antes de push:

```bash
# .husky/pre-push
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm run validate-catalog
```

Crie o arquivo:
```bash
echo '#!/usr/bin/env sh
. "$(dirname -- \"\$0\")/_/husky.sh"

pnpm run validate-catalog' > .husky/pre-push

chmod +x .husky/pre-push
```

## Manutenção

### Atualização em massa

Para atualizar todas as dependências:

1. Use ferramentas como `npm-check-updates`:

```bash
# Instalar globalmente
npm install -g npm-check-updates

# Atualizar catalog
ncu --packageFile pnpm-workspace.yaml -u
```

2. Ou atualize manualmente o `pnpm-workspace.yaml`

3. Instale as novas versões:

```bash
pnpm install
pnpm run build
pnpm run test
```

### Auditoria de dependências

```bash
# Verifica vulnerabilidades
pnpm audit

# Atualiza apenas patches de segurança
pnpm audit --fix
```

## Referências

- [PNPM Catalog](https://pnpm.io/catalogs)
- [PNPM Workspace](https://pnpm.io/workspaces)
- [Husky](https://typicode.github.io/husky/)
- [Gerenciamento de Dependências PNPM](./GERENCIAMENTO_DEPENDENCIAS_PNPM.md) (se existir)

## Suporte

Se encontrar problemas:

1. Verifique este documento
2. Execute com `--verbose` para mais detalhes
3. Abra uma issue no repositório
4. Consulte a equipe de desenvolvimento
