import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { join } from 'path';

const logsDir = join(process.cwd(), 'logs');

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

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const allLogsTransport = new DailyRotateFile({
  dirname: logsDir,
  filename: 'whatsapp-bot-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: fileFormat,
  level: 'debug',
});

const errorLogsTransport = new DailyRotateFile({
  dirname: join(logsDir, 'errors'),
  filename: 'error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  format: fileFormat,
  level: 'error',
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
    allLogsTransport,
    errorLogsTransport,
  ],
});

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

  message: (from: string, message: string, meta?: any) => {
    logger.info(`Message from ${from}: ${message}`, {
      context: 'Message',
      from,
      ...meta,
    });
  },

  command: (command: string, from: string, meta?: any) => {
    logger.info(`Command: ${command} from ${from}`, {
      context: 'Command',
      command,
      from,
      ...meta,
    });
  },

  apiRequest: (method: string, url: string, meta?: any) => {
    logger.info(`API: ${method} ${url}`, {
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
};
