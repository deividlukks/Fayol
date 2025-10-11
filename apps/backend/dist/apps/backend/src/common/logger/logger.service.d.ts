import { LoggerService as NestLoggerService } from '@nestjs/common';
import 'winston-daily-rotate-file';
export declare class LoggerService implements NestLoggerService {
    private logger;
    private context?;
    constructor();
    setContext(context: string): void;
    log(message: string, context?: string): void;
    error(message: string, trace?: string, context?: string): void;
    warn(message: string, context?: string): void;
    debug(message: string, context?: string): void;
    verbose(message: string, context?: string): void;
    logWithMeta(level: string, message: string, meta?: Record<string, any>): void;
    logHttpRequest(method: string, url: string, statusCode: number, responseTime: number, userId?: string): void;
    logDatabaseError(operation: string, error: Error, query?: string): void;
    logAuth(action: string, userId?: string, success?: boolean, metadata?: Record<string, any>): void;
    logAudit(action: string, userId: string, resource: string, changes?: Record<string, any>): void;
}
