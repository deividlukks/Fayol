"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const request = require("supertest");
const app_module_1 = require("../src/app.module");
const prisma_service_1 = require("../src/prisma/prisma.service");
const test_app_helper_1 = require("./helpers/test-app.helper");
describe('Dashboard (e2e)', () => {
    let app;
    let prisma;
    let accessToken;
    let userId;
    let accountId;
    let categoryId;
    const testUser = {
        name: 'Dashboard Test User',
        email: `dashboard-e2e-${Date.now()}@test.com`,
        phone: '34999666555',
        password: 'Test@1234',
        investorProfile: 'moderate',
    };
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = await (0, test_app_helper_1.createTestApp)(moduleFixture);
        prisma = moduleFixture.get(prisma_service_1.PrismaService);
        const registerResponse = await request(app.getHttpServer())
            .post('/api/v1/auth/register')
            .send(testUser);
        accessToken = registerResponse.body.accessToken;
        userId = registerResponse.body.user.id;
        const accountResponse = await request(app.getHttpServer())
            .post('/api/v1/accounts')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
            name: 'Conta Dashboard',
            type: 'checking',
            initialBalance: 1000,
        });
        accountId = accountResponse.body.id;
        const categoriesResponse = await request(app.getHttpServer())
            .get('/api/v1/categories')
            .set('Authorization', `Bearer ${accessToken}`);
        categoryId = categoriesResponse.body.find((c) => c.type === 'expense')?.id;
        await request(app.getHttpServer())
            .post('/api/v1/transactions')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
            accountId,
            categoryId,
            movementType: 'expense',
            launchType: 'expense',
            amount: 50,
            description: 'Despesa teste 1',
            isRecurring: false,
            dueDate: new Date().toISOString(),
        });
        await request(app.getHttpServer())
            .post('/api/v1/transactions')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
            accountId,
            categoryId,
            movementType: 'expense',
            launchType: 'expense',
            amount: 150,
            description: 'Despesa teste 2',
            isRecurring: false,
            dueDate: new Date().toISOString(),
        });
        const incomeCategory = categoriesResponse.body.find((c) => c.type === 'income')?.id;
        await request(app.getHttpServer())
            .post('/api/v1/transactions')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
            accountId,
            categoryId: incomeCategory,
            movementType: 'income',
            launchType: 'income',
            amount: 5000,
            description: 'Receita teste',
            isRecurring: false,
            receiptDate: new Date().toISOString(),
        });
    });
    afterAll(async () => {
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
    describe('GET /api/v1/dashboard/balance', () => {
        it('deve retornar saldo consolidado', () => {
            return request(app.getHttpServer())
                .get('/api/v1/dashboard/balance')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                expect(res.body).toHaveProperty('total');
                expect(res.body).toHaveProperty('initialBalance');
                expect(res.body).toHaveProperty('transactionsBalance');
                expect(res.body).toHaveProperty('accounts');
                expect(res.body).toHaveProperty('currency');
                expect(res.body.currency).toBe('BRL');
                expect(res.body.accounts).toBeGreaterThanOrEqual(1);
            });
        });
        it('não deve retornar saldo sem autenticação', () => {
            return request(app.getHttpServer()).get('/api/v1/dashboard/balance').expect(401);
        });
    });
    describe('GET /api/v1/dashboard/summary-cards', () => {
        it('deve retornar resumo mensal', () => {
            return request(app.getHttpServer())
                .get('/api/v1/dashboard/summary-cards')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                expect(res.body).toHaveProperty('month');
                expect(res.body).toHaveProperty('income');
                expect(res.body).toHaveProperty('expenses');
                expect(res.body).toHaveProperty('balance');
                expect(res.body).toHaveProperty('transactionsCount');
                expect(res.body.transactionsCount).toBeGreaterThanOrEqual(3);
            });
        });
        it('deve aceitar filtro de mês específico', () => {
            const currentDate = new Date();
            return request(app.getHttpServer())
                .get('/api/v1/dashboard/summary-cards')
                .query({
                month: currentDate.getMonth() + 1,
                year: currentDate.getFullYear(),
            })
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                expect(res.body.month).toBe(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`);
            });
        });
        it('não deve retornar resumo sem autenticação', () => {
            return request(app.getHttpServer()).get('/api/v1/dashboard/summary-cards').expect(401);
        });
    });
    describe('GET /api/v1/dashboard/latest-transactions', () => {
        it('deve retornar últimas transações', () => {
            return request(app.getHttpServer())
                .get('/api/v1/dashboard/latest-transactions')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                expect(Array.isArray(res.body)).toBe(true);
                expect(res.body.length).toBeGreaterThanOrEqual(1);
                expect(res.body[0]).toHaveProperty('id');
                expect(res.body[0]).toHaveProperty('code');
                expect(res.body[0]).toHaveProperty('amount');
                expect(res.body[0]).toHaveProperty('description');
                expect(res.body[0]).toHaveProperty('account');
                expect(res.body[0]).toHaveProperty('category');
            });
        });
        it('deve limitar quantidade de transações', () => {
            return request(app.getHttpServer())
                .get('/api/v1/dashboard/latest-transactions')
                .query({ limit: 2 })
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                expect(res.body.length).toBeLessThanOrEqual(2);
            });
        });
        it('não deve retornar transações sem autenticação', () => {
            return request(app.getHttpServer()).get('/api/v1/dashboard/latest-transactions').expect(401);
        });
    });
    describe('GET /api/v1/dashboard/spending-by-category', () => {
        it('deve retornar gastos por categoria', () => {
            return request(app.getHttpServer())
                .get('/api/v1/dashboard/spending-by-category')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                expect(res.body).toHaveProperty('totalExpenses');
                expect(res.body).toHaveProperty('categories');
                expect(Array.isArray(res.body.categories)).toBe(true);
                if (res.body.categories.length > 0) {
                    expect(res.body.categories[0]).toHaveProperty('category');
                    expect(res.body.categories[0]).toHaveProperty('total');
                    expect(res.body.categories[0]).toHaveProperty('count');
                    expect(res.body.categories[0]).toHaveProperty('percentage');
                    expect(res.body.categories[0]).toHaveProperty('color');
                    expect(res.body.categories[0]).toHaveProperty('icon');
                }
            });
        });
        it('deve aceitar filtro de período', () => {
            const currentDate = new Date();
            return request(app.getHttpServer())
                .get('/api/v1/dashboard/spending-by-category')
                .query({
                month: currentDate.getMonth() + 1,
                year: currentDate.getFullYear(),
            })
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
        });
        it('não deve retornar gastos sem autenticação', () => {
            return request(app.getHttpServer()).get('/api/v1/dashboard/spending-by-category').expect(401);
        });
    });
    describe('GET /api/v1/dashboard/financial-health', () => {
        it('deve retornar score de saúde financeira', () => {
            return request(app.getHttpServer())
                .get('/api/v1/dashboard/financial-health')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                expect(res.body).toHaveProperty('score');
                expect(res.body).toHaveProperty('level');
                expect(res.body).toHaveProperty('message');
                expect(res.body).toHaveProperty('recommendations');
                expect(Array.isArray(res.body.recommendations)).toBe(true);
                expect(res.body.score).toBeGreaterThanOrEqual(0);
                expect(res.body.score).toBeLessThanOrEqual(100);
                expect(['excellent', 'good', 'fair', 'poor', 'critical']).toContain(res.body.level);
            });
        });
        it('não deve retornar score sem autenticação', () => {
            return request(app.getHttpServer()).get('/api/v1/dashboard/financial-health').expect(401);
        });
    });
    describe('Isolamento de Dados', () => {
        let otherUserToken;
        beforeAll(async () => {
            const otherUserResponse = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                ...testUser,
                email: `other-dashboard-${Date.now()}@test.com`,
            });
            otherUserToken = otherUserResponse.body.accessToken;
            const otherAccountResponse = await request(app.getHttpServer())
                .post('/api/v1/accounts')
                .set('Authorization', `Bearer ${otherUserToken}`)
                .send({
                name: 'Conta Outro Usuário',
                type: 'checking',
                initialBalance: 500,
            });
            const categoriesResponse = await request(app.getHttpServer())
                .get('/api/v1/categories')
                .set('Authorization', `Bearer ${otherUserToken}`);
            const otherCategory = categoriesResponse.body.find((c) => c.type === 'expense')?.id;
            await request(app.getHttpServer())
                .post('/api/v1/transactions')
                .set('Authorization', `Bearer ${otherUserToken}`)
                .send({
                accountId: otherAccountResponse.body.id,
                categoryId: otherCategory,
                movementType: 'expense',
                launchType: 'expense',
                amount: 100,
                description: 'Despesa outro usuário',
                isRecurring: false,
                dueDate: new Date().toISOString(),
            });
        });
        it('não deve exibir transações de outro usuário no dashboard', async () => {
            const user1Dashboard = await request(app.getHttpServer())
                .get('/api/v1/dashboard/latest-transactions')
                .set('Authorization', `Bearer ${accessToken}`);
            const user2Dashboard = await request(app.getHttpServer())
                .get('/api/v1/dashboard/latest-transactions')
                .set('Authorization', `Bearer ${otherUserToken}`);
            expect(user1Dashboard.body).not.toEqual(user2Dashboard.body);
        });
        it('não deve incluir saldo de outro usuário', async () => {
            const user1Balance = await request(app.getHttpServer())
                .get('/api/v1/dashboard/balance')
                .set('Authorization', `Bearer ${accessToken}`);
            const user2Balance = await request(app.getHttpServer())
                .get('/api/v1/dashboard/balance')
                .set('Authorization', `Bearer ${otherUserToken}`);
            expect(user1Balance.body.total).not.toBe(user2Balance.body.total);
        });
    });
});
//# sourceMappingURL=dashboard.e2e-spec.js.map