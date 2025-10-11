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
exports.RecurringTransactionsController = void 0;
const common_1 = require("@nestjs/common");
const recurring_transactions_service_1 = require("./recurring-transactions.service");
const create_recurring_transaction_dto_1 = require("./dto/create-recurring-transaction.dto");
const update_recurring_transaction_dto_1 = require("./dto/update-recurring-transaction.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const swagger_1 = require("@nestjs/swagger");
let RecurringTransactionsController = class RecurringTransactionsController {
    constructor(recurringTransactionsService) {
        this.recurringTransactionsService = recurringTransactionsService;
    }
    create(req, dto) {
        return this.recurringTransactionsService.create(req.user.sub, dto);
    }
    findAll(req) {
        return this.recurringTransactionsService.findAll(req.user.sub);
    }
    findOne(req, id) {
        return this.recurringTransactionsService.findOne(req.user.sub, id);
    }
    update(req, id, dto) {
        return this.recurringTransactionsService.update(req.user.sub, id, dto);
    }
    remove(req, id) {
        return this.recurringTransactionsService.remove(req.user.sub, id);
    }
    pause(req, id) {
        return this.recurringTransactionsService.pause(req.user.sub, id);
    }
    resume(req, id) {
        return this.recurringTransactionsService.resume(req.user.sub, id);
    }
};
exports.RecurringTransactionsController = RecurringTransactionsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Criar transação recorrente' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Transação recorrente criada com sucesso',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_recurring_transaction_dto_1.CreateRecurringTransactionDto]),
    __metadata("design:returntype", void 0)
], RecurringTransactionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar todas as transações recorrentes' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Lista de transações recorrentes',
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RecurringTransactionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar transação recorrente por ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Transação recorrente encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Transação recorrente não encontrada' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RecurringTransactionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar transação recorrente' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Transação recorrente atualizada com sucesso',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Transação recorrente não encontrada' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_recurring_transaction_dto_1.UpdateRecurringTransactionDto]),
    __metadata("design:returntype", void 0)
], RecurringTransactionsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Excluir transação recorrente' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Transação recorrente excluída com sucesso',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Transação recorrente não encontrada' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RecurringTransactionsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/pause'),
    (0, swagger_1.ApiOperation)({ summary: 'Pausar transação recorrente' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Transação recorrente pausada com sucesso',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Transação recorrente não encontrada' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RecurringTransactionsController.prototype, "pause", null);
__decorate([
    (0, common_1.Post)(':id/resume'),
    (0, swagger_1.ApiOperation)({ summary: 'Retomar transação recorrente' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Transação recorrente retomada com sucesso',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Transação recorrente não encontrada' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RecurringTransactionsController.prototype, "resume", null);
exports.RecurringTransactionsController = RecurringTransactionsController = __decorate([
    (0, swagger_1.ApiTags)('Recurring Transactions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('recurring-transactions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [recurring_transactions_service_1.RecurringTransactionsService])
], RecurringTransactionsController);
//# sourceMappingURL=recurring-transactions.controller.js.map