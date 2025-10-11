import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './helpers/test-app.helper';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testUser = {
    name: 'E2E Test User',
    email: `e2e-test-${Date.now()}@test.com`,
    phone: '34999999999',
    password: 'Test@1234',
    investorProfile: 'moderate',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await createTestApp(moduleFixture);
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Limpar usuário de teste
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'e2e-test-',
        },
      },
    });

    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('deve registrar um novo usuário com sucesso', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body.user.email).toBe(testUser.email);
          expect(res.body.user.name).toBe(testUser.name);
          expect(res.body.user).not.toHaveProperty('password');
        });
    });

    it('não deve permitir email duplicado', () => {
      return request(app.getHttpServer()).post('/api/v1/auth/register').send(testUser).expect(409);
    });

    it('deve validar campos obrigatórios', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid@test.com',
          // Faltando campos obrigatórios
        })
        .expect(400);
    });

    it('deve validar formato de email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          email: 'email-invalido',
        })
        .expect(400);
    });

    it('deve validar força da senha', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          email: 'newuser@test.com',
          password: '123', // Senha fraca
        })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('deve fazer login com credenciais válidas', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe(testUser.email);
        });
    });

    it('não deve fazer login com email inválido', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'naoexiste@test.com',
          password: testUser.password,
        })
        .expect(401);
    });

    it('não deve fazer login com senha incorreta', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'senha-errada',
        })
        .expect(401);
    });

    it('deve validar formato de email no login', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'email-invalido',
          password: testUser.password,
        })
        .expect(400);
    });
  });

  describe('JWT Token', () => {
    let accessToken: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });

      accessToken = response.body.accessToken;
    });

    it('deve aceitar token JWT válido em rotas protegidas', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe(testUser.email);
        });
    });

    it('não deve aceitar requisição sem token', () => {
      return request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
    });

    it('não deve aceitar token inválido', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);
    });

    it('não deve aceitar token malformado', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', 'InvalidFormat')
        .expect(401);
    });
  });
});
