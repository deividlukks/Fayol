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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const reports_service_1 = require("./reports.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let ReportsController = class ReportsController {
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    getDailySummary(user, date) {
        return this.reportsService.getDailySummary(user.id, date);
    }
    getMonthlyReport(user, month) {
        return this.reportsService.getMonthlyReport(user.id, month);
    }
    getByCategory(user, startDate, endDate) {
        return this.reportsService.getByCategory(user.id, startDate, endDate);
    }
    getMonthlyFull(user, month) {
        return this.reportsService.getMonthlyFull(user.id, month);
    }
    getYearlyReport(user, year) {
        return this.reportsService.getYearlyReport(user.id, year);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('daily-summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Resumo diário de transações' }),
    (0, swagger_1.ApiQuery)({ name: 'date', example: '2024-01-15' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getDailySummary", null);
__decorate([
    (0, common_1.Get)('monthly'),
    (0, swagger_1.ApiOperation)({ summary: 'Relatório mensal' }),
    (0, swagger_1.ApiQuery)({ name: 'month', example: '2024-01' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getMonthlyReport", null);
__decorate([
    (0, common_1.Get)('by-category'),
    (0, swagger_1.ApiOperation)({ summary: 'Relatório por categoria' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', example: '2024-01-01' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', example: '2024-01-31' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getByCategory", null);
__decorate([
    (0, common_1.Get)('monthly-full'),
    (0, swagger_1.ApiOperation)({ summary: 'Relatório mensal completo com comparação' }),
    (0, swagger_1.ApiQuery)({ name: 'month', example: '2024-01' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getMonthlyFull", null);
__decorate([
    (0, common_1.Get)('yearly'),
    (0, swagger_1.ApiOperation)({ summary: 'Relatório anual' }),
    (0, swagger_1.ApiQuery)({ name: 'year', example: '2024' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getYearlyReport", null);
exports.ReportsController = ReportsController = __decorate([
    (0, swagger_1.ApiTags)('reports'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map