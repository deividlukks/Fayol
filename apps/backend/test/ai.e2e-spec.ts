import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AI Controller (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login para obter token
    const loginResponse = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: 'teste@fayol.com',
      password: 'Senha@123',
    });

    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/ai/suggest-category (POST)', () => {
    it('should categorize Uber transaction', () => {
      return request(app.getHttpServer())
        .post('/api/v1/ai/suggest-category')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Uber para o trabalho',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.category).toBe('Transporte');
          expect(res.body.subcategory).toBe('Uber/Taxi');
          expect(res.body.confidence).toBeGreaterThan(0.9);
        });
    });

    it('should categorize restaurant transaction', () => {
      return request(app.getHttpServer())
        .post('/api/v1/ai/suggest-category')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Almoço no Restaurante XYZ',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.category).toBe('Alimentação');
          expect(res.body.subcategory).toBe('Restaurante');
          expect(res.body.confidence).toBeGreaterThan(0.8);
        });
    });

    it('should handle unknown category', () => {
      return request(app.getHttpServer())
        .post('/api/v1/ai/suggest-category')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Compra misteriosa XPTO',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.category).toBeDefined();
          expect(res.body.confidence).toBeLessThan(0.5);
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/ai/suggest-category')
        .send({
          description: 'Test',
        })
        .expect(401);
    });
  });

  describe('/api/v1/ai/analyze-spending (POST)', () => {
    it('should analyze spending patterns', () => {
      const transactions = [
        {
          id: '1',
          description: 'Salário',
          amount: 5000,
          date: new Date().toISOString(),
          category: 'Salário',
        },
        {
          id: '2',
          description: 'Supermercado',
          amount: -500,
          date: new Date().toISOString(),
          category: 'Alimentação',
        },
      ];

      return request(app.getHttpServer())
        .post('/api/v1/ai/analyze-spending')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ transactions })
        .expect(201)
        .expect((res) => {
          expect(res.body.summary).toBeDefined();
          expect(res.body.summary.totalIncome).toBe(5000);
          expect(res.body.summary.totalExpenses).toBe(500);
          expect(res.body.categoryBreakdown).toBeDefined();
          expect(res.body.healthScore).toBeDefined();
          expect(res.body.healthScore).toBeGreaterThanOrEqual(0);
          expect(res.body.healthScore).toBeLessThanOrEqual(100);
        });
    });

    it('should detect high savings rate', () => {
      const transactions = [
        {
          id: '1',
          description: 'Salário',
          amount: 5000,
          date: new Date().toISOString(),
          category: 'Salário',
        },
        {
          id: '2',
          description: 'Gastos mínimos',
          amount: -500,
          date: new Date().toISOString(),
          category: 'Outros',
        },
      ];

      return request(app.getHttpServer())
        .post('/api/v1/ai/analyze-spending')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ transactions })
        .expect(201)
        .expect((res) => {
          expect(res.body.healthScore).toBeGreaterThan(70);
          expect(res.body.insights).toContain(expect.stringContaining('poupança'));
        });
    });
  });

  describe('/api/v1/ai/predict-future (POST)', () => {
    it('should predict future finances', () => {
      const transactions = Array.from({ length: 30 }, (_, i) => ({
        id: `${i}`,
        description: i % 2 === 0 ? 'Salário' : 'Despesa',
        amount: i % 2 === 0 ? 5000 : -1000,
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        category: i % 2 === 0 ? 'Salário' : 'Outros',
      }));

      return request(app.getHttpServer())
        .post('/api/v1/ai/predict-future')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          transactions,
          monthsAhead: 3,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.predictions).toBeDefined();
          expect(res.body.predictions.length).toBe(3);
          expect(res.body.predictions[0]).toHaveProperty('month');
          expect(res.body.predictions[0]).toHaveProperty('predictedIncome');
          expect(res.body.predictions[0]).toHaveProperty('confidence');
          expect(res.body.reliability).toBeDefined();
        });
    });
  });

  describe('/api/v1/ai/detect-anomalies (POST)', () => {
    it('should detect spending anomalies', () => {
      const transactions = [
        ...Array.from({ length: 10 }, (_, i) => ({
          id: `${i}`,
          description: 'Gasto normal',
          amount: -100,
          date: new Date().toISOString(),
          category: 'Alimentação',
        })),
        {
          id: '11',
          description: 'Gasto anômalo',
          amount: -5000,
          date: new Date().toISOString(),
          category: 'Alimentação',
        },
      ];

      return request(app.getHttpServer())
        .post('/api/v1/ai/detect-anomalies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ transactions })
        .expect(201)
        .expect((res) => {
          expect(res.body.anomalies).toBeDefined();
          expect(res.body.anomalyCount).toBeGreaterThan(0);
          expect(res.body.categoryStatistics).toBeDefined();
        });
    });
  });

  describe('/api/v1/ai/recommendations (POST)', () => {
    it('should generate personalized recommendations', () => {
      const transactions = [
        {
          id: '1',
          description: 'Salário',
          amount: 5000,
          date: new Date().toISOString(),
          category: 'Salário',
        },
        {
          id: '2',
          description: 'Alimentação',
          amount: -2000,
          date: new Date().toISOString(),
          category: 'Alimentação',
        },
      ];

      return request(app.getHttpServer())
        .post('/api/v1/ai/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          transactions,
          userGoals: {
            targetSavings: 1000,
            targetSavingsRate: 20,
          },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.recommendations).toBeDefined();
          expect(Array.isArray(res.body.recommendations)).toBe(true);
          expect(res.body.currentFinancialHealth).toBeDefined();
          expect(res.body.priorityActions).toBeDefined();
        });
    });
  });
});
