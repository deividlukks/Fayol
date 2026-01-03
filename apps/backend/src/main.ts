import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { APP_CONFIG } from '@fayol/shared-constants';
import { Logger } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ZodValidationPipe } from 'nestjs-zod';
import { json, urlencoded } from 'express';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import { resolve } from 'path';
import { WinstonLogger } from './common/logger/winston-logger.service';
import { initializeSentry } from './telemetry/sentry.config';
import { setupSwagger } from './common/swagger/swagger.config';

// IMPORTANTE: Carrega .env ANTES de criar a aplicação NestJS
// Ajustado para buscar o .env na raiz do monorepo (dois níveis acima de apps/backend)
config({ path: resolve(process.cwd(), '../../.env') });

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Inicializa Sentry com configuração avançada
  // Tracing e Metrics são inicializados automaticamente pelo TelemetryModule
  initializeSentry();

  const winstonLogger = new WinstonLogger();
  const app = await NestFactory.create(AppModule, { logger: winstonLogger });

  // CORREÇÃO: Aumentar limite para 50mb para suportar uploads de imagens/arquivos futuros
  // Isso garante que o Frontend não receba erro ao enviar anexos.
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Habilita parsing de cookies para suportar httpOnly cookies
  app.use(cookieParser());

  // Configura CORS para aceitar cookies (credentials: true)
  // Suporta múltiplas origens: web-app e admin-panel
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.ADMIN_URL || 'http://localhost:3001',
    'http://admin.localhost:3001',
    'https://fayol.app',
    'https://admin.fayol.app',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // CRÍTICO: permite cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Configura Swagger/OpenAPI com documentação completa
  setupSwagger(app);

  const port = process.env.PORT || 3333;
  await app.listen(port);

  logger.log(`🚀 ${APP_CONFIG.NAME} Backend is running on: http://localhost:${port}/api`);
  logger.log(`📑 Swagger Documentation is available at: http://localhost:${port}/api/docs`);
  logger.log(`📊 Metrics endpoint available at: http://localhost:${port}/metrics`);
}
bootstrap();
