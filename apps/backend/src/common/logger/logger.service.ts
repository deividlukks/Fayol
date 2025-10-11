import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import { createLogger, format, transports, Logger as WinstonLogger } from 'winston';
import 'winston-daily-rotate-file';

/**
 * Serviço customizado de logging
 * Usa Winston para logs estruturados e rotação diária
 */
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private logger: WinstonLogger;
  private context?: string;

  constructor() {
    this.logger = createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.splat(),
        format.json(),
      ),
      defaultMeta: { service: 'fayol-backend' },
      transports: [
        // Console transport (desenvolvimento)
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.printf(({ timestamp, level, message, context, ...meta }) => {
              const contextStr = context ? `[${context}]` : '';
              const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
              return `${timestamp} ${level} ${contextStr} ${message} ${metaStr}`;
            }),
          ),
        }),

        // File transport - Erros
        new transports.DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '30d',
          format: format.combine(format.timestamp(), format.json()),
        }),

        // File transport - Todos os logs
        new transports.DailyRotateFile({
          filename: 'logs/combined-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          format: format.combine(format.timestamp(), format.json()),
        }),
      ],
    });
  }

  /**
   * Define o contexto do logger
   * @param context Nome do contexto (normalmente o nome da classe)
   */
  setContext(context: string) {
    this.context = context;
  }

  /**
   * Log de nível INFO
   */
  log(message: string, context?: string) {
    const logContext = context || this.context;
    this.logger.info(message, { context: logContext });
  }

  /**
   * Log de nível ERROR
   */
  error(message: string, trace?: string, context?: string) {
    const logContext = context || this.context;
    this.logger.error(message, { context: logContext, trace });
  }

  /**
   * Log de nível WARN
   */
  warn(message: string, context?: string) {
    const logContext = context || this.context;
    this.logger.warn(message, { context: logContext });
  }

  /**
   * Log de nível DEBUG
   */
  debug(message: string, context?: string) {
    const logContext = context || this.context;
    this.logger.debug(message, { context: logContext });
  }

  /**
   * Log de nível VERBOSE
   */
  verbose(message: string, context?: string) {
    const logContext = context || this.context;
    this.logger.verbose(message, { context: logContext });
  }

  /**
   * Log estruturado com metadata adicional
   */
  logWithMeta(level: string, message: string, meta?: Record<string, any>) {
    this.logger.log(level, message, { context: this.context, ...meta });
  }

  /**
   * Log de requisição HTTP
   */
  logHttpRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    userId?: string,
  ) {
    this.logger.info('HTTP Request', {
      context: 'HTTP',
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`,
      userId,
    });
  }

  /**
   * Log de erro de banco de dados
   */
  logDatabaseError(operation: string, error: Error, query?: string) {
    this.logger.error('Database Error', {
      context: 'Database',
      operation,
      error: error.message,
      stack: error.stack,
      query,
    });
  }

  /**
   * Log de autenticação
   */
  logAuth(
    action: string,
    userId?: string,
    success: boolean = true,
    metadata?: Record<string, any>,
  ) {
    this.logger.info('Auth Action', {
      context: 'Auth',
      action,
      userId,
      success,
      ...metadata,
    });
  }

  /**
   * Log de auditoria (para compliance)
   */
  logAudit(action: string, userId: string, resource: string, changes?: Record<string, any>) {
    this.logger.info('Audit Log', {
      context: 'Audit',
      action,
      userId,
      resource,
      changes,
      timestamp: new Date().toISOString(),
    });
  }
}
