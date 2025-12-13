import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { APP_CONFIG } from '@fayol/shared-constants';
import { Logger } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { json, urlencoded } from 'express';
import { config } from 'dotenv';
import { resolve } from 'path';
import * as Sentry from '@sentry/node';
import { register, collectDefaultMetrics } from 'prom-client';
import initTracing from './monitoring/tracing';
import { WinstonLogger } from './common/logger/winston-logger.service';

// IMPORTANTE: Carrega .env ANTES de criar a aplicação NestJS
// Ajustado para buscar o .env na raiz do monorepo (dois níveis acima de apps/backend)
config({ path: resolve(process.cwd(), '../../.env') });

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Inicializa tracing (Jaeger/OpenTelemetry) se configurado
  try {
    initTracing();
    logger.log('Tracing initialized (if configured)');
  } catch (err) {
    logger.warn('Tracing initialization skipped or failed: ' + String(err));
  }

  // Inicializa Sentry (se DSN presente)
  if (process.env.SENTRY_DSN) {
    Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV || 'development' });
    logger.log('Sentry initialized');
  }

  // Collect default Prometheus metrics
  try {
    collectDefaultMetrics();
  } catch (err) {
    logger.warn('Prometheus metrics collection failed to start: ' + String(err));
  }

  const winstonLogger = new WinstonLogger();
  const app = await NestFactory.create(AppModule, { logger: winstonLogger });

  // CORREÇÃO: Aumentar limite para 50mb para suportar uploads de imagens/arquivos futuros
  // Isso garante que o Frontend não receba erro ao enviar anexos.
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.enableCors();
  app.setGlobalPrefix('api');

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle(APP_CONFIG.NAME)
    .setDescription(
      'API REST completa para gerenciamento financeiro pessoal com IA, incluindo:\n\n' +
      '- **Autenticação**: Login, registro e gestão de sessões\n' +
      '- **Transações**: CRUD de transações financeiras com categorização automática\n' +
      '- **Contas**: Gerenciamento de contas bancárias e carteiras\n' +
      '- **Orçamentos**: Controle de orçamentos por categoria\n' +
      '- **Investimentos**: Gestão de portfólio e trading\n' +
      '- **IA**: Categorização automática, insights e previsões\n' +
      '- **Relatórios**: Análises e dashboards financeiros\n' +
      '- **Admin**: Gestão de usuários e auditoria (ADMIN apenas)\n' +
      '- **WebSocket**: Notificações em tempo real\n\n' +
      '**Ambientes:**\n' +
      '- Desenvolvimento: http://localhost:3333/api\n' +
      '- Produção: https://api.fayol.com'
    )
    .setVersion('0.3.0')
    .setContact('Fayol Team', 'https://fayol.com', 'contato@fayol.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
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
    .addTag('Auth', 'Endpoints de autenticação e registro')
    .addTag('Users', 'Gerenciamento de perfil de usuário')
    .addTag('Accounts', 'Contas bancárias e carteiras')
    .addTag('Transactions', 'Transações financeiras')
    .addTag('Categories', 'Categorias de transações')
    .addTag('Budgets', 'Orçamentos e metas')
    .addTag('Investments', 'Investimentos e portfólio')
    .addTag('Trading', 'Compra e venda de ativos')
    .addTag('AI', 'Inteligência artificial e análises')
    .addTag('Reports', 'Relatórios e dashboards')
    .addTag('Notifications', 'Notificações do usuário')
    .addTag('Goals', 'Metas financeiras')
    .addTag('Admin', 'Endpoints administrativos (ADMIN apenas)')
    .addTag('Audit', 'Logs de auditoria (ADMIN/SUPPORT)')
    .addTag('Health', 'Health checks e status do sistema')
    .addServer('http://localhost:3333', 'Desenvolvimento')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      methodKey,
  });

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Fayol API Documentation',
    customfavIcon: 'https://fayol.com/favicon.ico',
  });

  const port = process.env.PORT || 3333;
  await app.listen(port);

  // Expose Prometheus metrics endpoint via the underlying HTTP server
  try {
    const server = app.getHttpAdapter().getInstance();
    server.get('/metrics', async (_req, res) => {
      res.setHeader('Content-Type', register.contentType);
      res.end(await register.metrics());
    });
    logger.log('Metrics endpoint exposed at /metrics');
  } catch (err) {
    logger.warn('Could not mount /metrics endpoint: ' + String(err));
  }

  logger.log(`🚀 ${APP_CONFIG.NAME} Backend is running on: http://localhost:${port}/api`);
  logger.log(`📑 Swagger Documentation is available at: http://localhost:${port}/api/docs`);
}
bootstrap();
