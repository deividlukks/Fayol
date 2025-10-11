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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const dashboard_service_1 = require("./dashboard.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let DashboardController = class DashboardController {
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    getBalance(user) {
        return this.dashboardService.getBalance(user.id);
    }
    getSummaryCards(user) {
        return this.dashboardService.getSummaryCards(user.id);
    }
    getLatestTransactions(user, limit) {
        return this.dashboardService.getLatestTransactions(user.id, limit ? Number(limit) : 10);
    }
    getSpendingByCategory(user) {
        return this.dashboardService.getSpendingByCategory(user.id);
    }
    getFinancialHealth(user) {
        return this.dashboardService.getFinancialHealth(user.id);
    }
    getMonthlyComparison(user, months) {
        return this.dashboardService.getMonthlyComparison(user.id, months ? Number(months) : 6);
    }
    getPendingTransactions(user) {
        return this.dashboardService.getPendingTransactions(user.id);
    }
    getActiveRecurring(user) {
        return this.dashboardService.getActiveRecurring(user.id);
    }
    getNetWorthEvolution(user, months) {
        return this.dashboardService.getNetWorthEvolution(user.id, months ? Number(months) : 12);
    }
    getTopCategories(user, limit, period) {
        return this.dashboardService.getTopCategories(user.id, limit ? Number(limit) : 5, period || 'month');
    }
    getCompleteDashboard(user) {
        return this.dashboardService.getCompleteDashboard(user.id);
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('balance'),
    (0, swagger_1.ApiOperation)({ summary: 'Obter saldo total' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Get)('summary-cards'),
    (0, swagger_1.ApiOperation)({ summary: 'Cards de resumo do mês atual' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getSummaryCards", null);
__decorate([
    (0, common_1.Get)('latest-transactions'),
    (0, swagger_1.ApiOperation)({ summary: 'Últimas transações' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, example: 10 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getLatestTransactions", null);
__decorate([
    (0, common_1.Get)('spending-by-category'),
    (0, swagger_1.ApiOperation)({ summary: 'Gastos por categoria do mês atual' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getSpendingByCategory", null);
__decorate([
    (0, common_1.Get)('financial-health'),
    (0, swagger_1.ApiOperation)({ summary: 'Score de saúde financeira' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getFinancialHealth", null);
__decorate([
    (0, common_1.Get)('monthly-comparison'),
    (0, swagger_1.ApiOperation)({ summary: 'Comparação mensal de gastos (últimos 6 meses)' }),
    (0, swagger_1.ApiQuery)({ name: 'months', required: false, example: 6 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('months')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getMonthlyComparison", null);
__decorate([
    (0, common_1.Get)('pending-transactions'),
    (0, swagger_1.ApiOperation)({ summary: 'Contas pendentes (a pagar e a receber)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getPendingTransactions", null);
__decorate([
    (0, common_1.Get)('active-recurring'),
    (0, swagger_1.ApiOperation)({ summary: 'Transações recorrentes ativas' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getActiveRecurring", null);
__decorate([
    (0, common_1.Get)('net-worth-evolution'),
    (0, swagger_1.ApiOperation)({ summary: 'Evolução patrimonial (últimos 12 meses)' }),
    (0, swagger_1.ApiQuery)({ name: 'months', required: false, example: 12 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('months')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getNetWorthEvolution", null);
__decorate([
    (0, common_1.Get)('top-categories'),
    (0, swagger_1.ApiOperation)({ summary: 'Top categorias de gastos' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, example: 5 }),
    (0, swagger_1.ApiQuery)({ name: 'period', required: false, enum: ['month', 'year'], example: 'month' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getTopCategories", null);
__decorate([
    (0, common_1.Get)('complete'),
    (0, swagger_1.ApiOperation)({ summary: 'Dashboard completo com todos os widgets' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getCompleteDashboard", null);
exports.DashboardController = DashboardController = __decorate([
    (0, swagger_1.ApiTags)('dashboard'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('dashboard'),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map