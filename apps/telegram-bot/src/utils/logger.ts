import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { join } from 'path';

const logsDir = join(process.cwd(), 'logs');

// Format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
    let msg = `${timestamp} [${level}]`;
    if (context) msg += ` [${context}]`;
    msg += ` ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return msg;
  }),
);

// Format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Daily rotate file transport for all logs
const allLogsTransport = new DailyRotateFile({
  dirname: logsDir,
  filename: 'bot-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: fileFormat,
  level: 'debug',
});

// Daily rotate file transport for errors only
const errorLogsTransport = new DailyRotateFile({
  dirname: join(logsDir, 'errors'),
  filename: 'error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  format: fileFormat,
  level: 'error',
});

// Daily rotate file transport for bot events
const eventsLogsTransport = new DailyRotateFile({
  dirname: join(logsDir, 'events'),
  filename: 'events-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '7d',
  format: fileFormat,
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // File transports
    allLogsTransport,
    errorLogsTransport,
    eventsLogsTransport,
  ],
});

// Utility functions for structured logging
export const loggers = {
  info: (message: string, meta?: any) => {
    logger.info(message, { ...meta });
  },

  error: (message: string, error?: Error, meta?: any) => {
    logger.error(message, {
      ...meta,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  },

  warn: (message: string, meta?: any) => {
    logger.warn(message, { ...meta });
  },

  debug: (message: string, meta?: any) => {
    logger.debug(message, { ...meta });
  },

  // Bot-specific loggers
  botEvent: (event: string, user: any, meta?: any) => {
    logger.info(`Bot event: ${event}`, {
      context: 'BotEvent',
      userId: user?.id,
      username: user?.username,
      ...meta,
    });
  },

  command: (command: string, user: any, meta?: any) => {
    logger.info(`Command executed: ${command}`, {
      context: 'Command',
      userId: user?.id,
      username: user?.username,
      ...meta,
    });
  },

  apiRequest: (method: string, url: string, meta?: any) => {
    logger.info(`API Request: ${method} ${url}`, {
      context: 'API',
      method,
      url,
      ...meta,
    });
  },

  apiError: (method: string, url: string, error: any, meta?: any) => {
    logger.error(`API Error: ${method} ${url}`, {
      context: 'API',
      method,
      url,
      error: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      },
      ...meta,
    });
  },

  sessionError: (message: string, userId: number, meta?: any) => {
    logger.error(message, {
      context: 'Session',
      userId,
      ...meta,
    });
  },

  flowError: (flow: string, step: string, error: Error, meta?: any) => {
    logger.error(`Flow error in ${flow} at step ${step}`, {
      context: 'Flow',
      flow,
      step,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...meta,
    });
  },
};
