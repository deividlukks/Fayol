import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as Sentry from '@sentry/node';
import { Request } from 'express';

/**
 * Interceptor para captura automática de erros com Sentry
 *
 * Features:
 * - Captura automática de exceções não tratadas
 * - Adiciona contexto da requisição (método, URL, usuário)
 * - Adiciona tags customizadas
 * - Adiciona breadcrumbs para debugging
 * - Sanitiza dados sensíveis antes de enviar
 */
@Injectable()
export class SentryInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SentryInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Verifica se Sentry está configurado
    if (!process.env.SENTRY_DSN) {
      return next.handle();
    }

    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();

    // Cria um novo scope para isolar contexto desta requisição
    return next.handle().pipe(
      catchError((error) => {
        Sentry.withScope((scope) => {
          // Adiciona contexto HTTP
          scope.setContext('http', {
            method: request.method,
            url: request.url,
            headers: this.sanitizeHeaders(request.headers),
            query: request.query,
            params: request.params,
          });

          // Adiciona informações do usuário (se disponível)
          if (request.user) {
            scope.setUser({
              id: (request.user as any)?.id,
              email: (request.user as any)?.email,
              username: (request.user as any)?.name,
            });
          }

          // Adiciona tags para filtros no Sentry
          scope.setTag('route', request.route?.path || request.url);
          scope.setTag('method', request.method);
          scope.setTag('status_code', error.status || 500);

          // Adiciona contexto adicional
          scope.setExtra('correlation_id', request.headers['x-correlation-id']);
          scope.setExtra('user_agent', request.headers['user-agent']);
          scope.setExtra('ip', request.ip);

          // Adiciona breadcrumb
          Sentry.addBreadcrumb({
            category: 'http',
            message: `${request.method} ${request.url}`,
            level: 'error',
            data: {
              statusCode: error.status,
              errorName: error.name,
            },
          });

          // Captura o erro
          Sentry.captureException(error);

          this.logger.error(`Error captured by Sentry: ${error.message}`, error.stack);
        });

        // Re-lança o erro para que os filtros de exceção possam processá-lo
        return throwError(() => error);
      })
    );
  }

  /**
   * Remove headers sensíveis antes de enviar para o Sentry
   */
  private sanitizeHeaders(headers: any): any {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-access-token'];

    const sanitized = { ...headers };

    for (const header of sensitiveHeaders) {
      if (header in sanitized) {
        sanitized[header] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
