import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  LoggerService,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Interceptor para logging de requisições HTTP
 * Registra informações sobre cada requisição e resposta
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;
    const userAgent = request.get('user-agent') || '';
    const ip = request.ip;
    const correlationId = request.headers['x-correlation-id'] || 'N/A';

    const now = Date.now();

    // Log da requisição recebida
    this.logger.log(
      `📨 [${correlationId}] Requisição recebida: ${method} ${url}`,
      LoggingInterceptor.name,
    );

    this.logger.verbose(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        correlationId,
        method,
        url,
        userAgent,
        ip,
        body: method !== 'GET' ? this.sanitizeBody(body) : undefined,
      }),
      LoggingInterceptor.name,
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - now;
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;

          this.logger.log(
            `✅ [${correlationId}] Requisição concluída: ${method} ${url} - ${statusCode} - ${responseTime}ms`,
            LoggingInterceptor.name,
          );

          this.logger.verbose(
            JSON.stringify({
              timestamp: new Date().toISOString(),
              correlationId,
              method,
              url,
              statusCode,
              responseTime: `${responseTime}ms`,
            }),
            LoggingInterceptor.name,
          );
        },
        error: (error) => {
          const responseTime = Date.now() - now;

          this.logger.error(
            `❌ [${correlationId}] Requisição falhou: ${method} ${url} - ${error.status || 500} - ${responseTime}ms`,
            error.stack,
            LoggingInterceptor.name,
          );

          this.logger.verbose(
            JSON.stringify({
              timestamp: new Date().toISOString(),
              correlationId,
              method,
              url,
              statusCode: error.status || 500,
              responseTime: `${responseTime}ms`,
              error: error.message,
            }),
            LoggingInterceptor.name,
          );
        },
      }),
    );
  }

  /**
   * Remove informações sensíveis do body para logging
   */
  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken'];

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });

    return sanitized;
  }
}
