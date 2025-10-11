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
exports.AccountsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AccountsService = class AccountsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, createAccountDto) {
        return this.prisma.account.create({
            data: {
                ...createAccountDto,
                userId,
            },
        });
    }
    async findAll(userId) {
        return this.prisma.account.findMany({
            where: {
                userId,
                isActive: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async findOne(id, userId) {
        const account = await this.prisma.account.findUnique({
            where: { id },
        });
        if (!account) {
            throw new common_1.NotFoundException('Conta não encontrada');
        }
        if (account.userId !== userId) {
            throw new common_1.ForbiddenException('Acesso negado');
        }
        return account;
    }
    async update(id, userId, updateAccountDto) {
        await this.findOne(id, userId);
        return this.prisma.account.update({
            where: { id },
            data: updateAccountDto,
        });
    }
    async remove(id, userId) {
        await this.findOne(id, userId);
        const hasTransactions = await this.prisma.transaction.count({
            where: { accountId: id },
        });
        if (hasTransactions > 0) {
            throw new common_1.ForbiddenException('Não é possível excluir uma conta com transações. Desative-a ao invés disso.');
        }
        await this.prisma.account.delete({
            where: { id },
        });
        return { message: 'Conta removida com sucesso' };
    }
};
exports.AccountsService = AccountsService;
exports.AccountsService = AccountsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AccountsService);
//# sourceMappingURL=accounts.service.js.map