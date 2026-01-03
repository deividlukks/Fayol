import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { APP_CONFIG } from '@fayol/shared-constants';

/**
 * Configuração Completa do Swagger/OpenAPI
 *
 * Features:
 * - Documentação completa de todos os endpoints
 * - Schemas de request/response
 * - Exemplos de uso
 * - Autenticação JWT
 * - Versionamento de API
 * - Tags organizadas por domínio
 * - Múltiplos servidores (dev, staging, prod)
 */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle(APP_CONFIG.NAME)
    .setDescription(getApiDescription())
    .setVersion('0.3.0')
    .setContact('Fayol Team', 'https://fayol.app', 'contato@fayol.app')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .setTermsOfService('https://fayol.app/terms')
    .setExternalDoc('Documentação Completa', 'https://docs.fayol.app')

    // Configuração de Autenticação
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Token JWT obtido no endpoint /api/auth/login',
        in: 'header',
      },
      'JWT-auth'
    )

    // Servidores
    .addServer('http://localhost:3333', 'Desenvolvimento Local')
    .addServer('https://api-staging.fayol.app', 'Staging')
    .addServer('https://api.fayol.app', 'Produção')

    // Tags organizadas por domínio
    .addTag('Auth', 'Autenticação e registro de usuários')
    .addTag('Users', 'Gerenciamento de perfil de usuário')
    .addTag('Accounts', 'Contas bancárias e carteiras digitais')
    .addTag('Transactions', 'Transações financeiras (receitas e despesas)')
    .addTag('Categories', 'Categorias de transações customizadas')
    .addTag('Budgets', 'Orçamentos e controle de gastos por categoria')
    .addTag('Investments', 'Investimentos e portfólio de ativos')
    .addTag('Trading', 'Compra e venda de ativos financeiros')
    .addTag('AI', 'Inteligência artificial: categorização, insights e previsões')
    .addTag('Reports', 'Relatórios financeiros e análises')
    .addTag('Notifications', 'Notificações e alertas do sistema')
    .addTag('Goals', 'Metas financeiras e acompanhamento')
    .addTag('Integrations', 'Integrações com bancos e serviços externos')
    .addTag('Admin', 'Endpoints administrativos (apenas ADMIN)')
    .addTag('Audit', 'Logs de auditoria e histórico de ações')
    .addTag('Health', 'Health checks e status do sistema')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    deepScanRoutes: true,
  });

  // Customizações adicionais no documento
  enhanceSwaggerDocument(document);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Mantém token JWT entre reloads
      tagsSorter: 'alpha', // Ordena tags alfabeticamente
      operationsSorter: 'alpha', // Ordena operações alfabeticamente
      docExpansion: 'none', // Começa com tudo colapsado
      filter: true, // Habilita busca
      showRequestHeaders: true,
      displayRequestDuration: true, // Mostra tempo de resposta
      tryItOutEnabled: true,
    },
    customSiteTitle: 'Fayol API Documentation',
    customfavIcon: 'https://fayol.app/favicon.ico',
    customCss: getCustomSwaggerCss(),
  });
}

/**
 * Descrição completa da API
 */
