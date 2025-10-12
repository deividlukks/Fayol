# ✅ Checklist Pré-Deploy - Fayol

> Checklist completo para garantir que tudo está pronto antes de colocar em produção

---

## 🔐 Segurança

### Credenciais e Secrets
- [ ] JWT_SECRET gerado com no mínimo 64 caracteres aleatórios
- [ ] JWT_REFRESH_SECRET diferente do JWT_SECRET
- [ ] Senhas de banco de dados fortes (16+ caracteres)
- [ ] REDIS_PASSWORD configurado
- [ ] SESSION_SECRET configurado
- [ ] Todas as senhas padrão alteradas
- [ ] Arquivo `.env` NÃO está no Git
- [ ] `.gitignore` inclui `.env*` e arquivos sensíveis

### Configurações de Segurança
- [ ] CORS_ORIGIN configurado apenas com domínios permitidos
- [ ] Rate limiting ativado (RATE_LIMIT_MAX configurado)
- [ ] Helmet configurado no backend
- [ ] HTTPS forçado em todos os domínios
- [ ] SSL/TLS certificados instalados e válidos
- [ ] HTTP Strict Transport Security (HSTS) ativado
- [ ] Content Security Policy (CSP) configurado

### Validações
- [ ] Validação de input em todos os endpoints
- [ ] Sanitização de dados do usuário
- [ ] SQL Injection: usando Prisma corretamente (sem raw queries não sanitizadas)
- [ ] XSS Protection ativa
- [ ] CSRF tokens onde necessário

---

## 🗄️ Banco de Dados

### Configuração
- [ ] PostgreSQL instalado e rodando
- [ ] Banco de produção criado
- [ ] Usuário do banco com privilégios corretos (não root)
- [ ] DATABASE_URL configurada corretamente
- [ ] Connection pool configurado (max/min connections)
- [ ] Timezone do banco configurado (America/Sao_Paulo)

### Migrations e Schema
- [ ] Todas as migrations aplicadas (`prisma migrate deploy`)
- [ ] Seed executado com dados iniciais
- [ ] Verificado que o schema está atualizado
- [ ] Backup antes de qualquer migration em produção
- [ ] Índices criados para queries frequentes

### Performance
- [ ] Índices criados em colunas de busca frequente
- [ ] VACUUM e ANALYZE executados
- [ ] Query logging configurado (temporariamente para debug)
- [ ] Slow query log analisado

---

## 🔴 Backend (NestJS)

### Configuração
- [ ] NODE_ENV=production
- [ ] PORT configurado (padrão: 3000)
- [ ] Log level apropriado (info ou warn, não debug)
- [ ] ENABLE_SWAGGER=false em produção
- [ ] Variáveis de ambiente todas configuradas
- [ ] PM2 ou similar configurado para process management

### Build e Deploy
- [ ] Build de produção executado sem erros
- [ ] Dependências de produção instaladas (`pnpm install --prod`)
- [ ] node_modules de desenvolvimento removidos
- [ ] TypeScript compilado corretamente
- [ ] Source maps desabilitados (ou apenas para debug interno)

### Testes
- [ ] Testes unitários passando
- [ ] Testes de integração passando
- [ ] Health check endpoint funcionando (`/api/v1/health`)
- [ ] Verificado que não há console.log em produção

### Serviços Externos
- [ ] Redis conectando corretamente
- [ ] Redis password configurado
- [ ] Conexão com serviço de IA funcionando
- [ ] SMTP configurado para emails
- [ ] Telegram Bot token configurado (se aplicável)
- [ ] WhatsApp Bot configurado (se aplicável)

---

## 🌐 Frontend (Admin Panel)

### Build
- [ ] Build de produção executado
- [ ] Sem erros de TypeScript
- [ ] Sem warnings críticos
- [ ] Bundle size otimizado (< 500KB gzipped)
- [ ] Images otimizadas

