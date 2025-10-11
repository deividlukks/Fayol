import * as winston from 'winston';
export declare const logger: winston.Logger;
export declare const loggers: {
    info: (message: string, meta?: any) => void;
    error: (message: string, error?: Error, meta?: any) => void;
    warn: (message: string, meta?: any) => void;
    debug: (message: string, meta?: any) => void;
    botEvent: (event: string, user: any, meta?: any) => void;
    command: (command: string, user: any, meta?: any) => void;
    apiRequest: (method: string, url: string, meta?: any) => void;
    apiError: (method: string, url: string, error: any, meta?: any) => void;
    sessionError: (message: string, userId: number, meta?: any) => void;
    flowError: (flow: string, step: string, error: Error, meta?: any) => void;
};
//# sourceMappingURL=logger.d.ts.map