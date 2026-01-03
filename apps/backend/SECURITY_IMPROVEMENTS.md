# Melhorias de Segurança e Funcionalidades - Backend Fayol

Este documento resume todas as melhorias de segurança e novas funcionalidades implementadas no backend do Fayol.

## 📋 Índice

1. [Correções de Segurança](#correções-de-segurança)
2. [Rate Limiting](#rate-limiting)
3. [Sistema de Email com Filas](#sistema-de-email-com-filas)
4. [Templates de Email](#templates-de-email)
5. [Monitoramento com Sentry](#monitoramento-com-sentry)
6. [Próximos Passos](#próximos-passos)

---

## 🔒 Correções de Segurança

### 1. JWT Secret com Fallback Inseguro ✅

**Localização:** `apps/backend/src/modules/auth/strategies/jwt.strategy.ts:13-17`

**Problema Corrigido:**
- ❌ Antes: Usava `'fallback-secret'` hardcoded se `JWT_SECRET` não estivesse configurada
- ✅ Agora: Lança erro se `JWT_SECRET` não existir, impedindo inicialização insegura

**Impacto:**
- Elimina vulnerabilidade crítica de autenticação
- Aplicação não inicia sem configuração adequada
- Previne uso de secret previsível por atacantes

---

### 2. Exposição de Token de Reset de Senha ✅

**Localização:** `apps/backend/src/modules/auth/services/auth.service.ts:183-196`

**Problema Corrigido:**
- ❌ Antes: Token retornado como `devToken` na resposta HTTP
- ✅ Agora: Token enviado apenas por email via fila assíncrona

**Impacto:**
- Previne interceptação de tokens
- Elimina ataques de email enumeration
- Tokens permanecem apenas no servidor

---

### 3. PgAdmin com Credenciais Padrão ✅

**Localização:** `docker-compose.yml:177-181`

**Problema Corrigido:**
- ❌ Antes: Credenciais hardcoded `admin@fayol.app / admin` expostas na porta 5050
- ✅ Agora:
  - Credenciais via variáveis de ambiente obrigatórias
  - Profile `dev` - só inicia com `docker-compose --profile dev up`
  - Comentários de segurança alertando sobre uso apenas em desenvolvimento

**Impacto:**
- Previne acesso não autorizado ao banco de dados
- Não inicia em produção por padrão
- Força uso de credenciais fortes via variáveis de ambiente

**Configuração:**
```env
# .env
PGADMIN_EMAIL=admin@localhost
PGADMIN_PASSWORD=SuaSenhaForte123!
PGADMIN_PORT=5050
```

---

### 4. Requisitos de Senha Fracos ✅

**Localização:** `apps/backend/src/modules/auth/services/auth.service.ts:220`

**Problema Corrigido:**
- ❌ Antes: Senha aceita com apenas 6 caracteres sem requisitos adicionais
- ✅ Agora: Requisitos fortes de senha implementados

**Novos Requisitos:**
- ✅ Mínimo de 8 caracteres
- ✅ Pelo menos uma letra maiúscula (A-Z)
- ✅ Pelo menos uma letra minúscula (a-z)
- ✅ Pelo menos um número (0-9)
- ✅ Pelo menos um caractere especial (!@#$%^&*...)
- ✅ Bloqueio de senhas comuns (Password123, Senha123, etc.)
- ✅ Bloqueio de sequências repetidas (aaa, 111, etc.)

**Impacto:**
- Dificulta ataques de força bruta significativamente
- Aumenta segurança das contas de usuário
- Previne uso de senhas fracas conhecidas

**Endpoints Afetados:**
- `POST /api/auth/register` - Criação de usuário
- `POST /api/auth/reset-password` - Reset de senha
- `POST /api/users/change-password` - Mudança de senha (novo)

**Novos Endpoints:**
- `POST /api/auth/validate-password` - Validação em tempo real para frontend

**Documentação Completa:** [PASSWORD_SECURITY.md](./PASSWORD_SECURITY.md)

---

## ⏱️ Rate Limiting

### Configuração Global

**Localização:** `apps/backend/src/app.module.ts:41-52`

Configurados dois limitadores:

```typescript
{
  name: 'default',
  ttl: 60000,    // 1 minuto
  limit: 10,     // 10 requisições por IP
}
{
  name: 'forgot-password',
  ttl: 900000,   // 15 minutos
  limit: 3,      // 3 tentativas
}
```

### Endpoints Protegidos

| Endpoint | Limite | Período | Arquivo |
|----------|--------|---------|---------|
| `/auth/login` | 5 tentativas | 1 minuto | `auth.controller.ts:44` |
| `/auth/register` | 3 criações | 1 hora | `auth.controller.ts:55` |
| `/auth/forgot-password` | 3 tentativas | 15 minutos | `auth.controller.ts:64` |
| `/auth/reset-password` | 5 tentativas | 1 minuto | `auth.controller.ts:74` |

### Benefícios

- ✅ Proteção contra ataques de força bruta
- ✅ Prevenção de spam de emails
- ✅ Limitação de criação de contas (anti-bot)
- ✅ Proteção contra enumeration attacks

---

## 📧 Sistema de Email com Filas

### Arquitetura

```
AuthService → QueueService → BullMQ → EmailQueueProcessor → EmailService
```

### Componentes Criados

1. **Email Module** (`src/modules/email/`)
   - `email.service.ts` - Serviço de envio de emails
   - `email.module.ts` - Módulo NestJS
   - `README.md` - Documentação completa

2. **Queue Email Processor** (`src/modules/queue/processors/`)
   - `email-queue.processor.ts` - Processador de fila de emails

3. **Configurações**
   - Fila `EMAIL` adicionada ao `queue.constants.ts`
   - Registrada em `queue.module.ts`
   - Métodos em `queue.service.ts`

### Funcionalidades

#### Envio Assíncrono
- Emails processados em background
- Não bloqueia requisições HTTP
- Retry automático em caso de falha

#### Provedores Suportados
- SMTP genérico (SendGrid, AWS SES, Mailgun, etc.)
- Gmail (com App Password)
- Ethereal (desenvolvimento - automático)

#### Configurações de Fila
```typescript
{
  concurrency: 5,        // 5 emails simultâneos
  attempts: 3,           // 3 tentativas
  backoff: 'exponential', // Delay crescente
  limiter: {
    max: 10,            // 10 jobs
    duration: 1000      // por segundo
  }
}
```

---

## ✉️ Templates de Email

### 1. Password Reset (Recuperação de Senha)

**Método:** `sendPasswordResetEmail(email, resetToken)`

**Características:**
- Link com token único
- Expiração: 1 hora
- Instruções claras
- Versão texto alternativa

**Preview:**
- Header azul com logo Fayol
- Botão de ação destacado
- Link alternativo no footer
- Responsivo para mobile

---

### 2. Welcome (Boas-vindas)

**Método:** `sendWelcomeEmail(email, userName)`

**Características:**
- Saudação personalizada
- Lista de funcionalidades
- Call-to-action para acessar app
- Design acolhedor

**Conteúdo:**
- Introdução ao Fayol
- 5 principais funcionalidades
- Link para acessar
- Mensagem de suporte

---

### 3. Verification (Verificação de Email)

**Método:** `sendVerificationEmail(email, verificationToken)`

**Características:**
- Link de confirmação
- Expiração: 24 horas
- Botão verde de verificação
- Instruções claras

**Segurança:**
- Token único por usuário
- Expira automaticamente
- Link de uso único

---

## 📊 Monitoramento com Sentry

### Email Service

**Localização:** `src/modules/email/email.service.ts`

Todos os métodos de envio capturam erros:

```typescript
Sentry.captureException(error, {
  tags: {
    email_type: 'password-reset',
    email_recipient: email,
  },
  extra: {
    error_message: error.message,
  },
});
```

**Benefícios:**
- Rastreamento de falhas de email
- Identificação de problemas de provedor
- Métricas de taxa de sucesso/falha
- Debug facilitado

---

### Email Queue Processor

**Localização:** `src/modules/queue/processors/email-queue.processor.ts`

Captura erros em dois momentos:

1. **Durante processamento:**
```typescript
Sentry.captureException(error, {
  tags: {
    queue: 'email',
    job_id: job.id,
  },
  extra: {
    attempt: job.attemptsMade,
  },
});
```

2. **Falha final (após todas tentativas):**
```typescript
if (job.attemptsMade >= job.opts.attempts) {
  Sentry.captureException(error, {
    tags: { final_failure: 'true' },
    level: 'error',
  });
}
```

**Informações Capturadas:**
- Tipo de email
- Destinatário (para debug)
- ID do job
- Número de tentativas
- Dados do job
- Stack trace completo

---

## 🚀 Próximos Passos

### Curto Prazo

1. **SPF/DKIM Configuration**
   - Configurar DNS para produção
   - Melhorar deliverability
   - Evitar spam filters

2. **Email Analytics**
   - Taxa de abertura
   - Taxa de clique
   - Bounces e complaints
   - Dashboard de métricas

3. **A/B Testing**
   - Testar diferentes templates
   - Otimizar CTAs
   - Melhorar conversão

### Médio Prazo

4. **Email Preferences**
   - Centro de preferências
   - Opt-out seletivo
   - Frequência de envios
   - Categorias de email

5. **Internationalization**
   - Templates multi-idioma
   - Detecção de locale
   - Traduções automáticas

6. **Advanced Templates**
   - Template engine (Handlebars)
   - Componentes reutilizáveis
   - Tema customizável
   - Preview antes de enviar

### Longo Prazo

7. **Email Campaign System**
   - Envios em massa
   - Segmentação de usuários
   - Scheduling
   - Relatórios detalhados

8. **Machine Learning**
   - Otimização de tempo de envio
   - Personalização de conteúdo
   - Predição de engajamento
   - Churn prevention

---

## 📦 Arquivos Criados/Modificados

### Criados

```
apps/backend/src/modules/email/
├── email.service.ts
├── email.module.ts
└── README.md

apps/backend/src/modules/queue/processors/
└── email-queue.processor.ts

apps/backend/src/modules/auth/guards/
└── forgot-password-throttle.guard.ts

apps/backend/src/common/utils/
└── password-validator.ts                # Validação de senha forte

apps/backend/src/modules/users/dto/
└── change-password.dto.ts               # DTO para mudança de senha

apps/backend/
├── SECURITY_IMPROVEMENTS.md (este arquivo)
└── PASSWORD_SECURITY.md                 # Documentação de senhas
```

### Modificados

```
apps/backend/
├── docker-compose.yml                          # PgAdmin com variáveis de ambiente e profile dev
├── .env.example                                # Email e PgAdmin configs
└── src/
    ├── app.module.ts                           # Throttler config
    └── modules/
        ├── auth/
        │   ├── auth.module.ts                  # EmailModule, QueueModule
        │   ├── controllers/auth.controller.ts  # Rate limiting, validação de senha
        │   ├── services/auth.service.ts        # Queue integration, validação
        │   └── strategies/jwt.strategy.ts      # JWT secret validation
        ├── users/
        │   ├── controllers/users.controller.ts # Endpoint de mudança de senha
        │   └── services/users.service.ts       # Validação, changePassword()
        └── queue/
            ├── queue.constants.ts              # EMAIL queue
            ├── queue.module.ts                 # EmailModule, processor
            └── queue.service.ts                # addEmailJob()
```

---

## 🧪 Como Testar

### 1. Email em Desenvolvimento

```bash
# Não configure EMAIL_PROVIDER
NODE_ENV=development pnpm dev

# Os emails usarão Ethereal automaticamente
# URLs de preview aparecerão no console
```

### 2. Email com Gmail

```env
EMAIL_PROVIDER=gmail
GMAIL_USER=seu-email@gmail.com
GMAIL_APP_PASSWORD=sua-senha-app
```

### 3. Rate Limiting

```bash
# Tente fazer 4 requests de forgot-password em 15 minutos
# A 4ª será bloqueada com erro 429
curl -X POST http://localhost:3333/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### 4. Monitoramento Sentry

```bash
# Configure SENTRY_DSN no .env
# Cause um erro proposital (ex: email inválido no provedor)
# Verifique o erro no dashboard do Sentry
```

### 5. Validação de Senha

```bash
# Testar senha fraca
curl -X POST http://localhost:3333/api/auth/validate-password \
  -H "Content-Type: application/json" \
  -d '{"password":"fraca"}'

# Resultado esperado: isValid: false, errors: [...]

# Testar senha forte
curl -X POST http://localhost:3333/api/auth/validate-password \
  -H "Content-Type: application/json" \
  -d '{"password":"MinhaSenh@Forte123"}'

# Resultado esperado: isValid: true, strength: 85+
```

### 6. Mudança de Senha

```bash
# Obter token JWT primeiro (login)
TOKEN="seu-jwt-token-aqui"

# Tentar mudar senha
curl -X POST http://localhost:3333/api/users/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "currentPassword": "SenhaAtual123!",
    "newPassword": "NovaSenha@Forte456",
    "confirmPassword": "NovaSenha@Forte456"
  }'

# Resultado esperado: { "message": "Senha alterada com sucesso." }
```

### 7. PgAdmin (Desenvolvimento)

```bash
# Iniciar apenas serviços de desenvolvimento
docker-compose --profile dev up

# PgAdmin estará disponível em http://localhost:5050
# Use as credenciais definidas no .env
```

---

## 📚 Documentação Adicional

**Documentação Interna:**
- **Email Module:** `apps/backend/src/modules/email/README.md`
- **Password Security:** `apps/backend/PASSWORD_SECURITY.md`
- **Queue System:** Ver comentários em `queue.service.ts`

**Documentação Externa:**
- **Rate Limiting:** [NestJS Throttler Docs](https://docs.nestjs.com/security/rate-limiting)
- **BullMQ:** [BullMQ Documentation](https://docs.bullmq.io/)
- **Sentry:** [Sentry Node.js Docs](https://docs.sentry.io/platforms/node/)
- **OWASP Password Guidelines:** [Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- **NIST Password Guidelines:** [Digital Identity Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)

---

## ✅ Checklist de Implementação

**Segurança:**
- [x] Corrigir JWT Secret fallback
- [x] Remover exposição de token de reset
- [x] Corrigir credenciais padrão do PgAdmin
- [x] Implementar requisitos fortes de senha
- [x] Criar validador de senha centralizado
- [x] Adicionar endpoint de mudança de senha

**Rate Limiting:**
- [x] Implementar rate limiting global
- [x] Adicionar rate limiting específico para forgot-password
- [x] Adicionar rate limiting para login
- [x] Adicionar rate limiting para registro

**Sistema de Email:**
- [x] Criar Email Service
- [x] Configurar Email Module
- [x] Implementar fila de emails com BullMQ
- [x] Criar Email Queue Processor
- [x] Template de password reset
- [x] Template de welcome
- [x] Template de verification

**Monitoramento:**
- [x] Integrar Sentry no Email Service
- [x] Integrar Sentry no Queue Processor

**Documentação:**
- [x] Documentar melhorias de segurança
- [x] Documentar sistema de senhas
- [x] Atualizar .env.example
- [x] Criar guia de uso de senhas

---

## 👥 Contribuindo

Para adicionar novos tipos de email:

1. Adicionar método em `EmailService`
2. Criar template HTML
3. Atualizar `EmailJobData` interface
4. Adicionar case no `EmailQueueProcessor`
5. Documentar no README do Email Module

---

## 📝 Notas

- Todos os emails têm versão texto alternativa
- Templates são responsivos
- Logs detalhados em desenvolvimento
- Retry automático em falhas temporárias
- Monitoramento completo com Sentry

---

**Última atualização:** 2025-12-21
**Versão:** 1.0.0
**Autor:** Claude Code Assistant
