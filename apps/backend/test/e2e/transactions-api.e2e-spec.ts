import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Transactions API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let categoryId: string;
  let accountId: string;
  let transactionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Limpar banco de dados
    await prisma.transaction.deleteMany();
    await prisma.account.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    // Criar usuário de teste
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Test User',
        email: `test-${Date.now()}@fayol.app`,
        password: 'Test@123456',
        phone: '11999999999',
      });

    // Fazer login para obter token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: registerResponse.body.user.email,
        password: 'Test@123456',
      });

    authToken = loginResponse.body.access_token;
    userId = loginResponse.body.user.id;

    // Criar categoria de teste
    const categoryResponse = await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Alimentação Teste',
        type: 'EXPENSE',
        icon: '🍔',
        color: '#FF6B6B',
      });

    categoryId = categoryResponse.body.id;

    // Criar conta de teste
    const accountResponse = await request(app.getHttpServer())
      .post('/accounts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Conta Corrente Teste',
        type: 'CHECKING',
        initialBalance: 1000.0,
        currency: 'BRL',
      });

    accountId = accountResponse.body.id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    await prisma.transaction.deleteMany();
    await prisma.account.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('POST /transactions', () => {
    it('deve criar uma transação de despesa com sucesso', async () => {
      const response = await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Almoço no restaurante',
          amount: 45.50,
          type: 'EXPENSE',
          categoryId,
          accountId,
          date: new Date().toISOString(),
          isPaid: true,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.description).toBe('Almoço no restaurante');
      expect(response.body.amount).toBe(45.50);
      expect(response.body.type).toBe('EXPENSE');
      expect(response.body.isPaid).toBe(true);

      transactionId = response.body.id;
    });

    it('deve criar uma transação de receita com sucesso', async () => {
      const response = await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Salário',
          amount: 5000.0,
          type: 'INCOME',
          categoryId,
          accountId,
          date: new Date().toISOString(),
          isPaid: true,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.amount).toBe(5000.0);
      expect(response.body.type).toBe('INCOME');
    });

    it('deve retornar 400 com dados inválidos', async () => {
      await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: '',
          amount: -100,
          type: 'INVALID',
        })
        .expect(400);
    });

    it('deve retornar 401 sem autenticação', async () => {
      await request(app.getHttpServer())
        .post('/transactions')
        .send({
          description: 'Test',
          amount: 100,
          type: 'EXPENSE',
        })
        .expect(401);
    });

    it('deve validar amount positivo', async () => {
      const response = await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Teste',
          amount: -50,
          type: 'EXPENSE',
          categoryId,
          accountId,
          date: new Date().toISOString(),
        })
        .expect(400);

      expect(response.body.message).toContain('amount');
    });

    it('deve criar transação recorrente', async () => {
      const response = await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Aluguel',
          amount: 1500.0,
          type: 'EXPENSE',
          categoryId,
          accountId,
          date: new Date().toISOString(),
          isPaid: false,
          isRecurring: true,
          recurrenceInterval: 'MONTHLY',
          recurrenceEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .expect(201);

      expect(response.body.isRecurring).toBe(true);
      expect(response.body.recurrenceInterval).toBe('MONTHLY');
    });
  });

  describe('GET /transactions', () => {
    it('deve listar todas as transações do usuário', async () => {
      const response = await request(app.getHttpServer())
        .get('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('deve filtrar transações por tipo', async () => {
      const response = await request(app.getHttpServer())
        .get('/transactions?type=EXPENSE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.every((t: any) => t.type === 'EXPENSE')).toBe(true);
    });

    it('deve filtrar transações por período', async () => {
      const startDate = new Date('2024-01-01').toISOString();
      const endDate = new Date('2024-12-31').toISOString();

      const response = await request(app.getHttpServer())
        .get(`/transactions?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('deve filtrar por categoria', async () => {
      const response = await request(app.getHttpServer())
        .get(`/transactions?categoryId=${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.every((t: any) => t.categoryId === categoryId)).toBe(true);
    });

    it('deve filtrar por conta', async () => {
      const response = await request(app.getHttpServer())
        .get(`/transactions?accountId=${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.every((t: any) => t.accountId === accountId)).toBe(true);
    });

    it('deve suportar paginação', async () => {
      const response = await request(app.getHttpServer())
        .get('/transactions?page=1&pageSize=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.pageSize).toBe(2);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });

    it('deve buscar por descrição', async () => {
      const response = await request(app.getHttpServer())
        .get('/transactions?search=Almoço')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.some((t: any) => t.description.includes('Almoço'))).toBe(true);
    });

    it('deve retornar 401 sem autenticação', async () => {
      await request(app.getHttpServer())
        .get('/transactions')
        .expect(401);
    });
  });

  describe('GET /transactions/:id', () => {
    it('deve buscar transação por ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(transactionId);
      expect(response.body.description).toBe('Almoço no restaurante');
    });

    it('deve retornar 404 para transação inexistente', async () => {
      await request(app.getHttpServer())
        .get('/transactions/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('deve retornar 400 para ID inválido', async () => {
      await request(app.getHttpServer())
        .get('/transactions/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('PATCH /transactions/:id', () => {
    it('deve atualizar descrição da transação', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Almoço atualizado',
        })
        .expect(200);

      expect(response.body.description).toBe('Almoço atualizado');
    });

    it('deve atualizar valor da transação', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 55.75,
        })
        .expect(200);

      expect(response.body.amount).toBe(55.75);
    });

    it('deve marcar como pago/não pago', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          isPaid: false,
        })
        .expect(200);

      expect(response.body.isPaid).toBe(false);
    });

    it('deve retornar 404 para transação inexistente', async () => {
      await request(app.getHttpServer())
        .patch('/transactions/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Test',
        })
        .expect(404);
    });

    it('não deve atualizar tipo de transação', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'INCOME', // Tentando mudar de EXPENSE para INCOME
        })
        .expect(200);

      // O tipo não deve mudar
      expect(response.body.type).toBe('EXPENSE');
    });
  });

  describe('DELETE /transactions/:id', () => {
    it('deve deletar transação com sucesso', async () => {
      // Criar uma transação para deletar
      const createResponse = await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Para deletar',
          amount: 10.0,
          type: 'EXPENSE',
          categoryId,
          accountId,
          date: new Date().toISOString(),
        });

      const idToDelete = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`/transactions/${idToDelete}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verificar que foi deletada
      await request(app.getHttpServer())
        .get(`/transactions/${idToDelete}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('deve retornar 404 para transação inexistente', async () => {
      await request(app.getHttpServer())
        .delete('/transactions/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('deve retornar 401 sem autenticação', async () => {
      await request(app.getHttpServer())
        .delete(`/transactions/${transactionId}`)
        .expect(401);
    });
  });

  describe('GET /transactions/summary', () => {
    it('deve retornar resumo financeiro do mês', async () => {
      const response = await request(app.getHttpServer())
        .get('/transactions/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalIncome');
      expect(response.body).toHaveProperty('totalExpenses');
      expect(response.body).toHaveProperty('balance');
      expect(typeof response.body.totalIncome).toBe('number');
      expect(typeof response.body.totalExpenses).toBe('number');
      expect(typeof response.body.balance).toBe('number');
    });

    it('deve filtrar resumo por período', async () => {
      const startDate = new Date('2024-01-01').toISOString();
      const endDate = new Date('2024-01-31').toISOString();

      const response = await request(app.getHttpServer())
        .get(`/transactions/summary?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalIncome');
      expect(response.body).toHaveProperty('totalExpenses');
    });
  });

  describe('POST /transactions/bulk', () => {
    it('deve criar múltiplas transações em lote', async () => {
      const response = await request(app.getHttpServer())
        .post('/transactions/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          transactions: [
            {
              description: 'Transação 1',
              amount: 100,
              type: 'EXPENSE',
              categoryId,
              accountId,
              date: new Date().toISOString(),
            },
            {
              description: 'Transação 2',
              amount: 200,
              type: 'INCOME',
              categoryId,
              accountId,
              date: new Date().toISOString(),
            },
          ],
        })
        .expect(201);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
    });

    it('deve validar todas as transações antes de criar', async () => {
      await request(app.getHttpServer())
        .post('/transactions/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          transactions: [
            {
              description: 'Válida',
              amount: 100,
              type: 'EXPENSE',
              categoryId,
              accountId,
              date: new Date().toISOString(),
            },
            {
              description: '', // Inválida
              amount: -100, // Inválida
              type: 'INVALID',
            },
          ],
        })
        .expect(400);
    });
  });
});
