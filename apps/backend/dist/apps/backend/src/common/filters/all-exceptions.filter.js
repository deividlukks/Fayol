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
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../logger/logger.service");
let AllExceptionsFilter = class AllExceptionsFilter {
    constructor(logger) {
        this.logger = logger;
        this.logger.setContext('ExceptionFilter');
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception instanceof common_1.HttpException ? exception.getStatus() : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const message = exception instanceof common_1.HttpException ? exception.getResponse() : 'Internal server error';
        const errorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message: typeof message === 'string' ? message : message.message,
            error: exception instanceof common_1.HttpException ? exception.message : 'Internal server error',
        };
        this.logger.error(`${request.method} ${request.url} - ${status} - ${errorResponse.error}`, exception instanceof Error ? exception.stack : undefined, 'ExceptionFilter');
        this.logger.error('Error details', JSON.stringify({
            url: request.url,
            method: request.method,
            body: this.sanitize(request.body),
            query: request.query,
            params: request.params,
            statusCode: status,
            error: errorResponse.error,
            message: errorResponse.message,
        }));
        response.status(status).json(errorResponse);
    }
    sanitize(body) {
        if (!body)
            return body;
        const sanitized = { ...body };
        const sensitiveFields = ['password', 'token', 'refreshToken', 'accessToken'];
        for (const field of sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = '***REDACTED***';
            }
        }
        return sanitized;
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [logger_service_1.LoggerService])
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map