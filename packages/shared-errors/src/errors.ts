import { BaseError } from './base-error';

/**
 * Erro 400 - Requisição inválida
 */
export class BadRequestError extends BaseError {
  constructor(message = 'Bad Request', details?: any) {
    super(message, 400, true, details);
  }
}

/**
 * Erro 401 - Não autenticado
 */
export class UnauthorizedError extends BaseError {
  constructor(message = 'Unauthorized', details?: any) {
    super(message, 401, true, details);
  }
}

/**
 * Erro 403 - Sem permissão
 */
export class ForbiddenError extends BaseError {
  constructor(message = 'Forbidden', details?: any) {
    super(message, 403, true, details);
  }
}

/**
 * Erro 404 - Recurso não encontrado
 */
export class NotFoundError extends BaseError {
  constructor(resource = 'Resource', details?: any) {
    super(`${resource} not found`, 404, true, details);
  }
}

/**
 * Erro 409 - Conflito (ex: duplicação de chave única)
 */
export class ConflictError extends BaseError {
  constructor(message = 'Conflict', details?: any) {
    super(message, 409, true, details);
  }
}

/**
 * Erro 422 - Entidade não processável (validação falhou)
 */
export class ValidationError extends BaseError {
  constructor(message = 'Validation failed', details?: any) {
    super(message, 422, true, details);
  }
}

/**
 * Erro 429 - Muitas requisições
 */
export class TooManyRequestsError extends BaseError {
  constructor(message = 'Too many requests', details?: any) {
    super(message, 429, true, details);
  }
}

/**
 * Erro 500 - Erro interno do servidor
 */
export class InternalServerError extends BaseError {
  constructor(message = 'Internal server error', details?: any) {
    super(message, 500, false, details);
  }
}

/**
 * Erro 503 - Serviço indisponível
 */
export class ServiceUnavailableError extends BaseError {
  constructor(message = 'Service unavailable', details?: any) {
    super(message, 503, true, details);
  }
}

/**
 * Erro de banco de dados
 */
export class DatabaseError extends BaseError {
  constructor(message = 'Database error', details?: any) {
    super(message, 500, false, details);
  }
}

/**
 * Erro de integração externa
 */
export class ExternalServiceError extends BaseError {
  constructor(service: string, message?: string, details?: any) {
    super(message || `External service error: ${service}`, 502, true, details);
  }
}

/**
 * Erro de negócio (regra de negócio violada)
 */
export class BusinessError extends BaseError {
  constructor(message: string, details?: any) {
    super(message, 400, true, details);
  }
}

/**
 * Erro de autenticação (credenciais inválidas)
 */
export class AuthenticationError extends BaseError {
  constructor(message = 'Authentication failed', details?: any) {
    super(message, 401, true, details);
  }
}

/**
 * Erro de autorização (sem permissão)
 */
export class AuthorizationError extends BaseError {
  constructor(message = 'Authorization failed', details?: any) {
    super(message, 403, true, details);
  }
}

/**
 * Erro de recurso já existente
 */
export class AlreadyExistsError extends BaseError {
  constructor(resource = 'Resource', details?: any) {
    super(`${resource} already exists`, 409, true, details);
  }
}

/**
 * Erro de limite excedido (ex: limite de upload, limite de taxa)
 */
export class LimitExceededError extends BaseError {
  constructor(limit: string, details?: any) {
    super(`Limit exceeded: ${limit}`, 429, true, details);
  }
}
