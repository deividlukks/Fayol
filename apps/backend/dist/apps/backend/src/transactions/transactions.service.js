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
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TransactionsService = class TransactionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, createTransactionDto) {
        const { accountId, categoryId, subcategoryId, ...data } = createTransactionDto;
        const account = await this.prisma.account.findFirst({
            where: { id: accountId, userId },
        });
        if (!account) {
            throw new common_1.ForbiddenException('Conta não encontrada ou não pertence ao usuário');
        }
        const category = await this.prisma.category.findUnique({
            where: { id: categoryId },
        });
        if (!category) {
            throw new common_1.NotFoundException('Categoria não encontrada');
        }
        const lastTransaction = await this.prisma.transaction.findFirst({
            orderBy: { code: 'desc' },
        });
        const nextCode = lastTransaction
            ? String(Number(lastTransaction.code) + 1).padStart(6, '0')
            : '000001';
        return this.prisma.transaction.create({
            data: {
                ...data,
                code: nextCode,
                userId,
                accountId,
                categoryId,
                subcategoryId: subcategoryId || null,
            },
            include: {
                account: true,
                category: true,
                subcategory: true,
            },
        });
    }
    async findAll(userId, filters) {
        const { movementType, accountId, categoryId, startDate, endDate, page = 1, limit = 50, } = filters || {};
        const where = { userId };
        if (movementType) {
            where.movementType = movementType;
        }
        if (accountId) {
            where.accountId = accountId;
        }
        if (categoryId) {
            where.categoryId = categoryId;
        }
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate);
            }
        }
        const [transactions, total] = await Promise.all([
            this.prisma.transaction.findMany({
                where,
                include: {
                    account: true,
                    category: true,
                    subcategory: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.transaction.count({ where }),
        ]);
        return {
            data: transactions,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id, userId) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id },
            include: {
                account: true,
                category: true,
                subcategory: true,
            },
        });
        if (!transaction) {
            throw new common_1.NotFoundException('Transação não encontrada');
        }
        if (transaction.userId !== userId) {
            throw new common_1.ForbiddenException('Acesso negado');
        }
        return transaction;
    }
    async update(id, userId, updateTransactionDto) {
        const transaction = await this.findOne(id, userId);
        if (transaction.effectiveDate) {
            throw new common_1.BadRequestException('Não é possível editar uma transação já efetivada');
        }
        return this.prisma.transaction.update({
            where: { id },
            data: updateTransactionDto,
            include: {
                account: true,
                category: true,
                subcategory: true,
            },
        });
    }
    async remove(id, userId) {
        const transaction = await this.findOne(id, userId);
        if (transaction.effectiveDate) {
            throw new common_1.BadRequestException('Não é possível excluir uma transação já efetivada');
        }
        await this.prisma.transaction.delete({
            where: { id },
        });
        return { message: 'Transação removida com sucesso' };
    }
    async effectuate(id, userId) {
        const transaction = await this.findOne(id, userId);
        if (transaction.effectiveDate) {
            throw new common_1.BadRequestException('Transação já efetivada');
        }
        return this.prisma.transaction.update({
            where: { id },
            data: {
                effectiveDate: new Date(),
            },
            include: {
                account: true,
                category: true,
                subcategory: true,
            },
        });
    }
    async pause(id, userId) {
        const transaction = await this.findOne(id, userId);
        if (!transaction.isRecurring) {
            throw new common_1.BadRequestException('Apenas transações recorrentes podem ser pausadas');
        }
        return this.prisma.transaction.update({
            where: { id },
            data: { isPaused: true },
        });
    }
    async resume(id, userId) {
        const transaction = await this.findOne(id, userId);
        if (!transaction.isRecurring) {
            throw new common_1.BadRequestException('Apenas transações recorrentes podem ser retomadas');
        }
        return this.prisma.transaction.update({
            where: { id },
            data: { isPaused: false },
        });
    }
    async createTransfer(userId, transferDto) {
        const { fromAccountId, toAccountId, amount, description } = transferDto;
        const [fromAccount, toAccount] = await Promise.all([
            this.prisma.account.findFirst({
                where: { id: fromAccountId, userId },
            }),
            this.prisma.account.findFirst({
                where: { id: toAccountId, userId },
            }),
        ]);
        if (!fromAccount) {
            throw new common_1.BadRequestException('Conta de origem não encontrada');
        }
        if (!toAccount) {
            throw new common_1.BadRequestException('Conta de destino não encontrada');
        }
        if (fromAccountId === toAccountId) {
            throw new common_1.BadRequestException('Conta de origem e destino não podem ser a mesma');
        }
        let transferCategory = await this.prisma.category.findFirst({
            where: {
                name: 'Transferência',
                isSystem: true,
            },
        });
        if (!transferCategory) {
            transferCategory = await this.prisma.category.create({
                data: {
                    name: 'Transferência',
                    type: 'expense',
                    isSystem: true,
                },
            });
        }
        const lastTransaction = await this.prisma.transaction.findFirst({
            orderBy: { code: 'desc' },
        });
        const nextCodeNum = lastTransaction ? Number(lastTransaction.code) + 1 : 1;
        const debitCode = String(nextCodeNum).padStart(6, '0');
        const creditCode = String(nextCodeNum + 1).padStart(6, '0');
        const result = await this.prisma.$transaction(async (prisma) => {
            const debitTransaction = await prisma.transaction.create({
                data: {
                    code: debitCode,
                    userId,
                    accountId: fromAccountId,
                    movementType: 'expense',
                    launchType: 'transfer',
                    categoryId: transferCategory.id,
                    amount,
                    description: description || `Transferência para ${toAccount.name}`,
                    effectiveDate: new Date(),
                    transferAccountId: toAccountId,
                },
            });
            const creditTransaction = await prisma.transaction.create({
                data: {
                    code: creditCode,
                    userId,
                    accountId: toAccountId,
                    movementType: 'income',
                    launchType: 'transfer',
                    categoryId: transferCategory.id,
                    amount,
                    description: description || `Transferência de ${fromAccount.name}`,
                    effectiveDate: new Date(),
                    transferAccountId: fromAccountId,
                    transferId: debitTransaction.id,
                },
            });
            await prisma.transaction.update({
                where: { id: debitTransaction.id },
                data: { transferId: creditTransaction.id },
            });
            return { debitTransaction, creditTransaction };
        });
        const [debit, credit] = await Promise.all([
            this.prisma.transaction.findUnique({
                where: { id: result.debitTransaction.id },
                include: {
                    account: true,
                    category: true,
                },
            }),
            this.prisma.transaction.findUnique({
                where: { id: result.creditTransaction.id },
                include: {
                    account: true,
                    category: true,
                },
            }),
        ]);
        return {
            message: 'Transferência realizada com sucesso',
            transfer: {
                from: debit,
                to: credit,
                amount,
            },
        };
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map