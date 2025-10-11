import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../logger/logger.service';

/**
 * Interceptor para logging de requisições HTTP
 * Loga automaticamente todas as requisições com tempo de resposta
 */
@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('HTTP');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;
    const startTime = Date.now();

    // Log da requisição
    this.logger.log(`Incoming Request: ${method} ${url}`);

    if (body && Object.keys(body).length > 0) {
      // Remove senha dos logs
      const sanitizedBody = { ...body };
      if (sanitizedBody.password) {
        sanitizedBody.password = '***HIDDEN***';
      }
      this.logger.debug(`Request Body: ${JSON.stringify(sanitizedBody)}`);
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const responseTime = Date.now() - startTime;

          this.logger.logHttpRequest(method, url, statusCode, responseTime, user?.id);
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          this.logger.error(`Request Failed: ${method} ${url} - ${error.message}`, error.stack);
          this.logger.logWithMeta('error', 'HTTP Error', {
            method,
            url,
            error: error.message,
            responseTime,
            userId: user?.id,
          });
        },
      }),
    );
  }
}
