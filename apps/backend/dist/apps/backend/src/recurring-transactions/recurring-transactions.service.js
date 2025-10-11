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
exports.RecurringTransactionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const schedule_1 = require("@nestjs/schedule");
let RecurringTransactionsService = class RecurringTransactionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, dto) {
        const account = await this.prisma.account.findFirst({
            where: { id: dto.accountId, userId },
        });
        if (!account) {
            throw new common_1.BadRequestException('Conta não encontrada');
        }
        const category = await this.prisma.category.findFirst({
            where: {
                id: dto.categoryId,
                OR: [{ userId }, { userId: null }],
            },
        });
        if (!category) {
            throw new common_1.BadRequestException('Categoria não encontrada');
        }
        const nextDate = dto.startDate;
        const recurringTransaction = await this.prisma.recurringTransaction.create({
            data: {
                userId,
                accountId: dto.accountId,
                categoryId: dto.categoryId,
                type: dto.type,
                amount: dto.amount,
                description: dto.description,
                frequency: dto.frequency,
                startDate: dto.startDate,
                endDate: dto.endDate,
                nextDate,
                isActive: dto.isActive ?? true,
                notes: dto.notes,
            },
            include: {
                account: true,
                category: true,
            },
        });
        return recurringTransaction;
    }
    async findAll(userId) {
        return this.prisma.recurringTransaction.findMany({
            where: { userId },
            include: {
                account: true,
                category: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(userId, id) {
        const recurringTransaction = await this.prisma.recurringTransaction.findFirst({
            where: { id, userId },
            include: {
                account: true,
                category: true,
            },
        });
        if (!recurringTransaction) {
            throw new common_1.NotFoundException('Transação recorrente não encontrada');
        }
        return recurringTransaction;
    }
    async update(userId, id, dto) {
        await this.findOne(userId, id);
        if (dto.accountId) {
            const account = await this.prisma.account.findFirst({
                where: { id: dto.accountId, userId },
            });
            if (!account) {
                throw new common_1.BadRequestException('Conta não encontrada');
            }
        }
        if (dto.categoryId) {
            const category = await this.prisma.category.findFirst({
                where: {
                    id: dto.categoryId,
                    OR: [{ userId }, { userId: null }],
                },
            });
            if (!category) {
                throw new common_1.BadRequestException('Categoria não encontrada');
            }
        }
        const updated = await this.prisma.recurringTransaction.update({
            where: { id },
            data: dto,
            include: {
                account: true,
                category: true,
            },
        });
        return updated;
    }
    async remove(userId, id) {
        await this.findOne(userId, id);
        await this.prisma.recurringTransaction.delete({
            where: { id },
        });
        return { message: 'Transação recorrente excluída com sucesso' };
    }
    async pause(userId, id) {
        return this.update(userId, id, { isActive: false });
    }
    async resume(userId, id) {
        return this.update(userId, id, { isActive: true });
    }
    async processRecurringTransactions() {
        console.log('[CRON] Processando transações recorrentes...');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueRecurrings = await this.prisma.recurringTransaction.findMany({
            where: {
                isActive: true,
                nextDate: {
                    lte: today,
                },
            },
            include: {
                account: true,
                category: true,
            },
        });
        console.log(`[CRON] ${dueRecurrings.length} transação(ões) recorrente(s) para processar`);
        for (const recurring of dueRecurrings) {
            try {
                const lastTransaction = await this.prisma.transaction.findFirst({
                    orderBy: { code: 'desc' },
                });
                const nextCode = lastTransaction
                    ? String(Number(lastTransaction.code) + 1).padStart(6, '0')
                    : '000001';
                await this.prisma.transaction.create({
                    data: {
                        code: nextCode,
                        userId: recurring.userId,
                        accountId: recurring.accountId,
                        categoryId: recurring.categoryId,
                        movementType: recurring.type === 'INCOME' ? 'income' : 'expense',
                        launchType: recurring.type === 'INCOME' ? 'income' : 'expense',
                        amount: recurring.amount,
                        description: `${recurring.description} (Recorrente)`,
                        effectiveDate: recurring.nextDate,
                        dueDate: recurring.nextDate,
                    },
                });
                const nextDate = this.calculateNextDate(recurring.nextDate, recurring.frequency);
                if (recurring.endDate && nextDate > recurring.endDate) {
                    await this.prisma.recurringTransaction.update({
                        where: { id: recurring.id },
                        data: { isActive: false },
                    });
                    console.log(`[CRON] Transação recorrente ${recurring.id} finalizada (passou endDate)`);
                }
                else {
                    await this.prisma.recurringTransaction.update({
                        where: { id: recurring.id },
                        data: { nextDate },
                    });
                    console.log(`[CRON] Transação recorrente ${recurring.id} processada. Próxima data: ${nextDate}`);
                }
            }
            catch (error) {
                console.error(`[CRON] Erro ao processar transação recorrente ${recurring.id}:`, error);
            }
        }
        console.log('[CRON] Processamento de transações recorrentes concluído');
    }
    calculateNextDate(currentDate, frequency) {
        const next = new Date(currentDate);
        switch (frequency) {
            case 'DAILY':
                next.setDate(next.getDate() + 1);
                break;
            case 'WEEKLY':
                next.setDate(next.getDate() + 7);
                break;
            case 'BIWEEKLY':
                next.setDate(next.getDate() + 14);
                break;
            case 'MONTHLY':
                next.setMonth(next.getMonth() + 1);
                break;
            case 'QUARTERLY':
                next.setMonth(next.getMonth() + 3);
                break;
            case 'YEARLY':
                next.setFullYear(next.getFullYear() + 1);
                break;
            default:
                throw new Error(`Frequência inválida: ${frequency}`);
        }
        return next;
    }
};
exports.RecurringTransactionsService = RecurringTransactionsService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RecurringTransactionsService.prototype, "processRecurringTransactions", null);
exports.RecurringTransactionsService = RecurringTransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RecurringTransactionsService);
//# sourceMappingURL=recurring-transactions.service.js.map