### Configuração
- [ ] NEXT_PUBLIC_API_URL apontando para produção
- [ ] Variáveis de ambiente de produção configuradas
- [ ] Analytics configurado (Google Analytics, Mixpanel, etc.)
- [ ] Error tracking configurado (Sentry, etc.)

### Performance
- [ ] Lazy loading configurado
- [ ] Code splitting ativo
- [ ] Assets em CDN (se aplicável)
- [ ] Service Worker configurado (PWA)
- [ ] Compression ativa (gzip/brotli)

### SEO & Meta
- [ ] Meta tags configuradas
- [ ] Open Graph tags
- [ ] Favicon configurado
- [ ] robots.txt configurado
- [ ] sitemap.xml gerado

---

## 🚀 Deploy & Infraestrutura

### Servidor
- [ ] Servidor com recursos suficientes (CPU, RAM, Disco)
- [ ] Node.js versão correta instalada (v18+)
- [ ] Python instalado para serviço de IA (v3.9+)
- [ ] PM2 instalado e configurado
- [ ] Auto-start configurado (pm2 startup)
- [ ] Firewall configurado (portas necessárias abertas)

### Domínios e DNS
- [ ] Domínio principal configurado
- [ ] Subdomínios criados (api, admin, ai)
- [ ] DNS propagado (verificar com `nslookup`)
- [ ] SSL configurado para todos os domínios
- [ ] Redirecionamento HTTP → HTTPS funcionando

### Proxy Reverso
- [ ] Nginx ou Apache configurado
- [ ] .htaccess com proxy para Node.js
- [ ] Headers de segurança configurados
- [ ] Compression ativa
- [ ] Rate limiting no proxy

### Backup
- [ ] Script de backup configurado
- [ ] Backup automático agendado (cron)
- [ ] Testado restore de backup
- [ ] Backup em local separado do servidor
- [ ] Retenção de backups configurada (manter últimos 7 dias)

---

## 📊 Monitoramento e Logs

### Logs
- [ ] Logs do backend sendo gravados
- [ ] Logs rotacionados (logrotate ou pm2-logrotate)
- [ ] Logs de erro separados
- [ ] Logs acessíveis via SSH
- [ ] Formato de log padronizado (JSON)

### Monitoramento
- [ ] PM2 monitoring ativo
- [ ] Health check configurado
- [ ] Uptime monitoring (UptimeRobot, Pingdom, etc.)
- [ ] Error tracking (Sentry, Bugsnag, etc.)
- [ ] Performance monitoring (New Relic, DataDog, etc.)
- [ ] Alertas configurados (email, Telegram, Slack)

### Métricas
- [ ] CPU usage monitorado
- [ ] RAM usage monitorado
- [ ] Disk space monitorado
- [ ] Network traffic monitorado
- [ ] Database connections monitoradas
- [ ] API response times monitoradas

---

## 🧪 Testes de Produção

### Testes Funcionais
- [ ] Registro de usuário funcionando
- [ ] Login funcionando
- [ ] Recuperação de senha funcionando
- [ ] CRUD de contas funcionando
- [ ] CRUD de transações funcionando
- [ ] CRUD de categorias funcionando
- [ ] Dashboard carregando dados
- [ ] Relatórios gerando corretamente
- [ ] Bot Telegram respondendo

### Testes de Performance
- [ ] Tempo de resposta da API < 500ms
- [ ] Página inicial carrega < 3s
- [ ] Suporta 100 requisições simultâneas
- [ ] Sem memory leaks
- [ ] CPU usage normal (< 70%)
- [ ] Database queries otimizadas

### Testes de Segurança
- [ ] Tentativa de SQL Injection bloqueada
- [ ] XSS bloqueado
- [ ] CSRF tokens validando
- [ ] Rate limiting funcionando
- [ ] JWT inválido rejeitado
- [ ] Permissões de usuário funcionando
- [ ] Upload de arquivos validado

---

## 📱 Integrações

### Telegram Bot
- [ ] Token configurado
- [ ] Webhook configurado
- [ ] Bot respondendo comandos
- [ ] Bot conectando com backend
- [ ] Mensagens sendo recebidas e enviadas

