import { LoggerService } from '@nestjs/common';
import * as winston from 'winston';

export class WinstonLogger implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const context = meta?.context ? ` [${meta.context}]` : '';
          const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} ${level}${context}: ${message}${extra}`;
        })
      ),
      transports: [new winston.transports.Console()],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }
  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }
  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }
  debug?(message: string, context?: string) {
    this.logger.debug(message, { context });
  }
  verbose?(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}
