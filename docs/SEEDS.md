# 🌱 Guia de Seeds do Fayol

Documentação completa sobre o sistema de seeds (população inicial do banco de dados) do projeto Fayol.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Estrutura de Arquivos](#estrutura-de-arquivos)
- [Como Usar](#como-usar)
- [Seeds Disponíveis](#seeds-disponíveis)
- [Exemplos de Uso](#exemplos-de-uso)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O sistema de seeds do Fayol foi projetado para ser:

- **Modular**: Seeds podem ser executados individualmente ou em conjunto
- **Idempotente**: Pode ser executado múltiplas vezes sem duplicar dados (usa `upsert`)
- **Organizado**: Código separado em arquivos temáticos
- **Bem documentado**: Cada seed explica o que faz

---

## 📁 Estrutura de Arquivos

```
apps/backend/prisma/
├── schema.prisma              # Schema do banco de dados
├── seed-all.ts                # ✅ Orquestrador principal (executa todos)
├── seed.ts                    # ⚠️  DEPRECATED - usar seed-all.ts
├── seed-admin.ts              # ⚠️  DEPRECATED - usar seeds/admin.seed.ts
└── seeds/
    ├── index.ts               # Exporta todas as funções de seed
    ├── categories.seed.ts     # Categorias e subcategorias do sistema
    └── admin.seed.ts          # Admin, planos, versão e configurações
```

---

## 🚀 Como Usar

### Método 1: Via Prisma CLI (RECOMENDADO)

```bash
# Executar TODOS os seeds
pnpm prisma db seed

# Ou via script npm
pnpm prisma:seed
```

Este método executa `prisma/seed-all.ts` que orquestra todos os seeds na ordem correta.

### Método 2: Seeds Individuais

```bash
# Apenas categorias e subcategorias
pnpm prisma:seed:categories

# Apenas módulo administrativo (admin, planos, config)
pnpm prisma:seed:admin
```

### Método 3: Execução Direta

```bash
# Seed completo
ts-node apps/backend/prisma/seed-all.ts

# Seed de categorias
ts-node apps/backend/prisma/seeds/categories.seed.ts

# Seed do admin
ts-node apps/backend/prisma/seeds/admin.seed.ts
```

### Método 4: Reset Completo do Banco + Seed

```bash
# ⚠️  CUIDADO: Apaga TODOS os dados e recria do zero
pnpm prisma:reset

# Este comando:
# 1. Apaga o banco de dados
# 2. Recria todas as tabelas
# 3. Executa todos os seeds automaticamente
```

---

## 📦 Seeds Disponíveis

### 1. Seed de Categorias (`categories.seed.ts`)

**O que faz:**
- Cria categorias e subcategorias padrão do sistema
- Marcadas como `isSystem: true` (não podem ser editadas por usuários)
- `userId: null` (globais para todos os usuários)

**Conteúdo:**

#### 📥 Categorias de Receita (4 categorias, 12 subcategorias)
- **Salário** (CLT, PJ, 13º, Férias)
- **Freelance** (Projetos, Consultoria)
- **Investimentos** (Dividendos, Juros, Aluguel)
- **Outros** (Presentes, Reembolsos, Prêmios)

#### 📤 Categorias de Despesa (9 categorias, 42 subcategorias)
- **Alimentação** (Supermercado, Restaurante, Lanche, Delivery)
- **Transporte** (Combustível, Uber, Público, Estacionamento, Manutenção)
- **Moradia** (Aluguel, Condomínio, Água, Luz, Gás, Internet, IPTU)
- **Saúde** (Plano, Farmácia, Consultas, Exames, Academia)
- **Educação** (Cursos, Livros, Material, Mensalidade)
- **Lazer** (Cinema, Streaming, Viagens, Eventos, Hobbies)
- **Vestuário** (Roupas, Calçados, Acessórios)
- **Pets** (Veterinário, Ração, Banho e Tosa)
- **Outros** (Doações, Presentes, Taxas, Diversos)

#### 📊 Categorias de Investimento (4 categorias, 15 subcategorias)
- **Renda Fixa** (Tesouro, CDB, LCI/LCA, Poupança)
- **Renda Variável** (Ações, FIIs, ETFs, BDRs)
- **Criptomoedas** (Bitcoin, Ethereum, Outras)
- **Previdência** (PGBL, VGBL)

**Total:** 17 categorias + 69 subcategorias

---

### 2. Seed do Admin (`admin.seed.ts`)

**O que faz:**
- Cria administrador padrão do sistema
- Cria planos de assinatura
- Cria versão inicial do sistema
- Cria configurações do sistema

**Conteúdo:**

#### 👑 Administrador Padrão
```
Email: admin@fayol.app
Senha: admin@123
Role: super_admin
```

⚠️ **IMPORTANTE:** Altere esta senha em produção!

#### 💳 Planos de Assinatura

| Plano | Preço | Contas | Transações/mês | Recursos |
|-------|-------|--------|----------------|----------|
| **Free** | R$ 0,00 | 3 | 100 | Básico |
| **Basic** | R$ 9,90 | 5 | 1.000 | + 10 IA requests |
| **Premium** | R$ 29,90 | Ilimitado | Ilimitado | + IA + Investimentos + Trading |
| **Enterprise** | R$ 99,90 | Ilimitado | Ilimitado | Tudo + Suporte Prioritário |

#### 🔄 Versão do Sistema
- Versão: 1.0.0
- Tipo: Major Release
- Features documentadas

#### ⚙️ Configurações do Sistema
- `maintenance_mode`: Modo de manutenção
- `allow_registrations`: Permitir novos cadastros
- `default_plan`: Plano padrão (Free)
- `smtp_settings`: Configurações de email
- `payment_gateways`: Gateways de pagamento

---

## 💡 Exemplos de Uso

### Exemplo 1: Setup Inicial do Projeto

```bash
# 1. Criar o banco de dados
pnpm prisma migrate dev

# 2. Popular com dados iniciais
pnpm prisma db seed

# 3. Verificar no Prisma Studio
pnpm prisma:studio
```

### Exemplo 2: Reset Completo do Ambiente de Desenvolvimento

```bash
# Apaga tudo e recria do zero
pnpm prisma:reset

# Confirme quando solicitado
```

### Exemplo 3: Adicionar Apenas Novas Categorias

```bash
# Se você já tem admin configurado, mas quer adicionar/atualizar categorias
pnpm prisma:seed:categories
```

### Exemplo 4: Recriar Apenas o Admin e Planos

```bash
# Útil se você modificou as configurações de planos
pnpm prisma:seed:admin
```

---

## 🔧 Troubleshooting

### Erro: "Unique constraint failed"

**Causa:** Tentativa de criar dados que já existem

**Solução:** Os seeds usam `upsert`, então esse erro não deveria acontecer. Se acontecer:
```bash
# Verifique se há migrations pendentes
pnpm prisma migrate dev

# Em último caso, reset completo
pnpm prisma:reset
```

### Erro: "Cannot find module"

**Causa:** Dependências não instaladas ou paths incorretos

**Solução:**
```bash
# Reinstalar dependências
pnpm install

# Regenerar Prisma Client
pnpm prisma generate
```

### Seeds não executam nada

**Causa:** Banco de dados já populado (upsert não altera dados existentes)

**Verificação:**
```bash
# Abrir Prisma Studio e verificar manualmente
pnpm prisma:studio

# Se quiser forçar recriação
pnpm prisma:reset
```

### Senha do admin não funciona

**Problema:** Tentando usar senha em MAIÚSCULA

**Solução:** A senha correta é `admin@123` (minúscula)

---

## 📝 Notas de Desenvolvimento

### Adicionando Novos Seeds

1. Criar arquivo em `prisma/seeds/nome-do-seed.seed.ts`
2. Exportar função principal: `export async function seedNome(prisma: PrismaClient)`
3. Adicionar export em `prisma/seeds/index.ts`
4. Adicionar chamada em `prisma/seed-all.ts`
5. Adicionar script em `package.json` (opcional)

### Boas Práticas

- ✅ Sempre use `upsert` ao invés de `create` para idempotência
- ✅ Use `where` com constraints únicas
- ✅ Documente o que cada seed faz
- ✅ Adicione logs informativos (`console.log`)
- ✅ Trate erros adequadamente
- ⚠️ Nunca commite senhas reais no código
- ⚠️ Sempre altere senhas padrão em produção

---

## 🔗 Referências

- [Prisma Seeding Documentation](https://www.prisma.io/docs/guides/database/seed-database)
- [Schema do Banco de Dados](./schema.prisma)
- [Guia de Desenvolvimento](../../docs/DESENVOLVIMENTO.md)

---

## 📞 Suporte

Se encontrar problemas com os seeds:

1. Verifique os logs de erro detalhados
2. Consulte a seção de [Troubleshooting](#troubleshooting)
3. Abra uma issue no repositório do projeto
4. Entre em contato com a equipe de desenvolvimento

---

**Última atualização:** 11/10/2025
