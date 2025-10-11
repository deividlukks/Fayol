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
exports.TransactionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const transactions_service_1 = require("./transactions.service");
const create_transaction_dto_1 = require("./dto/create-transaction.dto");
const update_transaction_dto_1 = require("./dto/update-transaction.dto");
const filter_transaction_dto_1 = require("./dto/filter-transaction.dto");
const transfer_dto_1 = require("./dto/transfer.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let TransactionsController = class TransactionsController {
    constructor(transactionsService) {
        this.transactionsService = transactionsService;
    }
    create(user, createTransactionDto) {
        return this.transactionsService.create(user.id, createTransactionDto);
    }
    findAll(user, filters) {
        return this.transactionsService.findAll(user.id, filters);
    }
    findOne(id, user) {
        return this.transactionsService.findOne(id, user.id);
    }
    update(id, user, updateTransactionDto) {
        return this.transactionsService.update(id, user.id, updateTransactionDto);
    }
    remove(id, user) {
        return this.transactionsService.remove(id, user.id);
    }
    effectuate(id, user) {
        return this.transactionsService.effectuate(id, user.id);
    }
    pause(id, user) {
        return this.transactionsService.pause(id, user.id);
    }
    resume(id, user) {
        return this.transactionsService.resume(id, user.id);
    }
    transfer(user, transferDto) {
        return this.transactionsService.createTransfer(user.id, transferDto);
    }
};
exports.TransactionsController = TransactionsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Criar nova transação' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Transação criada com sucesso' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_transaction_dto_1.CreateTransactionDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar transações com filtros' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de transações' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, filter_transaction_dto_1.FilterTransactionDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar transação por ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Transação encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Transação não encontrada' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar transação (apenas não efetivadas)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Transação atualizada' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_transaction_dto_1.UpdateTransactionDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Remover transação (apenas não efetivadas)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Transação removida' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/effectuate'),
    (0, swagger_1.ApiOperation)({ summary: 'Efetivar transação' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Transação efetivada' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "effectuate", null);
__decorate([
    (0, common_1.Patch)(':id/pause'),
    (0, swagger_1.ApiOperation)({ summary: 'Pausar transação recorrente' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Transação pausada' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "pause", null);
__decorate([
    (0, common_1.Patch)(':id/resume'),
    (0, swagger_1.ApiOperation)({ summary: 'Retomar transação recorrente' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Transação retomada' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "resume", null);
__decorate([
    (0, common_1.Post)('transfer'),
    (0, swagger_1.ApiOperation)({ summary: 'Realizar transferência entre contas' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Transferência realizada com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos ou saldo insuficiente' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, transfer_dto_1.TransferDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "transfer", null);
exports.TransactionsController = TransactionsController = __decorate([
    (0, swagger_1.ApiTags)('transactions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('transactions'),
    __metadata("design:paramtypes", [transactions_service_1.TransactionsService])
], TransactionsController);
//# sourceMappingURL=transactions.controller.js.map