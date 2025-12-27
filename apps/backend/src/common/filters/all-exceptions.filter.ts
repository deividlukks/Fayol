import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '@fayol/shared-types';
import { ERROR_MESSAGES } from '@fayol/shared-constants';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = ERROR_MESSAGES.SERVER_ERROR;
    let errors: string[] | undefined;

    // Tratamento para exceções HTTP conhecidas (Ex: 404, 400)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const payload = exceptionResponse as any;
        message = payload.message || payload.error || message;
        if (Array.isArray(payload.message)) {
          errors = payload.message;
          message = 'Erro de validação';
        }
      }
    } else if (exception instanceof Error) {
      // Tratamento para erros genéricos
      this.logger.error(`Critical Error: ${exception.message}`, exception.stack);

      // Não expor detalhes de erros internos em produção, exceto se necessário
      if (process.env.NODE_ENV === 'development') {
        message = exception.message;
      }
    }

    const errorResponse: ApiResponse<null> = {
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(errorResponse);
  }
}
