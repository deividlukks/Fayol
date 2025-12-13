import { AxiosError } from 'axios';
import { HTTP_STATUS } from '@fayol/shared-constants';

/**
 * Classe base para erros da API
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Erro de autenticação (401)
 */
export class UnauthorizedError extends ApiError {
  constructor(message = 'Não autorizado. Faça login novamente.') {
    super(message, HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

/**
 * Erro de permissão (403)
 */
export class ForbiddenError extends ApiError {
  constructor(message = 'Acesso negado.') {
    super(message, HTTP_STATUS.FORBIDDEN, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

/**
 * Erro de recurso não encontrado (404)
 */
export class NotFoundError extends ApiError {
  constructor(message = 'Recurso não encontrado.') {
    super(message, HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * Erro de validação (422)
 */
export class ValidationError extends ApiError {
  constructor(message = 'Dados inválidos.', public validationErrors?: Record<string, string[]>) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', validationErrors);
    this.name = 'ValidationError';
  }
}

/**
 * Erro de conflito (409)
 */
export class ConflictError extends ApiError {
  constructor(message = 'Conflito de dados.') {
    super(message, HTTP_STATUS.CONFLICT, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

/**
 * Erro de rate limit (429)
 */
export class RateLimitError extends ApiError {
  constructor(message = 'Muitas requisições. Tente novamente em instantes.', public retryAfter?: number) {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS, 'RATE_LIMIT', { retryAfter });
    this.name = 'RateLimitError';
  }
}

/**
 * Erro do servidor (500+)
 */
export class ServerError extends ApiError {
  constructor(message = 'Erro interno do servidor.', status = HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    super(message, status, 'SERVER_ERROR');
    this.name = 'ServerError';
  }
}

/**
 * Erro de rede (sem resposta do servidor)
 */
export class NetworkError extends ApiError {
  constructor(message = 'Erro de conexão. Verifique sua internet.') {
    super(message, undefined, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

/**
 * Converte erro do Axios para erro customizado
 */
export function handleAxiosError(error: AxiosError): never {
  // Erro de rede (sem resposta)
  if (!error.response) {
    throw new NetworkError();
  }

  const { status, data } = error.response;
  const message = (data as { message?: string })?.message || 'Ocorreu um erro.';

  // Mapeia status HTTP para erro específico
  switch (status) {
    case HTTP_STATUS.UNAUTHORIZED:
      throw new UnauthorizedError(message);

    case HTTP_STATUS.FORBIDDEN:
      throw new ForbiddenError(message);

    case HTTP_STATUS.NOT_FOUND:
      throw new NotFoundError(message);

    case HTTP_STATUS.CONFLICT:
      throw new ConflictError(message);

    case HTTP_STATUS.UNPROCESSABLE_ENTITY:
      const validationErrors = (data as { errors?: Record<string, string[]> })?.errors;
      throw new ValidationError(message, validationErrors);

    case HTTP_STATUS.TOO_MANY_REQUESTS:
      const retryAfter = error.response.headers['retry-after']
        ? parseInt(error.response.headers['retry-after'])
        : undefined;
      throw new RateLimitError(message, retryAfter);

    default:
      if (status >= 500) {
        throw new ServerError(message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
      }
      throw new ApiError(message, status);
  }
}
