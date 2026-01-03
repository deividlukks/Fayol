import MockAdapter from 'axios-mock-adapter';
import { AuthService } from '../../src/services/auth.service';
import { LoginInput, RegisterInput } from '@fayol/validation-schemas';

describe('AuthService', () => {
  let service: AuthService;
  let mock: MockAdapter;

  beforeEach(() => {
    service = new AuthService();
    mock = new MockAdapter((service as any).api);
  });

  afterEach(() => {
    mock.restore();
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const loginData: LoginInput = {
        email: 'user@test.com',
        password: 'password123',
      };

      const responseData = {
        success: true,
        data: {
          access_token: 'token123',
          user: {
            id: '1',
            name: 'Test User',
            email: 'user@test.com',
            role: 'USER' as const,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        },
      };

      mock.onPost('/login').reply(200, responseData);

      const result = await service.login(loginData);

      expect(result).toEqual(responseData);
      expect(mock.history.post).toHaveLength(1);
      expect(JSON.parse(mock.history.post[0].data)).toEqual(loginData);
    });

    it('should handle login errors', async () => {
      const loginData: LoginInput = {
        email: 'wrong@test.com',
        password: 'wrongpass',
      };

      mock.onPost('/login').reply(401, {
        success: false,
        message: 'Invalid credentials',
      });

      await expect(service.login(loginData)).rejects.toThrow();
    });

    it('should send credentials in request body', async () => {
      const loginData: LoginInput = {
        email: 'user@test.com',
        password: 'password123',
      };

      mock.onPost('/login').reply(200, { success: true, data: {} });

      await service.login(loginData);

      const requestData = JSON.parse(mock.history.post[0].data);
      expect(requestData.email).toBe('user@test.com');
      expect(requestData.password).toBe('password123');
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const registerData: RegisterInput = {
        name: 'New User',
        email: 'newuser@test.com',
        password: 'password123',
      };

      const responseData = {
        success: true,
        data: {
          id: '1',
          name: 'New User',
          email: 'newuser@test.com',
          role: 'USER' as const,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      };

      mock.onPost('/register').reply(201, responseData);

      const result = await service.register(registerData);

      expect(result).toEqual(responseData);
      expect(mock.history.post).toHaveLength(1);
    });

    it('should handle registration errors', async () => {
      const registerData: RegisterInput = {
        name: 'User',
        email: 'existing@test.com',
        password: 'pass',
      };

      mock.onPost('/register').reply(409, {
        success: false,
        message: 'Email already exists',
      });

      await expect(service.register(registerData)).rejects.toThrow();
    });

    it('should handle validation errors', async () => {
      const registerData: RegisterInput = {
        name: '',
        email: 'invalid-email',
        password: '123',
      };

      mock.onPost('/register').reply(422, {
        success: false,
        message: 'Validation failed',
        errors: {
          name: ['Name is required'],
          email: ['Invalid email format'],
          password: ['Password too short'],
        },
      });

      await expect(service.register(registerData)).rejects.toThrow();
    });
  });

  describe('checkUser', () => {
    it('should check if user exists', async () => {
      const identifier = 'user@test.com';

      const responseData = {
        success: true,
        data: {
          exists: true,
          name: 'Existing User',
          email: 'user@test.com',
        },
      };

      mock.onPost('/check').reply(200, responseData);

      const result = await service.checkUser(identifier);

      expect(result).toEqual(responseData);
      expect(mock.history.post).toHaveLength(1);
      expect(JSON.parse(mock.history.post[0].data)).toEqual({ identifier });
    });

    it('should return false when user does not exist', async () => {
      const identifier = 'nonexistent@test.com';

      const responseData = {
        success: true,
        data: {
          exists: false,
        },
      };

      mock.onPost('/check').reply(200, responseData);

      const result = await service.checkUser(identifier);

      expect(result.data.exists).toBe(false);
    });

    it('should accept email as identifier', async () => {
      mock.onPost('/check').reply(200, { success: true, data: { exists: true } });

      await service.checkUser('user@test.com');

      const requestData = JSON.parse(mock.history.post[0].data);
      expect(requestData.identifier).toBe('user@test.com');
    });

    it('should accept username as identifier', async () => {
      mock.onPost('/check').reply(200, { success: true, data: { exists: true } });

      await service.checkUser('username123');

      const requestData = JSON.parse(mock.history.post[0].data);
      expect(requestData.identifier).toBe('username123');
    });

    it('should handle server errors', async () => {
      mock.onPost('/check').reply(500);

      await expect(service.checkUser('user@test.com')).rejects.toThrow();
    });
  });

  describe('base URL configuration', () => {
    it('should use auth base URL', () => {
      const baseURL = (service as any).api.defaults.baseURL;

      expect(baseURL).toBe('http://localhost:3333/api/auth');
    });

    it('should enable retry', () => {
      // Retry is enabled via setupRetry in constructor
      // We can verify by checking interceptors are set up
      const interceptors = (service as any).api.interceptors.response;

      expect(interceptors.handlers.length).toBeGreaterThan(0);
    });
  });
});
