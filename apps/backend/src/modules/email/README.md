# Email Module

Módulo responsável pelo envio de emails na aplicação Fayol.

## Recursos

- Suporte a múltiplos provedores (SMTP, Gmail)
- Templates HTML responsivos
- Modo de desenvolvimento com Ethereal Email
- Configuração flexível via variáveis de ambiente
- Logs detalhados para debugging

## Configuração

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Provedor de email: 'smtp' | 'gmail' | 'none'
EMAIL_PROVIDER=smtp

# Email remetente padrão
EMAIL_FROM="Fayol <noreply@fayol.app>"

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# URL do frontend (para links em emails)
FRONTEND_URL=http://localhost:3000
```

### 2. Configuração de Provedores

#### Gmail

Para usar o Gmail:

1. Acesse [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Crie uma senha de app
3. Configure as variáveis:

```env
EMAIL_PROVIDER=gmail
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
```

#### SMTP Genérico (SendGrid, AWS SES, Mailgun, etc.)

Para usar qualquer provedor SMTP:

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.your-sendgrid-api-key
```

**Exemplos de hosts SMTP:**
- SendGrid: `smtp.sendgrid.net`
- AWS SES: `email-smtp.us-east-1.amazonaws.com`
- Mailgun: `smtp.mailgun.org`
- Outlook: `smtp-mail.outlook.com`

#### Modo de Desenvolvimento

Se nenhum provedor for configurado e `NODE_ENV=development`, o serviço usará automaticamente o [Ethereal Email](https://ethereal.email/) para testes:

- Emails não são enviados de verdade
- URLs de preview são exibidas no console
- Perfeito para desenvolvimento local

## Uso

### Injetar o Serviço

```typescript
import { EmailService } from '../email/email.service';

@Injectable()
export class YourService {
  constructor(private emailService: EmailService) {}

  async someMethod() {
    await this.emailService.sendPasswordResetEmail(
      'user@example.com',
      'reset-token-here'
    );
  }
}
```

### Verificar Conexão

```typescript
const isConnected = await this.emailService.verifyConnection();
if (!isConnected) {
  console.error('Email service not properly configured');
}
```

## Métodos Disponíveis

### `sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean>`

Envia email de recuperação de senha com template HTML responsivo.

**Parâmetros:**
- `email`: Email do destinatário
- `resetToken`: Token de reset gerado

**Retorno:**
- `true`: Email enviado com sucesso
- `false`: Falha no envio

**Exemplo:**
```typescript
const success = await this.emailService.sendPasswordResetEmail(
  'user@example.com',
  'abc123def456'
);

if (success) {
  console.log('Email enviado!');
}
```

### `verifyConnection(): Promise<boolean>`

Verifica se a conexão com o servidor de email está funcionando.

**Retorno:**
- `true`: Conexão OK
- `false`: Falha na conexão

## Templates

Os emails usam templates HTML responsivos com:
- Design moderno e profissional
- Compatibilidade com clientes de email
- Versão texto alternativa
- Links funcionais

### Customizar Templates

Para customizar templates, edite o método `getPasswordResetTemplate()` em `email.service.ts`.

## Segurança

### Boas Práticas Implementadas

1. **Tokens não expostos**: Tokens nunca retornam em respostas HTTP
2. **Erro genérico**: Não revela se email existe (anti-enumeration)
3. **Try-catch**: Falhas de envio não quebram o fluxo
4. **Variáveis de ambiente**: Credenciais nunca no código
5. **App passwords**: Usa senhas de app em vez de senha real

### Proteções Contra Ataques

- **Email Enumeration**: Mensagem genérica independente do resultado
- **Token Exposure**: Token enviado apenas por email
- **Rate Limiting**: Implementar no controller (recomendado)
- **Email Spoofing**: Configuração adequada de SPF/DKIM (infraestrutura)

## Troubleshooting

### Email não está sendo enviado

1. Verifique as variáveis de ambiente
2. Teste a conexão:
   ```typescript
   await this.emailService.verifyConnection();
   ```
3. Verifique os logs do console
4. Em produção, verifique se o firewall permite porta 587

### Gmail retornando erro

- Certifique-se de usar senha de app, não a senha da conta
- Habilite acesso a apps menos seguros (se necessário)
- Verifique se 2FA está ativado (necessário para senha de app)

### Preview URL não aparece

Preview URLs só aparecem quando:
- `NODE_ENV=development`
- Email enviado via Ethereal (nenhum provedor configurado)

## Produção

### Checklist para Produção

- [ ] Configurar provedor de email confiável (SendGrid, AWS SES, etc.)
- [ ] Definir `EMAIL_PROVIDER` correto
- [ ] Configurar `EMAIL_FROM` com domínio válido
- [ ] Definir `FRONTEND_URL` com URL de produção
- [ ] Configurar SPF/DKIM no DNS do domínio
- [ ] Testar envio em ambiente de staging
- [ ] Monitorar logs de envio
- [ ] Implementar rate limiting no endpoint

### Provedores Recomendados

**Para projetos pequenos/médios:**
- SendGrid (12k emails grátis/mês)
- Mailgun (5k emails grátis/mês)

**Para projetos grandes:**
- AWS SES (muito barato, alta escala)
- Postmark (foco em transacionais)

**Para desenvolvimento:**
- Ethereal Email (incluído, automático)

## Extensões Futuras

Funcionalidades que podem ser adicionadas:

- [ ] Email de boas-vindas
- [ ] Email de confirmação de conta
- [ ] Notificações de transações
- [ ] Relatórios mensais
- [ ] Sistema de filas para envio em massa
- [ ] Suporte a anexos
- [ ] Templates dinâmicos com template engine
- [ ] Tracking de abertura/cliques
- [ ] Retry automático em falhas

## Suporte

Para reportar problemas ou sugerir melhorias, abra uma issue no repositório do projeto.
