import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import compress from '@fastify/compress';
// import helmet from '@fastify/helmet'; // TODO: Aguardando NestJS suportar Fastify 5.x
// import rateLimit from '@fastify/rate-limit'; // TODO: Aguardando NestJS suportar Fastify 5.x
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Compression (gzip, deflate, brotli)
  await app.register(compress, {
    encodings: ['gzip', 'deflate', 'br'],
    threshold: 1024, // Comprime apenas respostas > 1KB
  });

  // Security - Helmet (Desabilitado - Aguardando NestJS suportar Fastify 5.x)
  // TODO: Reativar quando @nestjs/platform-fastify suportar Fastify 5.x
  // Referência: https://github.com/nestjs/nest/issues/12633
  // await app.register(helmet, {
  //   contentSecurityPolicy: {
  //     directives: {
  //       defaultSrc: [`'self'`],
  //       styleSrc: [`'self'`, `'unsafe-inline'`],
  //       imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
  //       scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
  //     },
  //   },
  // });

  // Rate Limiting (Desabilitado - Aguardando NestJS suportar Fastify 5.x)
  // TODO: Reativar quando @nestjs/platform-fastify suportar Fastify 5.x
  // await app.register(rateLimit, {
  //   global: true,
  //   max: 100, // máximo de 100 requests
  //   timeWindow: '15 minutes', // por janela de 15 minutos
  //   errorResponseBuilder: () => ({
  //     statusCode: 429,
  //     error: 'Too Many Requests',
  //     message: 'Você excedeu o limite de requisições. Tente novamente mais tarde.',
  //   }),
  // });

  // CORS
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:3001', 'http://localhost:3000'];

  app.enableCors({
    origin: (origin, callback) => {
      // Permite requisições sem origin (mobile apps, Postman, etc)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
    exposedHeaders: ['X-Correlation-ID'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Fayol API')
    .setDescription('Sistema Multiplataforma de Gestão Financeira Pessoal com IA')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticação e autorização')
    .addTag('users', 'Gestão de usuários')
    .addTag('accounts', 'Gestão de contas financeiras')
    .addTag('categories', 'Gestão de categorias e subcategorias')
    .addTag('transactions', 'Gestão de transações')
    .addTag('dashboard', 'Dashboard e métricas')
    .addTag('reports', 'Relatórios e análises')
    .addTag('ai', 'Inteligência Artificial')
    .addTag('export', 'Exportação de dados')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Fayol API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
