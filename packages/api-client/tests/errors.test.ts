import { AxiosError, AxiosResponse } from 'axios';
import { HTTP_STATUS } from '@fayol/shared-constants';
import {
  ApiError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  ConflictError,
  RateLimitError,
  ServerError,
  NetworkError,
  handleAxiosError,
} from '../src/errors';

describe('API Errors', () => {
  describe('ApiError', () => {
    it('should create error with message and status', () => {
      const error = new ApiError('Test error', 400, 'TEST_CODE');

      expect(error.name).toBe('ApiError');
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(400);
      expect(error.code).toBe('TEST_CODE');
    });

    it('should include details', () => {
      const details = { field: 'email', reason: 'invalid' };
      const error = new ApiError('Test error', 400, 'TEST_CODE', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create 401 error', () => {
      const error = new UnauthorizedError();

      expect(error.name).toBe('UnauthorizedError');
      expect(error.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe('Não autorizado. Faça login novamente.');
    });

    it('should accept custom message', () => {
      const error = new UnauthorizedError('Token expirado');

      expect(error.message).toBe('Token expirado');
    });
  });

  describe('ForbiddenError', () => {
    it('should create 403 error', () => {
      const error = new ForbiddenError();

      expect(error.name).toBe('ForbiddenError');
      expect(error.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(error.code).toBe('FORBIDDEN');
      expect(error.message).toBe('Acesso negado.');
    });
  });

  describe('NotFoundError', () => {
    it('should create 404 error', () => {
      const error = new NotFoundError();

      expect(error.name).toBe('NotFoundError');
      expect(error.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(error.code).toBe('NOT_FOUND');
    });
  });

  describe('ValidationError', () => {
    it('should create 422 error', () => {
      const error = new ValidationError();

      expect(error.name).toBe('ValidationError');
      expect(error.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should include validation errors', () => {
      const validationErrors = {
        email: ['Email é obrigatório', 'Email inválido'],
        password: ['Senha muito curta'],
      };
      const error = new ValidationError('Dados inválidos', validationErrors);

      expect(error.validationErrors).toEqual(validationErrors);
      expect(error.details).toEqual(validationErrors);
    });
  });

  describe('ConflictError', () => {
    it('should create 409 error', () => {
      const error = new ConflictError();

      expect(error.name).toBe('ConflictError');
      expect(error.status).toBe(HTTP_STATUS.CONFLICT);
      expect(error.code).toBe('CONFLICT');
    });
  });

  describe('RateLimitError', () => {
    it('should create 429 error', () => {
      const error = new RateLimitError();

      expect(error.name).toBe('RateLimitError');
      expect(error.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
      expect(error.code).toBe('RATE_LIMIT');
    });

    it('should include retryAfter', () => {
      const error = new RateLimitError('Rate limit exceeded', 60);

      expect(error.retryAfter).toBe(60);
      expect(error.details).toEqual({ retryAfter: 60 });
    });
  });

  describe('ServerError', () => {
    it('should create 500 error', () => {
      const error = new ServerError();

      expect(error.name).toBe('ServerError');
      expect(error.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(error.code).toBe('SERVER_ERROR');
    });

    it('should accept custom status', () => {
      const error = new ServerError('Service unavailable', 503);

      expect(error.status).toBe(503);
      expect(error.message).toBe('Service unavailable');
    });
  });

  describe('NetworkError', () => {
    it('should create network error without status', () => {
      const error = new NetworkError();

      expect(error.name).toBe('NetworkError');
      expect(error.status).toBeUndefined();
      expect(error.code).toBe('NETWORK_ERROR');
    });
  });

  describe('handleAxiosError', () => {
    function createAxiosError(status: number, message?: string, data?: unknown): AxiosError {
      const response = {
        status,
        data: { message, ...data },
        statusText: 'Error',
        headers: {},
        config: {} as any,
      } as AxiosResponse;

      return {
        response,
        config: {} as any,
        isAxiosError: true,
        toJSON: () => ({}),
        name: 'AxiosError',
        message: 'Request failed',
      };
    }

    it('should throw NetworkError when no response', () => {
      const axiosError = {
        config: {} as any,
        isAxiosError: true,
        toJSON: () => ({}),
        name: 'AxiosError',
        message: 'Network Error',
      } as AxiosError;

      expect(() => handleAxiosError(axiosError)).toThrow(NetworkError);
    });

    it('should throw UnauthorizedError for 401', () => {
      const error = createAxiosError(401, 'Unauthorized');

      expect(() => handleAxiosError(error)).toThrow(UnauthorizedError);
      expect(() => handleAxiosError(error)).toThrow('Unauthorized');
    });

    it('should throw ForbiddenError for 403', () => {
      const error = createAxiosError(403, 'Forbidden');

      expect(() => handleAxiosError(error)).toThrow(ForbiddenError);
    });

    it('should throw NotFoundError for 404', () => {
      const error = createAxiosError(404, 'Not found');

      expect(() => handleAxiosError(error)).toThrow(NotFoundError);
    });

    it('should throw ConflictError for 409', () => {
      const error = createAxiosError(409, 'Conflict');

      expect(() => handleAxiosError(error)).toThrow(ConflictError);
    });

    it('should throw ValidationError for 422', () => {
      const errors = { email: ['Invalid email'] };
      const error = createAxiosError(422, 'Validation failed', { errors });

      expect(() => handleAxiosError(error)).toThrow(ValidationError);

      try {
        handleAxiosError(error);
      } catch (e) {
        expect((e as ValidationError).validationErrors).toEqual(errors);
      }
    });

    it('should throw RateLimitError for 429', () => {
      const error = createAxiosError(429, 'Too many requests');
      error.response!.headers = { 'retry-after': '60' };

      expect(() => handleAxiosError(error)).toThrow(RateLimitError);

      try {
        handleAxiosError(error);
      } catch (e) {
        expect((e as RateLimitError).retryAfter).toBe(60);
      }
    });

    it('should throw RateLimitError for 429 without retry-after header', () => {
      const error = createAxiosError(429, 'Too many requests');

      try {
        handleAxiosError(error);
      } catch (e) {
        expect((e as RateLimitError).retryAfter).toBeUndefined();
      }
    });

    it('should throw ServerError for 500', () => {
      const error = createAxiosError(500, 'Internal server error');

      expect(() => handleAxiosError(error)).toThrow(ServerError);
    });

    it('should throw ServerError for any 5xx status', () => {
      const error502 = createAxiosError(502, 'Bad gateway');
      const error503 = createAxiosError(503, 'Service unavailable');

      expect(() => handleAxiosError(error502)).toThrow(ServerError);
      expect(() => handleAxiosError(error503)).toThrow(ServerError);
    });

    it('should throw generic ApiError for unhandled status codes', () => {
      const error = createAxiosError(418, "I'm a teapot");

      expect(() => handleAxiosError(error)).toThrow(ApiError);
      expect(() => handleAxiosError(error)).not.toThrow(ServerError);

      try {
        handleAxiosError(error);
      } catch (e) {
        expect((e as ApiError).status).toBe(418);
        expect((e as ApiError).message).toBe("I'm a teapot");
      }
    });

    it('should use default message when not provided', () => {
      const error = createAxiosError(400);

      try {
        handleAxiosError(error);
      } catch (e) {
        expect((e as ApiError).message).toBe('Ocorreu um erro.');
      }
    });
  });
});
