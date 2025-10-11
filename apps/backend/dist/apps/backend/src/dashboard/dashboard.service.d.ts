import { PrismaService } from '../prisma/prisma.service';
export declare class DashboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getBalance(userId: string): Promise<{
        total: number;
        initialBalance: number;
        transactionsBalance: number;
        accounts: number;
        currency: string;
    }>;
    getSummaryCards(userId: string): Promise<{
        month: string;
        income: number;
        expenses: number;
        balance: number;
        transactionsCount: number;
    }>;
    getLatestTransactions(userId: string, limit?: number): Promise<({
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
    })[]>;
    getSpendingByCategory(userId: string): Promise<{
        totalExpenses: number;
        categories: any[];
    }>;
    getFinancialHealth(userId: string): Promise<{
        score: number;
        status: string;
        savingsRate: string;
        recommendations: string[];
    }>;
    private getRecommendations;
    getMonthlyComparison(userId: string, months?: number): Promise<any[]>;
    getPendingTransactions(userId: string): Promise<{
        toPay: {
            count: number;
            total: number;
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
        };
        toReceive: {
            count: number;
            total: number;
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
        };
    }>;
    getActiveRecurring(userId: string): Promise<{
        count: number;
        totalIncome: number;
        totalExpenses: number;
        netImpact: number;
        recurring: ({
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
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            userId: string;
            categoryId: string;
            description: string;
            frequency: string;
            accountId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            startDate: Date;
            endDate: Date | null;
            notes: string | null;
            nextDate: Date;
        })[];
    }>;
    getNetWorthEvolution(userId: string, months?: number): Promise<{
        current: any;
        variation: string;
        trend: string;
        data: any[];
    }>;
    getTopCategories(userId: string, limit?: number, period?: 'month' | 'year'): Promise<{
        period: "month" | "year";
        totalExpenses: number;
        categories: any[];
    }>;
    getCompleteDashboard(userId: string): Promise<{
        balance: {
            total: number;
            initialBalance: number;
            transactionsBalance: number;
            accounts: number;
            currency: string;
        };
        summaryCards: {
            month: string;
            income: number;
            expenses: number;
            balance: number;
            transactionsCount: number;
        };
        latestTransactions: ({
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
        spendingByCategory: {
            totalExpenses: number;
            categories: any[];
        };
        financialHealth: {
            score: number;
            status: string;
            savingsRate: string;
            recommendations: string[];
        };
        monthlyComparison: any[];
        pendingTransactions: {
            toPay: {
                count: number;
                total: number;
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
            };
            toReceive: {
                count: number;
                total: number;
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
            };
        };
        activeRecurring: {
            count: number;
            totalIncome: number;
            totalExpenses: number;
            netImpact: number;
            recurring: ({
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
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                type: string;
                userId: string;
                categoryId: string;
                description: string;
                frequency: string;
                accountId: string;
                amount: import("@prisma/client/runtime/library").Decimal;
                startDate: Date;
                endDate: Date | null;
                notes: string | null;
                nextDate: Date;
            })[];
        };
        netWorthEvolution: {
            current: any;
            variation: string;
            trend: string;
            data: any[];
        };
        topCategories: {
            period: "month" | "year";
            totalExpenses: number;
            categories: any[];
        };
    }>;
}
