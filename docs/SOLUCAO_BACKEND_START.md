# Solução: Iniciar o Backend do Fayol

## Problema Original

O backend estava compilando para `dist/apps/backend/src/` ao invés de `dist/` devido à estrutura do monorepo, causando o erro:
```
Error: Cannot find module 'C:\...\dist\main'
```

## Solução Implementada

### 1. Script Pós-Build

Criado `scripts/post-build.js` que gera um wrapper em `dist/main.js`:

```javascript
// dist/main.js
require('./apps/backend/src/main');
```

### 2. Uso de tsconfig-paths

Como o projeto usa path aliases (`@fayol/validation-schemas`), é necessário usar `tsconfig-paths/register` para resolver os módulos em runtime.

### 3. Scripts Atualizados no package.json

```json
{
  "scripts": {
    "prebuild": "rimraf dist",
    "build": "nest build && node scripts/post-build.js",
    "start": "node scripts/post-build.js && node -r tsconfig-paths/register dist/main.js",
    "dev": "nodemon --watch src --ext ts --exec 'pnpm build && pnpm start'"
  }
}
```

## Como Usar

### Desenvolvimento (Recomendado)

```bash
cd apps/backend

# Compilar e iniciar
pnpm build
pnpm start
```

### Modo Watch (com nodemon)

```bash
cd apps/backend
pnpm dev
```

**Nota**: O modo watch recompila automaticamente quando você salva arquivos.

### Produção

```bash
cd apps/backend
pnpm build
NODE_ENV=production pnpm start:prod
```

## Estrutura de Compilação

```
dist/
├── main.js                    # Wrapper que carrega o main real
├── apps/
│   └── backend/
│       └── src/
│           ├── main.js        # Arquivo principal compilado
│           ├── app.module.js
│           └── ...            # Outros módulos
└── packages/                  # Pacotes compartilhados compilados
```

## Pré-requisitos

1. **Compilar pacotes compartilhados**:
   ```bash
   cd packages/validation-schemas
   pnpm build
   ```

2. **Configurar variáveis de ambiente**:
   - Arquivo `.env` deve existir em `apps/backend/`
   - DATABASE_URL configurado
   - Postgres rodando (ou via Docker)

## Verificação

Quando o servidor inicia corretamente, você verá:

```
[Nest] LOG [NestFactory] Starting Nest application...
[Nest] LOG [InstanceLoader] PrismaModule dependencies initialized
[Nest] LOG [InstanceLoader] AppModule dependencies initialized
[Nest] LOG [RoutesResolver] AuthController {/api/v1/auth}
...
[Nest] LOG Application is running on: http://localhost:3000
```

## Endpoints Disponíveis

- **API**: http://localhost:3000
- **Swagger**: http://localhost:3000/api
- **Health**: http://localhost:3000/health

## Troubleshooting

### Erro: Cannot find module '@fayol/validation-schemas'

**Solução**: Compile o pacote validation-schemas:
```bash
cd ../../packages/validation-schemas
pnpm build
```

### Erro: Cannot find module 'dist/main'

**Solução**: Execute o script post-build:
```bash
node scripts/post-build.js
```

### Erro: Database connection failed

**Solução**:
1. Verifique se o Postgres está rodando
2. Valide o DATABASE_URL no `.env`
3. Execute as migrations: `npx prisma migrate dev`

## Status Final

✅ Backend compila sem erros
✅ Servidor inicia corretamente
✅ Todas as rotas são mapeadas
✅ Integração com Prisma funcional
✅ Módulo AI configurado
