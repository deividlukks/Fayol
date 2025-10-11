import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
export declare class AllExceptionsFilter implements ExceptionFilter {
    private logger;
    constructor(logger: LoggerService);
    catch(exception: unknown, host: ArgumentsHost): void;
    private sanitize;
}