function getApiDescription(): string {
  return `
# 🏦 Fayol - API de Gerenciamento Financeiro

API REST completa para gerenciamento financeiro pessoal com IA, incluindo:

## 📋 Recursos Principais

### Autenticação & Segurança
- Login com JWT e refresh tokens
- Registro de novos usuários com validação
- Recuperação de senha via email
- Rate limiting e proteção contra brute force

### Gestão Financeira
- **Transações**: CRUD completo com categorização automática via IA
- **Contas**: Múltiplas contas bancárias e carteiras
- **Categorias**: Personalizáveis por usuário
- **Orçamentos**: Controle de gastos por categoria e período

### Investimentos & Trading
- Portfólio de investimentos
- Cotações em tempo real
- Trading de ativos
- Análise de performance

### Inteligência Artificial
- Categorização automática de transações
- Insights financeiros personalizados
- Previsões de gastos futuros
- Detecção de anomalias

### Relatórios & Analytics
- Dashboards interativos
- Exportação em múltiplos formatos (CSV, PDF, Excel)
- Análises de tendências
- Comparativos mensais/anuais

### Integrações
- Sincronização bancária via Open Banking
- Importação de OFX/CSV
- Webhooks para notificações

## 🚀 Quick Start

1. **Registre-se**: \`POST /api/auth/register\`
2. **Faça login**: \`POST /api/auth/login\` (receba o JWT)
3. **Use o JWT**: Clique em "Authorize" e cole o token
4. **Explore**: Teste os endpoints protegidos!

## 🔐 Autenticação

Todos os endpoints (exceto Auth) requerem autenticação via Bearer Token:

\`\`\`bash
Authorization: Bearer <seu-jwt-token>
\`\`\`

## 📊 Exemplos de Uso

### Criar uma transação
\`\`\`json
POST /api/transactions
{
  "description": "Almoço no restaurante",
  "amount": 45.50,
  "type": "EXPENSE",
  "date": "2025-12-14T12:00:00Z"
}
\`\`\`

### Obter insights de IA
\`\`\`bash
GET /api/ai/insights?period=3months
\`\`\`

## 🛠️ Ambientes

- **Desenvolvimento**: http://localhost:3333/api
- **Staging**: https://api-staging.fayol.app
- **Produção**: https://api.fayol.app

## 📚 Documentação Adicional

- [Guia Completo](https://docs.fayol.app)
- [Exemplos de Código](https://docs.fayol.app/examples)
- [FAQ](https://docs.fayol.app/faq)
`;
}

/**
 * Adiciona schemas e exemplos ao documento Swagger
 */
function enhanceSwaggerDocument(document: any): void {
  // Adiciona schemas de erro padrão
  document.components = document.components || {};
  document.components.schemas = document.components.schemas || {};

  // Schema de erro padrão
  document.components.schemas.ErrorResponse = {
    type: 'object',
    properties: {
      statusCode: {
        type: 'number',
        example: 400,
        description: 'HTTP status code',
      },
      message: {
        type: 'string',
        example: 'Validation failed',
        description: 'Mensagem de erro amigável',
      },
      error: {
        type: 'string',
        example: 'Bad Request',
        description: 'Nome do erro HTTP',
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2025-12-14T10:30:00Z',
        description: 'Timestamp do erro',
      },
      path: {
        type: 'string',
        example: '/api/transactions',
        description: 'Path da requisição que gerou o erro',
      },
    },
  };

  // Schema de resposta de sucesso padrão
  document.components.schemas.SuccessResponse = {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Operação realizada com sucesso',
      },
      data: {
        type: 'object',
        description: 'Dados da resposta',
      },
    },
  };

  // Schema de paginação
  document.components.schemas.PaginatedResponse = {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: {},
        description: 'Array de itens',
      },
      total: {
        type: 'number',
        example: 150,
        description: 'Total de itens disponíveis',
      },
      page: {
        type: 'number',
        example: 1,
        description: 'Página atual',
      },
      totalPages: {
        type: 'number',
        example: 15,
        description: 'Total de páginas',
      },
      limit: {
        type: 'number',
        example: 10,
        description: 'Itens por página',
      },
    },
  };
}

/**
 * CSS customizado para o Swagger UI
 */
function getCustomSwaggerCss(): string {
  return `
    .swagger-ui .topbar {
      background-color: #1a1a2e;
    }
    .swagger-ui .info .title {
      color: #0f3460;
      font-size: 2.5em;
    }
    .swagger-ui .info .description p {
      font-size: 1.1em;
      line-height: 1.6;
    }
    .swagger-ui .opblock-tag {
      font-size: 1.3em;
      font-weight: 600;
    }
    .swagger-ui .opblock.opblock-get .opblock-summary {
      border-color: #61affe;
      background: rgba(97,175,254,.1);
    }
    .swagger-ui .opblock.opblock-post .opblock-summary {
      border-color: #49cc90;
      background: rgba(73,204,144,.1);
    }
    .swagger-ui .opblock.opblock-put .opblock-summary {
      border-color: #fca130;
      background: rgba(252,161,48,.1);
    }
    .swagger-ui .opblock.opblock-delete .opblock-summary {
      border-color: #f93e3e;
      background: rgba(249,62,62,.1);
    }
  `;
}
