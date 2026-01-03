import { BaseError } from './base-error';

/**
 * Interface para logger (pode ser implementada com Winston, Pino, etc)
 */
export interface Logger {
  error(message: string, ...meta: any[]): void;
  warn(message: string, ...meta: any[]): void;
  info(message: string, ...meta: any[]): void;
  debug(message: string, ...meta: any[]): void;
}

/**
 * Handler centralizado de erros
 */
export class ErrorHandler {
  private logger?: Logger;

  constructor(logger?: Logger) {
    this.logger = logger;
  }

  /**
   * Trata um erro e retorna informações formatadas
   */
  handle(error: Error | BaseError) {
    if (this.isOperationalError(error)) {
      this.logger?.error('Operational error occurred', {
        error: error.message,
        stack: error.stack,
        ...(error instanceof BaseError && { details: error.details }),
      });
    } else {
      this.logger?.error('Non-operational error occurred', {
        error: error.message,
        stack: error.stack,
      });
    }

    return this.formatError(error);
  }

  /**
   * Verifica se é um erro operacional
   */
  isOperationalError(error: Error | BaseError): boolean {
    if (error instanceof BaseError) {
      return error.isOperational;
    }
    return false;
  }

  /**
   * Formata o erro para resposta
   */
  formatError(error: Error | BaseError) {
    if (error instanceof BaseError) {
      return {
        statusCode: error.statusCode,
        name: error.name,
        message: error.message,
        timestamp: error.timestamp,
        details: error.details,
      };
    }

    return {
      statusCode: 500,
      name: 'InternalServerError',
      message: error.message || 'An unexpected error occurred',
      timestamp: new Date(),
    };
  }

  /**
   * Determina se o processo deve ser encerrado
   */
  isCriticalError(error: Error | BaseError): boolean {
    // Erros não operacionais são críticos
    if (!this.isOperationalError(error)) {
      return true;
    }

    // Erros 500 também são críticos
    if (error instanceof BaseError && error.statusCode >= 500) {
      return true;
    }

    return false;
  }
}

/**
 * Cria um handler de erro global
 */
export function createErrorHandler(logger?: Logger) {
  return new ErrorHandler(logger);
}

/**
 * Wrapper para funções assíncronas que captura erros
 */
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
): T {
  return ((...args: any[]) => {
    return Promise.resolve(fn(...args)).catch((error) => {
      throw error;
    });
  }) as T;
}
