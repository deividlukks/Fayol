import { PrismaService } from '../prisma/prisma.service';
import { CreateRecurringTransactionDto } from './dto/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from './dto/update-recurring-transaction.dto';
export declare class RecurringTransactionsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreateRecurringTransactionDto): Promise<{
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
    }>;
    findAll(userId: string): Promise<({
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
    })[]>;
    findOne(userId: string, id: string): Promise<{
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
    }>;
    update(userId: string, id: string, dto: UpdateRecurringTransactionDto): Promise<{
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
    }>;
    remove(userId: string, id: string): Promise<{
        message: string;
    }>;
    pause(userId: string, id: string): Promise<{
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
    }>;
    resume(userId: string, id: string): Promise<{
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
    }>;
    processRecurringTransactions(): Promise<void>;
    private calculateNextDate;
}
