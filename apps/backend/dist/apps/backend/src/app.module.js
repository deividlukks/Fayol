"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const core_1 = require("@nestjs/core");
const prisma_module_1 = require("./prisma/prisma.module");
const logger_module_1 = require("./common/logger/logger.module");
const auth_module_1 = require("./auth/auth.module");
const admin_module_1 = require("./admin/admin.module");
const users_module_1 = require("./users/users.module");
const accounts_module_1 = require("./accounts/accounts.module");
const categories_module_1 = require("./categories/categories.module");
const transactions_module_1 = require("./transactions/transactions.module");
const recurring_transactions_module_1 = require("./recurring-transactions/recurring-transactions.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const reports_module_1 = require("./reports/reports.module");
const ai_module_1 = require("./ai/ai.module");
const export_module_1 = require("./export/export.module");
const http_logging_interceptor_1 = require("./common/interceptors/http-logging.interceptor");
const correlation_id_middleware_1 = require("./common/middleware/correlation-id.middleware");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(correlation_id_middleware_1.CorrelationIdMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            logger_module_1.LoggerModule,
            auth_module_1.AuthModule,
            admin_module_1.AdminModule,
            users_module_1.UsersModule,
            accounts_module_1.AccountsModule,
            categories_module_1.CategoriesModule,
            transactions_module_1.TransactionsModule,
            recurring_transactions_module_1.RecurringTransactionsModule,
            dashboard_module_1.DashboardModule,
            reports_module_1.ReportsModule,
            ai_module_1.AiModule,
            export_module_1.ExportModule,
        ],
        providers: [
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: http_logging_interceptor_1.HttpLoggingInterceptor,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map