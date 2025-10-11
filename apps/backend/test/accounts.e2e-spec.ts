import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './helpers/test-app.helper';

describe('Accounts (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  let createdAccountId: string;

  const testUser = {
    name: 'Accounts Test User',
    email: `accounts-e2e-${Date.now()}@test.com`,
    phone: '34999888777',
    password: 'Test@1234',
    investorProfile: 'moderate',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await createTestApp(moduleFixture);
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Registrar e fazer login
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser);

    accessToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    await prisma.account.deleteMany({
      where: { userId },
    });

    await prisma.user.delete({
      where: { id: userId },
    });

    await app.close();
  });

  describe('POST /api/v1/accounts', () => {
    it('deve criar uma conta corrente', () => {
      return request(app.getHttpServer())
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Nubank',
          type: 'checking',
          initialBalance: 1000,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Nubank');
          expect(res.body.type).toBe('checking');
          expect(res.body.userId).toBe(userId);
          createdAccountId = res.body.id;
        });
    });

    it('deve criar uma conta poupança', () => {
      return request(app.getHttpServer())
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Poupança Caixa',
          type: 'savings',
          initialBalance: 5000,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.type).toBe('savings');
        });
    });

    it('deve criar uma conta de investimento', () => {
      return request(app.getHttpServer())
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'XP Investimentos',
          type: 'investment',
          initialBalance: 10000,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.type).toBe('investment');
        });
    });

    it('deve validar tipo de conta', () => {
      return request(app.getHttpServer())
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Conta Inválida',
          type: 'tipo-invalido',
          initialBalance: 0,
        })
        .expect(400);
    });

    it('deve validar campos obrigatórios', () => {
      return request(app.getHttpServer())
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Conta Incompleta',
          // Faltando type
        })
        .expect(400);
    });

    it('não deve criar conta sem autenticação', () => {
      return request(app.getHttpServer())
        .post('/api/v1/accounts')
        .send({
          name: 'Conta Teste',
          type: 'checking',
          initialBalance: 0,
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/accounts', () => {
    it('deve listar todas as contas do usuário', () => {
      return request(app.getHttpServer())
        .get('/api/v1/accounts')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(3);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('name');
          expect(res.body[0]).toHaveProperty('type');
        });
    });

    it('não deve listar contas sem autenticação', () => {
      return request(app.getHttpServer()).get('/api/v1/accounts').expect(401);
    });
  });

  describe('GET /api/v1/accounts/:id', () => {
    it('deve buscar uma conta específica', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/accounts/${createdAccountId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdAccountId);
          expect(res.body.name).toBe('Nubank');
        });
    });

    it('não deve buscar conta de outro usuário', async () => {
      // Criar outro usuário
      const otherUser = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          email: `other-${Date.now()}@test.com`,
        });

      // Tentar acessar conta do primeiro usuário
      return request(app.getHttpServer())
        .get(`/api/v1/accounts/${createdAccountId}`)
        .set('Authorization', `Bearer ${otherUser.body.accessToken}`)
        .expect(404);
    });

    it('deve retornar 404 para conta inexistente', () => {
      return request(app.getHttpServer())
        .get('/api/v1/accounts/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/v1/accounts/:id', () => {
    it('deve atualizar nome da conta', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/accounts/${createdAccountId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Nubank Atualizado',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Nubank Atualizado');
        });
    });

    it('deve desativar conta', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/accounts/${createdAccountId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          isActive: false,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.isActive).toBe(false);
        });
    });

    it('deve reativar conta', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/accounts/${createdAccountId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          isActive: true,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.isActive).toBe(true);
        });
    });

    it('não deve atualizar conta de outro usuário', async () => {
      const otherUser = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          email: `other2-${Date.now()}@test.com`,
        });

      return request(app.getHttpServer())
        .patch(`/api/v1/accounts/${createdAccountId}`)
        .set('Authorization', `Bearer ${otherUser.body.accessToken}`)
        .send({
          name: 'Tentativa de Atualizar',
        })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/accounts/:id', () => {
    let accountToDelete: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Conta para Deletar',
          type: 'checking',
          initialBalance: 0,
        });

      accountToDelete = response.body.id;
    });

    it('deve deletar conta', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/accounts/${accountToDelete}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('não deve encontrar conta deletada', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/accounts/${accountToDelete}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('não deve deletar conta de outro usuário', async () => {
      const otherUser = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          email: `other3-${Date.now()}@test.com`,
        });

      return request(app.getHttpServer())
        .delete(`/api/v1/accounts/${createdAccountId}`)
        .set('Authorization', `Bearer ${otherUser.body.accessToken}`)
        .expect(404);
    });
  });
});
