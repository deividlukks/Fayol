"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggers = exports.logger = void 0;
const winston = __importStar(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const path_1 = require("path");
const logsDir = (0, path_1.join)(process.cwd(), 'logs');
// Format for console output
const consoleFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.colorize(), winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
    let msg = `${timestamp} [${level}]`;
    if (context)
        msg += ` [${context}]`;
    msg += ` ${message}`;
    if (Object.keys(meta).length > 0) {
        msg += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return msg;
}));
// Format for file output
const fileFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.errors({ stack: true }), winston.format.json());
// Daily rotate file transport for all logs
const allLogsTransport = new winston_daily_rotate_file_1.default({
    dirname: logsDir,
    filename: 'bot-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: fileFormat,
    level: 'debug',
});
// Daily rotate file transport for errors only
const errorLogsTransport = new winston_daily_rotate_file_1.default({
    dirname: (0, path_1.join)(logsDir, 'errors'),
    filename: 'error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    format: fileFormat,
    level: 'error',
});
// Daily rotate file transport for bot events
const eventsLogsTransport = new winston_daily_rotate_file_1.default({
    dirname: (0, path_1.join)(logsDir, 'events'),
    filename: 'events-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '7d',
    format: fileFormat,
});
exports.logger = winston.createLogger({
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
exports.loggers = {
    info: (message, meta) => {
        exports.logger.info(message, { ...meta });
    },
    error: (message, error, meta) => {
        exports.logger.error(message, {
            ...meta,
            error: error ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
            } : undefined,
        });
    },
    warn: (message, meta) => {
        exports.logger.warn(message, { ...meta });
    },
    debug: (message, meta) => {
        exports.logger.debug(message, { ...meta });
    },
    // Bot-specific loggers
    botEvent: (event, user, meta) => {
        exports.logger.info(`Bot event: ${event}`, {
            context: 'BotEvent',
            userId: user?.id,
            username: user?.username,
            ...meta,
        });
    },
    command: (command, user, meta) => {
        exports.logger.info(`Command executed: ${command}`, {
            context: 'Command',
            userId: user?.id,
            username: user?.username,
            ...meta,
        });
    },
    apiRequest: (method, url, meta) => {
        exports.logger.info(`API Request: ${method} ${url}`, {
            context: 'API',
            method,
            url,
            ...meta,
        });
    },
    apiError: (method, url, error, meta) => {
        exports.logger.error(`API Error: ${method} ${url}`, {
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
    sessionError: (message, userId, meta) => {
        exports.logger.error(message, {
            context: 'Session',
            userId,
            ...meta,
        });
    },
    flowError: (flow, step, error, meta) => {
        exports.logger.error(`Flow error in ${flow} at step ${step}`, {
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
//# sourceMappingURL=logger.js.map