import { NestInterceptor, ExecutionContext, CallHandler, LoggerService } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare class LoggingInterceptor implements NestInterceptor {
    private readonly logger;
    constructor(logger: LoggerService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private sanitizeBody;
}
