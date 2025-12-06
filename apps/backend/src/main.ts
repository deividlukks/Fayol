import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { APP_CONFIG } from '@fayol/shared-constants';
import { Logger } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  // CORREÇÃO: Aumentar limite para 50mb para suportar uploads de imagens/arquivos futuros
  // Isso garante que o Frontend não receba erro ao enviar anexos.
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.enableCors();
  app.setGlobalPrefix('api');

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const config = new DocumentBuilder()
    .setTitle(APP_CONFIG.NAME)
    .setDescription('Documentação da API do Fayol - Gestão Financeira')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3333;
  await app.listen(port);

  logger.log(`🚀 ${APP_CONFIG.NAME} Backend is running on: http://localhost:${port}/api`);
  logger.log(`📑 Swagger Documentation is available at: http://localhost:${port}/api/docs`);
}
bootstrap();
