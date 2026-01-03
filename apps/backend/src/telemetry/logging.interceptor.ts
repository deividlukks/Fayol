import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * Interceptor para logging estruturado de requisições HTTP
 *
 * Features:
 * - Log de incoming requests com sanitização
 * - Log de responses com tempo de execução
 * - Log de erros com stack trace
 * - Sanitização automática de dados sensíveis
 * - Correlação de requests (correlation ID)
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  /**
   * Campos sensíveis que devem ser redacted dos logs
   */
  private readonly sensitiveFields = [
    'password',
    'passwordHash',
    'token',
    'accessToken',
    'refreshToken',
    'secret',
    'apiKey',
    'creditCard',
    'cvv',
    'ssn',
    'cpf',
    'authorization',
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, url, body, query, params, headers } = request;
    const userAgent = headers['user-agent'] || 'Unknown';
    const ip = request.ip || request.connection.remoteAddress || 'Unknown';

    // Gera correlation ID se não existir
    const correlationId = (headers['x-correlation-id'] as string) || this.generateCorrelationId();

    // Adiciona correlation ID no header da resposta
    response.setHeader('X-Correlation-ID', correlationId);

    const startTime = Date.now();

    // Log da requisição entrante
    this.logger.log({
      type: 'incoming_request',
      correlationId,
      method,
      url,
      query: this.sanitizeData(query),
      params: this.sanitizeData(params),
      body: this.sanitizeData(body),
      userAgent,
      ip,
    });

    return next.handle().pipe(
      tap((data) => {
        const responseTime = Date.now() - startTime;
        const { statusCode } = response;

        // Log de sucesso
        this.logger.log({
          type: 'request_completed',
          correlationId,
          method,
          url,
          statusCode,
          responseTime: `${responseTime}ms`,
          responseSize: data ? JSON.stringify(data).length : 0,
        });
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime;

        // Log de erro
        this.logger.error({
          type: 'request_failed',
          correlationId,
          method,
          url,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
            statusCode: error.status || 500,
          },
          responseTime: `${responseTime}ms`,
        });

        throw error;
      })
    );
  }

  /**
   * Sanitiza dados removendo campos sensíveis
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeData(item));
    }

    const sanitized = { ...data };

    for (const field of this.sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***';
      }

      // Sanitiza também campos nested
      for (const key in sanitized) {
        if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
          sanitized[key] = this.sanitizeData(sanitized[key]);
        }
      }
    }

    return sanitized;
  }

  /**
   * Gera correlation ID único
   */
  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
