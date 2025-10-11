import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

/**
 * Cria uma aplicação NestJS para testes E2E usando Fastify
 * Aplica as mesmas configurações do main.ts
 */
export async function createTestApp(moduleFixture: TestingModule): Promise<INestApplication> {
  const app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  return app;
}
