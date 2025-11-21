import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { APP_CONFIG } from '@fayol/shared-constants';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import { patchNestJsSwagger } from 'nestjs-zod'; <--- REMOVIDO

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  // patchNestJsSwagger(); <--- REMOVIDO

  const app = await NestFactory.create(AppModule);
  
  // Configurações Globais
  app.enableCors();
  app.setGlobalPrefix('api');

  // Validação automática (integrada com nestjs-zod através do createZodDto nos DTOs)
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Filtros e Interceptors
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Configuração do Swagger
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