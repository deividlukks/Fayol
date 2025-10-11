import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private logger: LoggerService) {
    this.logger.setContext('ExceptionFilter');
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: typeof message === 'string' ? message : (message as any).message,
      error: exception instanceof HttpException ? exception.message : 'Internal server error',
    };

    // Log the error
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${errorResponse.error}`,
      exception instanceof Error ? exception.stack : undefined,
      'ExceptionFilter',
    );

    // Log additional error details
    this.logger.error(
      'Error details',
      JSON.stringify({
        url: request.url,
        method: request.method,
        body: this.sanitize(request.body),
        query: request.query,
        params: request.params,
        statusCode: status,
        error: errorResponse.error,
        message: errorResponse.message,
      }),
    );

    response.status(status).json(errorResponse);
  }

  private sanitize(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'refreshToken', 'accessToken'];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
