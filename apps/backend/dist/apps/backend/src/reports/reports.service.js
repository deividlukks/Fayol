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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ReportsService = class ReportsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDailySummary(userId, date) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        const transactions = await this.prisma.transaction.findMany({
            where: {
                userId,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                category: true,
                subcategory: true,
            },
        });
        const income = transactions
            .filter((t) => t.movementType === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const expenses = transactions
            .filter((t) => t.movementType === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        return {
            date,
            income,
            expenses,
            balance: income - expenses,
            transactionsCount: transactions.length,
            transactions,
        };
    }
    async getMonthlyReport(userId, month) {
        const [year, monthNum] = month.split('-');
        const startDate = new Date(Number(year), Number(monthNum) - 1, 1);
        const endDate = new Date(Number(year), Number(monthNum), 0, 23, 59, 59, 999);
        const transactions = await this.prisma.transaction.findMany({
            where: {
                userId,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                category: true,
                subcategory: true,
                account: true,
            },
        });
        const income = transactions
            .filter((t) => t.movementType === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const expenses = transactions
            .filter((t) => t.movementType === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const expensesByCategory = transactions
            .filter((t) => t.movementType === 'expense')
            .reduce((acc, t) => {
            const categoryName = t.category.name;
            if (!acc[categoryName]) {
                acc[categoryName] = {
                    category: categoryName,
                    total: 0,
                    count: 0,
                };
            }
            acc[categoryName].total += Number(t.amount);
            acc[categoryName].count += 1;
            return acc;
        }, {});
        const incomeByCategory = transactions
            .filter((t) => t.movementType === 'income')
            .reduce((acc, t) => {
            const categoryName = t.category.name;
            if (!acc[categoryName]) {
                acc[categoryName] = {
                    category: categoryName,
                    total: 0,
                    count: 0,
                };
            }
            acc[categoryName].total += Number(t.amount);
            acc[categoryName].count += 1;
            return acc;
        }, {});
        return {
            month,
            summary: {
                income,
                expenses,
                balance: income - expenses,
                transactionsCount: transactions.length,
            },
            expensesByCategory: Object.values(expensesByCategory),
            incomeByCategory: Object.values(incomeByCategory),
            transactions,
        };
    }
    async getByCategory(userId, startDate, endDate) {
        const transactions = await this.prisma.transaction.findMany({
            where: {
                userId,
                createdAt: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            },
            include: {
                category: true,
                subcategory: true,
            },
        });
        const grouped = transactions.reduce((acc, t) => {
            const categoryName = t.category.name;
            if (!acc[categoryName]) {
                acc[categoryName] = {
                    category: categoryName,
                    type: t.movementType,
                    total: 0,
                    transactions: [],
                };
            }
            acc[categoryName].total += Number(t.amount);
            acc[categoryName].transactions.push(t);
            return acc;
        }, {});
        return {
            period: { startDate, endDate },
            categories: Object.values(grouped),
        };
    }
    async getMonthlyFull(userId, month) {
        const report = await this.getMonthlyReport(userId, month);
        const [year, monthNum] = month.split('-');
        const prevMonth = new Date(Number(year), Number(monthNum) - 2, 1);
        const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
        const prevReport = await this.getMonthlyReport(userId, prevMonthStr);
        const comparison = {
            incomeDiff: report.summary.income - prevReport.summary.income,
            incomePercentage: prevReport.summary.income > 0
                ? ((report.summary.income - prevReport.summary.income) / prevReport.summary.income) * 100
                : 0,
            expensesDiff: report.summary.expenses - prevReport.summary.expenses,
            expensesPercentage: prevReport.summary.expenses > 0
                ? ((report.summary.expenses - prevReport.summary.expenses) /
                    prevReport.summary.expenses) *
                    100
                : 0,
        };
        return {
            ...report,
            comparison,
            previousMonth: {
                month: prevMonthStr,
                summary: prevReport.summary,
            },
        };
    }
    async getYearlyReport(userId, year) {
        const startDate = new Date(Number(year), 0, 1);
        const endDate = new Date(Number(year), 11, 31, 23, 59, 59, 999);
        const transactions = await this.prisma.transaction.findMany({
            where: {
                userId,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                category: true,
            },
        });
        const income = transactions
            .filter((t) => t.movementType === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const expenses = transactions
            .filter((t) => t.movementType === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const monthlyData = [];
        for (let month = 0; month < 12; month++) {
            const monthStart = new Date(Number(year), month, 1);
            const monthEnd = new Date(Number(year), month + 1, 0, 23, 59, 59, 999);
            const monthTransactions = transactions.filter((t) => t.createdAt >= monthStart && t.createdAt <= monthEnd);
            const monthIncome = monthTransactions
                .filter((t) => t.movementType === 'income')
                .reduce((sum, t) => sum + Number(t.amount), 0);
            const monthExpenses = monthTransactions
                .filter((t) => t.movementType === 'expense')
                .reduce((sum, t) => sum + Number(t.amount), 0);
            monthlyData.push({
                month: monthStart.toISOString().slice(0, 7),
                income: monthIncome,
                expenses: monthExpenses,
                balance: monthIncome - monthExpenses,
            });
        }
        return {
            year,
            summary: {
                income,
                expenses,
                balance: income - expenses,
                transactionsCount: transactions.length,
            },
            monthlyData,
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map