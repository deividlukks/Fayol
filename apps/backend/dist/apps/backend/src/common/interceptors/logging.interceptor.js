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
var LoggingInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let LoggingInterceptor = LoggingInterceptor_1 = class LoggingInterceptor {
    constructor(logger) {
        this.logger = logger;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const { method, url, body } = request;
        const userAgent = request.get('user-agent') || '';
        const ip = request.ip;
        const correlationId = request.headers['x-correlation-id'] || 'N/A';
        const now = Date.now();
        this.logger.log(`📨 [${correlationId}] Requisição recebida: ${method} ${url}`, LoggingInterceptor_1.name);
        this.logger.verbose(JSON.stringify({
            timestamp: new Date().toISOString(),
            correlationId,
            method,
            url,
            userAgent,
            ip,
            body: method !== 'GET' ? this.sanitizeBody(body) : undefined,
        }), LoggingInterceptor_1.name);
        return next.handle().pipe((0, operators_1.tap)({
            next: (data) => {
                const responseTime = Date.now() - now;
                const response = context.switchToHttp().getResponse();
                const { statusCode } = response;
                this.logger.log(`✅ [${correlationId}] Requisição concluída: ${method} ${url} - ${statusCode} - ${responseTime}ms`, LoggingInterceptor_1.name);
                this.logger.verbose(JSON.stringify({
                    timestamp: new Date().toISOString(),
                    correlationId,
                    method,
                    url,
                    statusCode,
                    responseTime: `${responseTime}ms`,
                }), LoggingInterceptor_1.name);
            },
            error: (error) => {
                const responseTime = Date.now() - now;
                this.logger.error(`❌ [${correlationId}] Requisição falhou: ${method} ${url} - ${error.status || 500} - ${responseTime}ms`, error.stack, LoggingInterceptor_1.name);
                this.logger.verbose(JSON.stringify({
                    timestamp: new Date().toISOString(),
                    correlationId,
                    method,
                    url,
                    statusCode: error.status || 500,
                    responseTime: `${responseTime}ms`,
                    error: error.message,
                }), LoggingInterceptor_1.name);
            },
        }));
    }
    sanitizeBody(body) {
        if (!body)
            return body;
        const sanitized = { ...body };
        const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken'];
        sensitiveFields.forEach((field) => {
            if (sanitized[field]) {
                sanitized[field] = '***REDACTED***';
            }
        });
        return sanitized;
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = LoggingInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map