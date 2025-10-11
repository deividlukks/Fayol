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
exports.HttpLoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const logger_service_1 = require("../logger/logger.service");
let HttpLoggingInterceptor = class HttpLoggingInterceptor {
    constructor(logger) {
        this.logger = logger;
        this.logger.setContext('HTTP');
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const { method, url, body, user } = request;
        const startTime = Date.now();
        this.logger.log(`Incoming Request: ${method} ${url}`);
        if (body && Object.keys(body).length > 0) {
            const sanitizedBody = { ...body };
            if (sanitizedBody.password) {
                sanitizedBody.password = '***HIDDEN***';
            }
            this.logger.debug(`Request Body: ${JSON.stringify(sanitizedBody)}`);
        }
        return next.handle().pipe((0, operators_1.tap)({
            next: () => {
                const response = context.switchToHttp().getResponse();
                const { statusCode } = response;
                const responseTime = Date.now() - startTime;
                this.logger.logHttpRequest(method, url, statusCode, responseTime, user?.id);
            },
            error: (error) => {
                const responseTime = Date.now() - startTime;
                this.logger.error(`Request Failed: ${method} ${url} - ${error.message}`, error.stack);
                this.logger.logWithMeta('error', 'HTTP Error', {
                    method,
                    url,
                    error: error.message,
                    responseTime,
                    userId: user?.id,
                });
            },
        }));
    }
};
exports.HttpLoggingInterceptor = HttpLoggingInterceptor;
exports.HttpLoggingInterceptor = HttpLoggingInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_service_1.LoggerService])
], HttpLoggingInterceptor);
//# sourceMappingURL=http-logging.interceptor.js.map