### WhatsApp Bot (se aplicável)
- [ ] Provider configurado (Baileys ou Twilio)
- [ ] Sessão persistindo
- [ ] QR Code gerando (Baileys)
- [ ] Mensagens funcionando

### Email
- [ ] SMTP configurado
- [ ] Emails de boas-vindas enviando
- [ ] Emails de recuperação de senha enviando
- [ ] Templates de email funcionando
- [ ] SPF/DKIM configurados (evitar spam)

### Serviço de IA
- [ ] Serviço rodando (porta 8000)
- [ ] Endpoint de sugestão de categoria funcionando
- [ ] Análise de gastos funcionando
- [ ] Detecção de anomalias funcionando

---

## 📄 Documentação

### Para Equipe
- [ ] README atualizado
- [ ] Documentação de API atualizada (Swagger)
- [ ] Guia de desenvolvimento atualizado
- [ ] Changelog atualizado
- [ ] Variáveis de ambiente documentadas

### Para Usuários
- [ ] Documentação de usuário criada
- [ ] FAQ criado
- [ ] Tutoriais em vídeo (opcional)
- [ ] Suporte configurado (email, chat, etc.)

---

## 🔄 Processo de Deploy

### Pre-Deploy
- [ ] Branch de produção criada
- [ ] Code review realizado
- [ ] Testes passando em staging
- [ ] Changelog atualizado com nova versão
- [ ] Comunicado à equipe sobre deploy

### Deploy
- [ ] Backup do banco antes do deploy
- [ ] Backup dos arquivos antes do deploy
- [ ] Deploy em janela de manutenção (se possível)
- [ ] Migrations aplicadas
- [ ] Aplicação reiniciada

### Post-Deploy
- [ ] Health check passou
- [ ] Logs verificados (sem erros)
- [ ] Testes funcionais passando
- [ ] Monitoramento verificado
- [ ] Comunicado à equipe sucesso do deploy
- [ ] Tag criada no Git (vX.X.X)

### Rollback (Plano B)
- [ ] Script de rollback preparado
- [ ] Backup facilmente restaurável
- [ ] Processo de rollback documentado
- [ ] Equipe sabe como fazer rollback

---

## ✉️ Comunicação

### Interna
- [ ] Equipe informada sobre deploy
- [ ] Janela de manutenção comunicada
- [ ] Contatos de emergência atualizados
- [ ] Runbook atualizado

### Externa (Usuários)
- [ ] Status page configurado (opcional)
- [ ] Aviso de manutenção (se necessário)
- [ ] Email de novidades (changelog)
- [ ] Redes sociais atualizadas (opcional)

---

## 🎯 Checklist Final

Antes de colocar em produção, responda SIM para todas:

- [ ] Testei todo o fluxo principal da aplicação?
- [ ] Todos os endpoints críticos estão funcionando?
- [ ] Todas as senhas padrão foram alteradas?
- [ ] O SSL está funcionando em todos os domínios?
- [ ] O backup automático está configurado?
- [ ] O monitoramento está ativo?
- [ ] Tenho um plano de rollback?
- [ ] A equipe está ciente do deploy?
- [ ] Documentação está atualizada?
- [ ] Sei quem contatar em caso de problemas?

---

## 🚨 Checklist de Emergência

Se algo der errado, siga esta ordem:

1. [ ] Verificar logs imediatamente
2. [ ] Executar health check
3. [ ] Verificar status PM2
4. [ ] Verificar conexão com banco
5. [ ] Verificar espaço em disco
6. [ ] Se necessário, fazer rollback
7. [ ] Comunicar equipe sobre o problema
8. [ ] Documentar o incidente
9. [ ] Criar post-mortem após resolução

---

## 📞 Contatos de Emergência

```
Suporte Hospedagem: __________________
DBA: __________________
DevOps: __________________
Tech Lead: __________________
```

---

**Este checklist deve ser seguido TODA vez antes de um deploy em produção!**

**Última atualização**: 2025-10-12
**Versão**: 1.0.0
