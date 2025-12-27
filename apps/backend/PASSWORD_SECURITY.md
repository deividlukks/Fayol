# Segurança de Senhas - Fayol Backend

Este documento detalha a implementação de requisitos fortes de senha no backend do Fayol.

## 📋 Índice

1. [Requisitos de Senha](#requisitos-de-senha)
2. [Implementação](#implementação)
3. [Endpoints](#endpoints)
4. [Validações](#validações)
5. [Exemplos de Uso](#exemplos-de-uso)

---

## 🔒 Requisitos de Senha

### Requisitos Mínimos

Todas as senhas devem atender aos seguintes critérios:

| Requisito | Descrição |
|-----------|-----------|
| **Comprimento Mínimo** | 8 caracteres |
| **Comprimento Máximo** | 128 caracteres |
| **Letra Maiúscula** | Pelo menos uma (A-Z) |
| **Letra Minúscula** | Pelo menos uma (a-z) |
| **Número** | Pelo menos um (0-9) |
| **Caractere Especial** | Pelo menos um (!@#$%^&*()_+-=[]{}|;:,.<>?) |

### Validações Adicionais

- ❌ **Senhas Comuns Bloqueadas**: Password123, Senha123, Admin123, etc.
- ❌ **Sequências Repetidas**: Não permite "aaa", "111", etc.
- ✅ **Diferente da Atual**: Nova senha deve ser diferente da atual

---

## 🛠️ Implementação

### Arquivos Criados

```
apps/backend/src/common/utils/
└── password-validator.ts        # Utilitário de validação de senha

apps/backend/src/modules/users/dto/
└── change-password.dto.ts       # DTO para mudança de senha
```

### Arquivos Modificados

```
apps/backend/src/modules/
├── auth/
│   ├── controllers/auth.controller.ts      # Endpoint de validação
│   └── services/auth.service.ts            # Validação em reset
├── users/
    ├── controllers/users.controller.ts     # Endpoint de mudança
    └── services/users.service.ts           # Validação em criação/mudança
```

---

## 🌐 Endpoints

### 1. POST /api/auth/validate-password

Valida a força da senha em tempo real (público).

**Request:**
```json
{
  "password": "MinhaSenh@123"
}
```

**Response:**
```json
{
  "isValid": true,
  "strength": 85,
  "errors": [],
  "suggestions": ["Sua senha está forte!"],
  "requirements": {
    "minLength": 8,
    "mustContain": [
      "Pelo menos uma letra maiúscula (A-Z)",
      "Pelo menos uma letra minúscula (a-z)",
      "Pelo menos um número (0-9)",
      "Pelo menos um caractere especial (!@#$%^&*...)"
    ]
  }
}
```

**Casos de Erro:**
```json
{
  "isValid": false,
  "strength": 45,
  "errors": [
    "A senha deve conter pelo menos uma letra maiúscula.",
    "A senha deve conter pelo menos um número."
  ],
  "suggestions": [
    "Adicione letras maiúsculas.",
    "Adicione números."
  ]
}
```

---

### 2. POST /api/auth/register

Criação de usuário com validação de senha.

**Request:**
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "MinhaSenh@Forte123",
  "phone": "(11) 99999-9999"
}
```

**Response (Sucesso):**
```json
{
  "id": "uuid-here",
  "name": "João Silva",
  "email": "joao@example.com",
  "createdAt": "2025-12-21T..."
}
```

**Response (Erro - Senha Fraca):**
```json
{
  "statusCode": 400,
  "message": "Senha não atende aos requisitos de segurança.",
  "errors": [
    "A senha deve ter pelo menos 8 caracteres.",
    "A senha deve conter pelo menos uma letra maiúscula."
  ],
  "requirements": {
    "minLength": 8,
    "mustContain": [
      "Pelo menos uma letra maiúscula (A-Z)",
      "Pelo menos uma letra minúscula (a-z)",
      "Pelo menos um número (0-9)",
      "Pelo menos um caractere especial (!@#$%^&*...)"
    ]
  }
}
```

---

### 3. POST /api/auth/reset-password

Reset de senha com validação.

**Request:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NovaSenha@Forte123"
}
```

**Response (Sucesso):**
```json
{
  "message": "Senha alterada com sucesso! Você já pode fazer login."
}
```

**Response (Erro - Senha Fraca):**
```json
{
  "statusCode": 400,
  "message": "Senha não atende aos requisitos de segurança.",
  "errors": [
    "A senha deve conter pelo menos um caractere especial (!@#$%^&*()_+-=[]{}|;:,.<>?)."
  ]
}
```

---

### 4. POST /api/users/change-password

Mudança de senha para usuário autenticado.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request:**
```json
{
  "currentPassword": "SenhaAtual@123",
  "newPassword": "NovaSenha@Forte456",
  "confirmPassword": "NovaSenha@Forte456"
}
```

**Response (Sucesso):**
```json
{
  "message": "Senha alterada com sucesso."
}
```

**Erros Possíveis:**
```json
// Senha atual incorreta
{
  "statusCode": 400,
  "message": "Senha atual incorreta."
}

// Senhas não coincidem
{
  "statusCode": 400,
  "message": "Nova senha e confirmação não coincidem."
}

// Senha igual à atual
{
  "statusCode": 400,
  "message": "A nova senha deve ser diferente da senha atual."
}

// Senha fraca
{
  "statusCode": 400,
  "message": "Senha não atende aos requisitos de segurança.",
  "errors": [...]
}
```

---

## ✅ Validações

### Funções Disponíveis

#### `validatePassword(password: string): PasswordValidationResult`

Valida se a senha atende aos requisitos.

```typescript
const result = validatePassword('MinhaSenh@123');
// {
//   isValid: true,
//   errors: []
// }
```

#### `validatePasswordOrFail(password: string): void`

Valida e lança exceção se inválida.

```typescript
try {
  validatePasswordOrFail('fraca');
} catch (error) {
  // BadRequestException com detalhes
}
```

#### `getPasswordStrength(password: string): number`

Retorna força da senha (0-100).

```typescript
const strength = getPasswordStrength('MinhaSenh@123');
// 85
```

#### `getPasswordSuggestions(password: string): string[]`

Retorna sugestões de melhoria.

```typescript
const suggestions = getPasswordSuggestions('senha123');
// ['Adicione letras maiúsculas.', 'Adicione caracteres especiais.']
```

---

## 🧪 Exemplos de Uso

### Frontend - Validação em Tempo Real

```typescript
async function validatePasswordRealTime(password: string) {
  const response = await fetch('/api/auth/validate-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });

  const result = await response.json();

  // Atualizar UI com resultado
  if (result.isValid) {
    showSuccess('Senha forte!');
  } else {
    showErrors(result.errors);
    showSuggestions(result.suggestions);
  }

  // Mostrar barra de força
  updateStrengthBar(result.strength); // 0-100
}
```

### Frontend - Registro

```typescript
async function register(userData) {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const error = await response.json();
      if (error.errors) {
        // Mostrar erros de validação de senha
        showPasswordErrors(error.errors);
      }
    }
  } catch (error) {
    console.error('Erro no registro:', error);
  }
}
```

### Frontend - Mudança de Senha

```typescript
async function changePassword(currentPassword, newPassword, confirmPassword) {
  const response = await fetch('/api/users/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      currentPassword,
      newPassword,
      confirmPassword
    })
  });

  if (!response.ok) {
    const error = await response.json();
    handleError(error.message);
  } else {
    showSuccess('Senha alterada com sucesso!');
  }
}
```

---

## 🔐 Boas Práticas Implementadas

### 1. Validação Centralizada
- ✅ Uma única função de validação reutilizada em todo o backend
- ✅ Consistência nos requisitos em todos os endpoints

### 2. Feedback Claro
- ✅ Mensagens específicas sobre o que está errado
- ✅ Sugestões de como melhorar a senha
- ✅ Indicador de força (0-100)

### 3. Segurança em Camadas
- ✅ Validação no backend (nunca confie no frontend)
- ✅ Endpoint público para validação em tempo real
- ✅ Bloqueio de senhas comuns

### 4. Experiência do Usuário
- ✅ Validação em tempo real sem submeter formulário
- ✅ Mensagens claras e acionáveis
- ✅ Indicador visual de força

---

## 📊 Métricas de Força da Senha

A função `getPasswordStrength()` calcula a força baseada em:

| Critério | Pontos |
|----------|--------|
| Comprimento | até 40 pontos (2 por caractere) |
| Letras minúsculas | 10 pontos |
| Letras maiúsculas | 10 pontos |
| Números | 10 pontos |
| Caracteres especiais | 15 pontos |
| Diversidade de caracteres | até 15 pontos |

**Total:** 0-100 pontos

**Classificação:**
- 0-40: Fraca ❌
- 41-70: Moderada ⚠️
- 71-100: Forte ✅

---

## 🚫 Senhas Bloqueadas

Lista de senhas comuns bloqueadas:

- password
- Password1
- Password123
- 12345678
- qwerty123
- abc123456
- password1
- Senha123
- Admin123
- Welcome1

**Nota:** A validação é case-insensitive para detectar variações.

---

## 🔄 Migração de Usuários Antigos

Se houver usuários com senhas fracas no sistema:

1. **Opção 1 - Force Reset:**
   - Marcar senhas antigas como expiradas
   - Forçar reset no próximo login

2. **Opção 2 - Gradual:**
   - Permitir login com senha fraca
   - Exibir aviso para atualizar
   - Forçar após período de graça

3. **Opção 3 - Email Proativo:**
   - Enviar email pedindo atualização
   - Fornecer link de reset

---

## 🧪 Testes

### Teste Manual via Swagger

1. Acesse: `http://localhost:3333/api/docs`
2. Encontre `/auth/validate-password`
3. Teste com diferentes senhas:

```
fraca          → Fraca
Senha123       → Média
MinhaSenh@123  → Forte
```

### Teste via cURL

```bash
# Senha fraca
curl -X POST http://localhost:3333/api/auth/validate-password \
  -H "Content-Type: application/json" \
  -d '{"password":"fraca"}'

# Senha forte
curl -X POST http://localhost:3333/api/auth/validate-password \
  -H "Content-Type: application/json" \
  -d '{"password":"MinhaSenh@Forte123"}'
```

---

## 📝 Checklist de Implementação

- [x] Criar utilitário de validação de senha
- [x] Adicionar validação em criação de usuário
- [x] Adicionar validação em reset de senha
- [x] Criar endpoint de mudança de senha
- [x] Criar endpoint de validação pública
- [x] Implementar cálculo de força
- [x] Implementar sugestões
- [x] Bloquear senhas comuns
- [x] Documentar API
- [x] Testar todos os endpoints

---

## 🔗 Links Relacionados

- [OWASP Password Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [Password Strength Calculator](https://www.passwordmonster.com/)

---

**Última atualização:** 2025-12-21
**Versão:** 1.0.0
**Autor:** Claude Code Assistant
