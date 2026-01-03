import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const testUser = {
    name: 'Test User E2E',
    email: 'teste2e@example.com',
    password: 'password123',
    phone: '11999999999',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    // Cleanup: Delete test user if exists
    try {
      await prismaService.user.deleteMany({
        where: { email: { contains: 'teste2e' } },
      });
    } catch (error) {
      // Ignore cleanup errors
    }

    await prismaService.$disconnect();
    await app.close();
  });

  describe('/auth/check (POST)', () => {
    it('should check if user exists by email', () => {
      return request(app.getHttpServer())
        .post('/auth/check')
        .send({ identifier: testUser.email })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('exists');
          expect(typeof res.body.exists).toBe('boolean');
        });
    });

    it('should return exists false for non-existent user', () => {
      return request(app.getHttpServer())
        .post('/auth/check')
        .send({ identifier: 'nonexistent@example.com' })
        .expect(200)
        .expect((res) => {
          expect(res.body.exists).toBe(false);
        });
    });
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email', testUser.email);
          expect(res.body).toHaveProperty('name', testUser.name);
          expect(res.body).not.toHaveProperty('passwordHash');
          expect(res.body).toHaveProperty('roles');
          expect(res.body.roles).toContain('USER');
        });
    });

    it('should prevent duplicate email registration', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('já cadastrado');
        });
    });

    it('should validate registration data', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'A',
          email: 'invalid-email',
          password: '123',
        })
        .expect(400);
    });

    it('should normalize phone number on registration', () => {
      const userWithFormattedPhone = {
        name: 'Phone Test User',
        email: 'phonetest@example.com',
        password: 'password123',
        phone: '(11) 98765-4321',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(userWithFormattedPhone)
        .expect(201)
        .expect((res) => {
          expect(res.body.phoneNumber).toBe('11987654321');
        });
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('email', testUser.email);
          expect(res.body.user).not.toHaveProperty('passwordHash');
        });
    });

    it('should reject login with wrong password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('Credenciais incorretas');
        });
    });

    it('should reject login with non-existent email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);
    });

    it('should enforce rate limiting on login attempts', async () => {
      const attempts = Array(6).fill(null);

      for (const _ of attempts) {
        await request(app.getHttpServer()).post('/auth/login').send({
          email: testUser.email,
          password: 'wrongpassword',
        });
      }

      // 7th attempt should be rate limited
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(429);
    });
  });

  describe('/auth/forgot-password (POST)', () => {
    let resetToken: string;

    it('should request password reset', () => {
      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('link de recuperação');
          // In development, devToken is returned
          if (res.body.devToken) {
            resetToken = res.body.devToken;
          }
        });
    });

    it('should return generic message for non-existent email (security)', () => {
      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain('link de recuperação');
        });
    });

    it('should validate email format', () => {
      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);
    });
  });

  describe('/auth/reset-password (POST)', () => {
    let resetToken: string;

    beforeAll(async () => {
      // Generate a valid reset token
      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: testUser.email });

      resetToken = response.body.devToken;
    });

    it('should reset password with valid token', () => {
      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'newPassword123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain('Senha alterada com sucesso');
        });
    });

    it('should reject invalid reset token', () => {
      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: 'invalid-token-12345',
          newPassword: 'newPassword123',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Token inválido');
        });
    });

    it('should validate new password strength', () => {
      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: '123', // Too short
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('pelo menos 6 caracteres');
        });
    });

    it('should allow login with new password after reset', async () => {
      // First, reset password
      const newPassword = 'resetPassword123';
      const resetResponse = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: testUser.email });

      await request(app.getHttpServer()).post('/auth/reset-password').send({
        token: resetResponse.body.devToken,
        newPassword,
      });

      // Then try to login with new password
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: newPassword,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
        });
    });
  });

  describe('JWT Token Validation', () => {
    let accessToken: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer()).post('/auth/login').send({
        email: testUser.email,
        password: 'resetPassword123', // Using password from previous test
      });

      accessToken = response.body.access_token;
    });

    it('should access protected route with valid token', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should reject request without token', () => {
      return request(app.getHttpServer()).get('/users/me').expect(401);
    });

    it('should reject request with invalid token', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', 'Bearer invalid-token-123')
        .expect(401);
    });

    it('should reject request with malformed authorization header', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', 'InvalidFormat token123')
        .expect(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limit on registration endpoint', async () => {
      const attempts = Array(4).fill(null);

      for (let i = 0; i < attempts.length; i++) {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            name: 'Rate Limit Test',
            email: `ratelimit${i}@example.com`,
            password: 'password123',
          });
      }

      // 5th attempt should be rate limited (limit is 3 per hour)
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Rate Limit Test',
          email: 'ratelimit5@example.com',
          password: 'password123',
        })
        .expect(429);
    });
  });

  describe('Case Insensitivity', () => {
    it('should login with email in different case', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email.toUpperCase(),
          password: 'resetPassword123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
        });
    });

    it('should check user existence with different email casing', () => {
      return request(app.getHttpServer())
        .post('/auth/check')
        .send({ identifier: testUser.email.toUpperCase() })
        .expect(200)
        .expect((res) => {
          expect(res.body.exists).toBe(true);
        });
    });
  });
});
