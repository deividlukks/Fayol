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
exports.ExportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ExportService = class ExportService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async exportToCsv(userId, startDate, endDate) {
        const where = { userId };
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        const transactions = await this.prisma.transaction.findMany({
            where,
            include: {
                account: true,
                category: true,
                subcategory: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
        const header = [
            'Código',
            'Data',
            'Tipo de Movimento',
            'Tipo de Lançamento',
            'Conta',
            'Categoria',
            'Subcategoria',
            'Valor',
            'Descrição',
            'Data Vencimento',
            'Data Recebimento',
            'Data Efetivação',
            'Recorrente',
            'Período de Recorrência',
        ];
        const rows = transactions.map((t) => [
            t.code,
            t.createdAt.toISOString(),
            t.movementType,
            t.launchType,
            t.account.name,
            t.category.name,
            t.subcategory?.name || '',
            t.amount.toString(),
            t.description || '',
            t.dueDate?.toISOString() || '',
            t.receiptDate?.toISOString() || '',
            t.effectiveDate?.toISOString() || '',
            t.isRecurring ? 'Sim' : 'Não',
            t.recurrencePeriod || '',
        ]);
        const csv = [header, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
        return {
            filename: `fayol_transactions_${new Date().toISOString().split('T')[0]}.csv`,
            content: csv,
            mimeType: 'text/csv',
        };
    }
    async exportFullBackup(userId) {
        const [user, accounts, transactions, categories, subcategories] = await Promise.all([
            this.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    investorProfile: true,
                    createdAt: true,
                },
            }),
            this.prisma.account.findMany({
                where: { userId },
            }),
            this.prisma.transaction.findMany({
                where: { userId },
                include: {
                    account: true,
                    category: true,
                    subcategory: true,
                },
            }),
            this.prisma.category.findMany({
                where: {
                    OR: [{ isSystem: true }, { userId }],
                },
                include: {
                    subcategories: true,
                },
            }),
            this.prisma.subcategory.findMany({
                where: {
                    OR: [{ isSystem: true }, { userId }],
                },
            }),
        ]);
        const backup = {
            exportDate: new Date().toISOString(),
            user,
            accounts,
            transactions,
            categories,
            subcategories,
        };
        return {
            filename: `fayol_backup_${userId}_${new Date().toISOString().split('T')[0]}.json`,
            content: JSON.stringify(backup, null, 2),
            mimeType: 'application/json',
        };
    }
};
exports.ExportService = ExportService;
exports.ExportService = ExportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExportService);
//# sourceMappingURL=export.service.js.map