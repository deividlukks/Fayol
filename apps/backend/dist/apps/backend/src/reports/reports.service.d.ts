import { PrismaService } from '../prisma/prisma.service';
export declare class ReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    getDailySummary(userId: string, date: string): Promise<{
        date: string;
        income: number;
        expenses: number;
        balance: number;
        transactionsCount: number;
        transactions: ({
            category: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                type: string;
                icon: string | null;
                color: string | null;
                isSystem: boolean;
                userId: string | null;
                parentId: string | null;
            };
            subcategory: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                isSystem: boolean;
                userId: string | null;
                categoryId: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            categoryId: string;
            description: string | null;
            accountId: string;
            movementType: string;
            launchType: string;
            subcategoryId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            dueDate: Date | null;
            receiptDate: Date | null;
            effectiveDate: Date | null;
            isRecurring: boolean;
            recurrencePeriod: string | null;
            transferId: string | null;
            code: string;
            transferAccountId: string | null;
            isPaused: boolean;
        })[];
    }>;
    getMonthlyReport(userId: string, month: string): Promise<{
        month: string;
        summary: {
            income: number;
            expenses: number;
            balance: number;
            transactionsCount: number;
        };
        expensesByCategory: unknown[];
        incomeByCategory: unknown[];
        transactions: ({
            category: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                type: string;
                icon: string | null;
                color: string | null;
                isSystem: boolean;
                userId: string | null;
                parentId: string | null;
            };
            subcategory: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                isSystem: boolean;
                userId: string | null;
                categoryId: string;
            };
            account: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                type: string;
                userId: string;
                initialBalance: import("@prisma/client/runtime/library").Decimal;
                currency: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            categoryId: string;
            description: string | null;
            accountId: string;
            movementType: string;
            launchType: string;
            subcategoryId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            dueDate: Date | null;
            receiptDate: Date | null;
            effectiveDate: Date | null;
            isRecurring: boolean;
            recurrencePeriod: string | null;
            transferId: string | null;
            code: string;
            transferAccountId: string | null;
            isPaused: boolean;
        })[];
    }>;
    getByCategory(userId: string, startDate: string, endDate: string): Promise<{
        period: {
            startDate: string;
            endDate: string;
        };
        categories: unknown[];
    }>;
    getMonthlyFull(userId: string, month: string): Promise<{
        comparison: {
            incomeDiff: number;
            incomePercentage: number;
            expensesDiff: number;
            expensesPercentage: number;
        };
        previousMonth: {
            month: string;
            summary: {
                income: number;
                expenses: number;
                balance: number;
                transactionsCount: number;
            };
        };
        month: string;
        summary: {
            income: number;
            expenses: number;
            balance: number;
            transactionsCount: number;
        };
        expensesByCategory: unknown[];
        incomeByCategory: unknown[];
        transactions: ({
            category: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                type: string;
                icon: string | null;
                color: string | null;
                isSystem: boolean;
                userId: string | null;
                parentId: string | null;
            };
            subcategory: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                isSystem: boolean;
                userId: string | null;
                categoryId: string;
            };
            account: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                type: string;
                userId: string;
                initialBalance: import("@prisma/client/runtime/library").Decimal;
                currency: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            categoryId: string;
            description: string | null;
            accountId: string;
            movementType: string;
            launchType: string;
            subcategoryId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            dueDate: Date | null;
            receiptDate: Date | null;
            effectiveDate: Date | null;
            isRecurring: boolean;
            recurrencePeriod: string | null;
            transferId: string | null;
            code: string;
            transferAccountId: string | null;
            isPaused: boolean;
        })[];
    }>;
    getYearlyReport(userId: string, year: string): Promise<{
        year: string;
        summary: {
            income: number;
            expenses: number;
            balance: number;
            transactionsCount: number;
        };
        monthlyData: any[];
    }>;
}
