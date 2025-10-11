import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './helpers/test-app.helper';

describe('Transactions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  let accountId: string;
  let categoryId: string;
  let transactionId: string;

  const testUser = {
    name: 'Transactions Test User',
    email: `transactions-e2e-${Date.now()}@test.com`,
    phone: '34999777666',
    password: 'Test@1234',
    investorProfile: 'moderate',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await createTestApp(moduleFixture);
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Registrar usuário
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser);

    accessToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;

    // Criar conta
    const accountResponse = await request(app.getHttpServer())
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Conta Teste Transações',
        type: 'checking',
        initialBalance: 1000,
      });

    accountId = accountResponse.body.id;

    // Buscar categoria existente
    const categoriesResponse = await request(app.getHttpServer())
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${accessToken}`);

    categoryId = categoriesResponse.body.find((c: any) => c.type === 'expense')?.id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    await prisma.transaction.deleteMany({
      where: { userId },
    });

    await prisma.account.deleteMany({
      where: { userId },
    });

    await prisma.user.delete({
      where: { id: userId },
    });

    await app.close();
  });

  describe('POST /api/v1/transactions', () => {
    it('deve criar uma despesa', () => {
      return request(app.getHttpServer())
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          accountId,
          categoryId,
          movementType: 'expense',
          launchType: 'expense',
          amount: 50.0,
          description: 'Almoço restaurante',
          isRecurring: false,
          dueDate: new Date().toISOString(),
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('code');
          expect(res.body.amount).toBe('50');
          expect(res.body.movementType).toBe('expense');
          expect(res.body.userId).toBe(userId);
          transactionId = res.body.id;
        });
    });

    it('deve criar uma receita', () => {
      return request(app.getHttpServer())
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          accountId,
          categoryId: (categoriesResponse) =>
            categoriesResponse.body.find((c: any) => c.type === 'income')?.id,
          movementType: 'income',
          launchType: 'income',
          amount: 5000.0,
          description: 'Salário mensal',
          isRecurring: true,
          recurrencePeriod: 'monthly',
          receiptDate: new Date().toISOString(),
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.movementType).toBe('income');
          expect(res.body.isRecurring).toBe(true);
          expect(res.body.recurrencePeriod).toBe('monthly');
        });
    });

    it('deve validar campos obrigatórios', () => {
      return request(app.getHttpServer())
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          // Faltando campos obrigatórios
          amount: 100,
        })
        .expect(400);
    });

    it('deve validar tipo de movimento', () => {
      return request(app.getHttpServer())
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          accountId,
          categoryId,
          movementType: 'tipo-invalido',
          launchType: 'expense',
          amount: 50,
          description: 'Teste',
          isRecurring: false,
          dueDate: new Date().toISOString(),
        })
        .expect(400);
    });

    it('não deve criar transação sem autenticação', () => {
      return request(app.getHttpServer())
        .post('/api/v1/transactions')
        .send({
          accountId,
          categoryId,
          movementType: 'expense',
          launchType: 'expense',
          amount: 50,
          description: 'Teste',
          isRecurring: false,
          dueDate: new Date().toISOString(),
        })
        .expect(401);
    });

    it('não deve criar transação com conta de outro usuário', async () => {
      const otherUser = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          email: `other-trans-${Date.now()}@test.com`,
        });

      return request(app.getHttpServer())
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${otherUser.body.accessToken}`)
        .send({
          accountId, // Conta do primeiro usuário
          categoryId,
          movementType: 'expense',
          launchType: 'expense',
          amount: 50,
          description: 'Teste',
          isRecurring: false,
          dueDate: new Date().toISOString(),
        })
        .expect(404);
    });
  });

  describe('GET /api/v1/transactions', () => {
    it('deve listar transações do usuário', () => {
      return request(app.getHttpServer())
        .get('/api/v1/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(1);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('code');
          expect(res.body[0]).toHaveProperty('amount');
        });
    });

    it('deve filtrar transações por tipo', () => {
      return request(app.getHttpServer())
        .get('/api/v1/transactions')
        .query({ movementType: 'expense' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.every((t: any) => t.movementType === 'expense')).toBe(true);
        });
    });

    it('deve filtrar transações por conta', () => {
      return request(app.getHttpServer())
        .get('/api/v1/transactions')
        .query({ accountId })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.every((t: any) => t.accountId === accountId)).toBe(true);
        });
    });

    it('não deve listar transações sem autenticação', () => {
      return request(app.getHttpServer()).get('/api/v1/transactions').expect(401);
    });
  });

  describe('GET /api/v1/transactions/:id', () => {
    it('deve buscar transação específica', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(transactionId);
          expect(res.body).toHaveProperty('account');
          expect(res.body).toHaveProperty('category');
        });
    });

    it('deve retornar 404 para transação inexistente', () => {
      return request(app.getHttpServer())
        .get('/api/v1/transactions/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('não deve buscar transação de outro usuário', async () => {
      const otherUser = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          email: `other-trans2-${Date.now()}@test.com`,
        });

      return request(app.getHttpServer())
        .get(`/api/v1/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${otherUser.body.accessToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/v1/transactions/:id', () => {
    it('deve atualizar descrição da transação', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          description: 'Descrição atualizada',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.description).toBe('Descrição atualizada');
        });
    });

    it('deve atualizar valor da transação', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          amount: 75.5,
        })
        .expect(200)
        .expect((res) => {
          expect(parseFloat(res.body.amount)).toBe(75.5);
        });
    });

    it('não deve atualizar transação de outro usuário', async () => {
      const otherUser = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          email: `other-trans3-${Date.now()}@test.com`,
        });

      return request(app.getHttpServer())
        .patch(`/api/v1/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${otherUser.body.accessToken}`)
        .send({
          description: 'Tentativa de atualizar',
        })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/transactions/:id', () => {
    let transactionToDelete: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          accountId,
          categoryId,
          movementType: 'expense',
          launchType: 'expense',
          amount: 25,
          description: 'Transação para deletar',
          isRecurring: false,
          dueDate: new Date().toISOString(),
        });

      transactionToDelete = response.body.id;
    });

    it('deve deletar transação', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/transactions/${transactionToDelete}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('não deve encontrar transação deletada', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/transactions/${transactionToDelete}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('não deve deletar transação de outro usuário', async () => {
      const otherUser = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          email: `other-trans4-${Date.now()}@test.com`,
        });

      return request(app.getHttpServer())
        .delete(`/api/v1/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${otherUser.body.accessToken}`)
        .expect(404);
    });
  });

  describe('POST /api/v1/transactions/:id/effectuate', () => {
    let pendingTransactionId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          accountId,
          categoryId,
          movementType: 'expense',
          launchType: 'expense',
          amount: 100,
          description: 'Transação para efetivar',
          isRecurring: false,
          dueDate: new Date().toISOString(),
        });

      pendingTransactionId = response.body.id;
    });

    it('deve efetivar transação', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/transactions/${pendingTransactionId}/effectuate`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('effectiveDate');
          expect(res.body.effectiveDate).not.toBeNull();
        });
    });

    it('não deve efetivar transação de outro usuário', async () => {
      const otherUser = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          email: `other-trans5-${Date.now()}@test.com`,
        });

      return request(app.getHttpServer())
        .post(`/api/v1/transactions/${pendingTransactionId}/effectuate`)
        .set('Authorization', `Bearer ${otherUser.body.accessToken}`)
        .expect(404);
    });
  });
});
