"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerService = void 0;
const common_1 = require("@nestjs/common");
const winston_1 = require("winston");
require("winston-daily-rotate-file");
let LoggerService = class LoggerService {
    constructor() {
        this.logger = (0, winston_1.createLogger)({
            level: process.env.LOG_LEVEL || 'info',
            format: winston_1.format.combine(winston_1.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.format.errors({ stack: true }), winston_1.format.splat(), winston_1.format.json()),
            defaultMeta: { service: 'fayol-backend' },
            transports: [
                new winston_1.transports.Console({
                    format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.printf(({ timestamp, level, message, context, ...meta }) => {
                        const contextStr = context ? `[${context}]` : '';
                        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
                        return `${timestamp} ${level} ${contextStr} ${message} ${metaStr}`;
                    })),
                }),
                new winston_1.transports.DailyRotateFile({
                    filename: 'logs/error-%DATE%.log',
                    datePattern: 'YYYY-MM-DD',
                    level: 'error',
                    maxSize: '20m',
                    maxFiles: '30d',
                    format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.json()),
                }),
                new winston_1.transports.DailyRotateFile({
                    filename: 'logs/combined-%DATE%.log',
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '20m',
                    maxFiles: '30d',
                    format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.json()),
                }),
            ],
        });
    }
    setContext(context) {
        this.context = context;
    }
    log(message, context) {
        const logContext = context || this.context;
        this.logger.info(message, { context: logContext });
    }
    error(message, trace, context) {
        const logContext = context || this.context;
        this.logger.error(message, { context: logContext, trace });
    }
    warn(message, context) {
        const logContext = context || this.context;
        this.logger.warn(message, { context: logContext });
    }
    debug(message, context) {
        const logContext = context || this.context;
        this.logger.debug(message, { context: logContext });
    }
    verbose(message, context) {
        const logContext = context || this.context;
        this.logger.verbose(message, { context: logContext });
    }
    logWithMeta(level, message, meta) {
        this.logger.log(level, message, { context: this.context, ...meta });
    }
    logHttpRequest(method, url, statusCode, responseTime, userId) {
        this.logger.info('HTTP Request', {
            context: 'HTTP',
            method,
            url,
            statusCode,
            responseTime: `${responseTime}ms`,
            userId,
        });
    }
    logDatabaseError(operation, error, query) {
        this.logger.error('Database Error', {
            context: 'Database',
            operation,
            error: error.message,
            stack: error.stack,
            query,
        });
    }
    logAuth(action, userId, success = true, metadata) {
        this.logger.info('Auth Action', {
            context: 'Auth',
            action,
            userId,
            success,
            ...metadata,
        });
    }
    logAudit(action, userId, resource, changes) {
        this.logger.info('Audit Log', {
            context: 'Audit',
            action,
            userId,
            resource,
            changes,
            timestamp: new Date().toISOString(),
        });
    }
};
exports.LoggerService = LoggerService;
exports.LoggerService = LoggerService = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.TRANSIENT }),
    __metadata("design:paramtypes", [])
], LoggerService);
//# sourceMappingURL=logger.service.js.map